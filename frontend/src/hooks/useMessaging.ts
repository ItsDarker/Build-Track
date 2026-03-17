'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ClientEncryption } from '@/lib/encryption/client';
import {
  Conversation,
  ConversationWithMembers,
  DecryptedMessage,
  Message,
  SendMessagePayload,
} from '@/types/messaging';
import { message as antMessage } from 'antd';

/**
 * useMessaging Hook
 * Manages conversation state, message polling, encryption/decryption
 */
export function useMessaging(conversationId: string, pollIntervalMs: number = 3000) {
  // State
  const [conversation, setConversation] = useState<ConversationWithMembers | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  // Refs for polling and request cancellation
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPolledAtRef = useRef<Date>(new Date());
  const messageIdsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Load conversation details and decrypt shared key
   */
  const loadConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getConversation(conversationId);
      if (response.error) {
        setError(response.error);
        return;
      }

      const convData = response.data as { conversation: ConversationWithMembers };
      if (!convData?.conversation) {
        setError('Conversation not found');
        return;
      }

      const conv = convData.conversation;
      setConversation(conv);

      // Import shared key for decryption
      if (conv.decryptedSharedKeyForCurrentUser) {
        try {
          const key = await ClientEncryption.importKeyFromHex(
            conv.decryptedSharedKeyForCurrentUser
          );
          setSharedKey(key);
        } catch (err) {
          console.error('Failed to import shared key:', err);
          setError('Failed to setup decryption. Please refresh.');
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  /**
   * Decrypt a single message
   */
  const decryptMessage = useCallback(
    async (encryptedMsg: Message): Promise<DecryptedMessage> => {
      if (!sharedKey) {
        return {
          ...encryptedMsg,
          decryptedContent: '',
          decryptionFailed: true,
          decryptionError: 'Decryption key not available',
        };
      }

      try {
        const plaintext = await ClientEncryption.decryptMessage(
          encryptedMsg.encryptedContent,
          encryptedMsg.encryptionIv,
          encryptedMsg.authTag,
          sharedKey
        );

        return {
          ...encryptedMsg,
          decryptedContent: plaintext,
          decryptionFailed: false,
        };
      } catch (err) {
        console.error(`Failed to decrypt message ${encryptedMsg.id}:`, err);
        return {
          ...encryptedMsg,
          decryptedContent: '',
          decryptionFailed: true,
          decryptionError: (err as Error).message,
        };
      }
    },
    [sharedKey]
  );

  /**
   * Load messages with pagination
   */
  const loadMessages = useCallback(
    async (resetPagination = false) => {
      if (!sharedKey) {
        setError('Decryption key not available');
        return;
      }

      try {
        setIsLoading(true);
        const page = resetPagination ? 0 : currentPage;

        const response = await apiClient.getMessages(conversationId, {
          limit: pageSize,
          offset: page * pageSize,
        });

        if (response.error) {
          setError(response.error);
          return;
        }

        const msgData = response.data as {
          messages: Message[];
          total: number;
          hasMore: boolean;
        };

        // Decrypt all messages
        const decrypted = await Promise.all(
          msgData.messages.map((msg) => decryptMessage(msg))
        );

        // Update tracking
        decrypted.forEach((msg) => messageIdsRef.current.add(msg.id));

        if (resetPagination) {
          setMessages(decrypted);
          setCurrentPage(0);
        } else {
          setMessages((prev) => [...decrypted, ...prev]); // Older messages go to top
        }

        setHasMoreMessages(msgData.hasMore);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, sharedKey, currentPage, pageSize, decryptMessage]
  );

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoading) return;

    setCurrentPage((prev) => prev + 1);
    await loadMessages(false);
  }, [hasMoreMessages, isLoading, loadMessages]);

  /**
   * Setup polling for new messages
   */
  const setupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!conversation || !sharedKey) return;

      try {
        // Fetch latest messages since last poll
        const response = await apiClient.getMessages(conversationId, {
          limit: pageSize,
          offset: 0,
        });

        if (response.error) return;

        const msgData = response.data as {
          messages: Message[];
          total: number;
          hasMore: boolean;
        };

        // Find new messages
        const newMessages = msgData.messages.filter(
          (msg) => !messageIdsRef.current.has(msg.id)
        );

        if (newMessages.length > 0) {
          // Decrypt new messages
          const decrypted = await Promise.all(
            newMessages.map((msg) => decryptMessage(msg))
          );

          // Add to state
          decrypted.forEach((msg) => messageIdsRef.current.add(msg.id));
          setMessages((prev) => [...prev, ...decrypted]);
        }

        lastPolledAtRef.current = new Date();
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, pollIntervalMs);
  }, [conversation, sharedKey, conversationId, pageSize, pollIntervalMs, decryptMessage]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (plaintext: string) => {
      if (!plaintext.trim()) {
        setError('Message cannot be empty');
        return;
      }

      if (plaintext.length > 4000) {
        setError('Message exceeds 4000 character limit');
        return;
      }

      if (!sharedKey || !conversation) {
        setError('Conversation not ready');
        return;
      }

      try {
        setIsSending(true);
        setError(null);

        // Encrypt message
        const encrypted = await ClientEncryption.encryptMessage(plaintext, sharedKey);

        // Create optimistic message
        const optimisticMsg: DecryptedMessage = {
          id: `temp-${Date.now()}`,
          conversationId: conversation.id,
          senderId: 'me', // Placeholder
          sender: {
            id: 'me',
            email: '',
            displayName: 'Me',
          },
          encryptedContent: encrypted.encryptedContent,
          encryptionIv: encrypted.iv,
          authTag: encrypted.authTag,
          messageType: 'text',
          isEdited: false,
          createdAt: new Date(),
          attachments: [],
          decryptedContent: plaintext,
        };

        // Add optimistic message
        setMessages((prev) => [...prev, optimisticMsg]);

        // Send to server
        const response = await apiClient.sendMessage({
          conversationId: conversation.id,
          encryptedContent: encrypted.encryptedContent,
          encryptionIv: encrypted.iv,
          authTag: encrypted.authTag,
          messageType: 'text',
        });

        if (response.error) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
          setError(response.error);
          antMessage.error('Failed to send message');
          return;
        }

        // Replace optimistic with server response
        const serverMsg = response.data as { message: Message };
        const decrypted = await decryptMessage(serverMsg.message);
        messageIdsRef.current.add(decrypted.id);

        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? decrypted : m))
        );
        antMessage.success('Message sent');
      } catch (err) {
        console.error('Error sending message:', err);
        setError((err as Error).message);
        antMessage.error('Failed to send message');
      } finally {
        setIsSending(false);
      }
    },
    [sharedKey, conversation, decryptMessage]
  );

  /**
   * Edit a message
   */
  const editMessage = useCallback(
    async (messageId: string, plaintext: string) => {
      if (!plaintext.trim() || !sharedKey) {
        setError('Cannot edit message');
        return;
      }

      try {
        setError(null);

        // Encrypt new content
        const encrypted = await ClientEncryption.encryptMessage(plaintext, sharedKey);

        // Update optimistically
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  encryptedContent: encrypted.encryptedContent,
                  encryptionIv: encrypted.iv,
                  authTag: encrypted.authTag,
                  decryptedContent: plaintext,
                  isEdited: true,
                  editedAt: new Date(),
                }
              : m
          )
        );

        // Send to server
        const response = await apiClient.editMessage(messageId, {
          encryptedContent: encrypted.encryptedContent,
          encryptionIv: encrypted.iv,
          authTag: encrypted.authTag,
        });

        if (response.error) {
          setError(response.error);
          antMessage.error('Failed to edit message');
        } else {
          antMessage.success('Message edited');
        }

        setEditingMessageId(null);
      } catch (err) {
        console.error('Error editing message:', err);
        setError((err as Error).message);
        antMessage.error('Failed to edit message');
      }
    },
    [sharedKey]
  );

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        setError(null);

        // Remove optimistically
        setMessages((prev) => prev.filter((m) => m.id !== messageId));

        // Send to server
        const response = await apiClient.deleteMessage(messageId);

        if (response.error) {
          setError(response.error);
          antMessage.error('Failed to delete message');
          // Reload messages on error
          await loadMessages(true);
        } else {
          antMessage.success('Message deleted');
        }
      } catch (err) {
        console.error('Error deleting message:', err);
        setError((err as Error).message);
        antMessage.error('Failed to delete message');
      }
    },
    [loadMessages]
  );

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    try {
      await apiClient.markMessagesAsRead(conversationId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [conversationId]);

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.deleteConversation(conversationId);
      if (response.error) {
        setError(response.error);
        antMessage.error('Failed to delete conversation');
      } else {
        antMessage.success('Conversation deleted');
        // Conversation is deleted, clear state
        setConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError((err as Error).message);
      antMessage.error('Failed to delete conversation');
    }
  }, [conversationId]);

  /**
   * Initialize conversation and setup polling
   */
  useEffect(() => {
    const init = async () => {
      await loadConversation();
    };
    init();
  }, [conversationId, loadConversation]);

  /**
   * Load initial messages when shared key is ready
   */
  useEffect(() => {
    if (sharedKey && conversation) {
      loadMessages(true);
    }
  }, [sharedKey, conversation, loadMessages]);

  /**
   * Setup polling when conversation and key are ready
   */
  useEffect(() => {
    if (conversation && sharedKey) {
      setupPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversation, sharedKey, setupPolling]);

  return {
    // State
    conversation,
    messages,
    sharedKey,
    isLoading,
    error,
    hasMoreMessages,
    isSending,
    editingMessageId,

    // Actions
    loadConversation,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    deleteConversation,
    setEditingMessageId,
    clearError: () => setError(null),
  };
}
