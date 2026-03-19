'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DecryptedMessageV2, ConversationWithMembersV2, UseMessagingV2Return, PresenceStatus } from '@/types/messagingv2';
import { useSocketIO } from './useSocketIO';
import { apiClient } from '@/lib/api/client';

// ---------------------------------------------------------------------------
// AES-GCM Encryption/Decryption Helpers
// ---------------------------------------------------------------------------

/**
 * Import an AES-GCM raw hex key as a CryptoKey
 */
async function importAesKey(hexKey: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(hexKey) as Uint8Array<ArrayBuffer>;
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypt a UTF-8 string with AES-GCM. Returns hex strings. */
async function aesEncrypt(
  plaintext: string,
  cryptoKey: CryptoKey
): Promise<{ encryptedContent: string; encryptionIv: string; authTag: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const encoded = new TextEncoder().encode(plaintext) as Uint8Array<ArrayBuffer>;

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    encoded
  );

  // AES-GCM appends the 16-byte auth tag at the end of the ciphertext
  const cipherBytes = new Uint8Array(cipherBuffer);
  const tagOffset = cipherBytes.length - 16;
  const encryptedContent = bytesToHex(cipherBytes.slice(0, tagOffset));
  const authTag = bytesToHex(cipherBytes.slice(tagOffset));
  const encryptionIv = bytesToHex(iv);

  return { encryptedContent, encryptionIv, authTag };
}

/** Decrypt an AES-GCM ciphertext. Returns plaintext string or null on failure. */
async function aesDecrypt(
  encryptedContentHex: string,
  encryptionIvHex: string,
  authTagHex: string,
  cryptoKey: CryptoKey
): Promise<string | null> {
  try {
    const iv = hexToBytes(encryptionIvHex) as Uint8Array<ArrayBuffer>;
    const cipherBytes = hexToBytes(encryptedContentHex);
    const tagBytes = hexToBytes(authTagHex);

    // Reconstruct ciphertext + tag (SubtleCrypto expects them concatenated)
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length) as Uint8Array<ArrayBuffer>;
    combined.set(cipherBytes, 0);
    combined.set(tagBytes, cipherBytes.length);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      combined
    );

    return new TextDecoder().decode(plainBuffer);
  } catch {
    return null;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Messaging V2 Hook
 * Handles conversation loading, message encryption/decryption, and real-time updates
 */
export function useMessagingV2(conversationId: string): UseMessagingV2Return {
  const [conversation, setConversation] = useState<ConversationWithMembersV2 | null>(null);
  const [messages, setMessages] = useState<DecryptedMessageV2[]>([]);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [memberPresences, setMemberPresences] = useState<{ [userId: string]: PresenceStatus }>({});

  const paginationRef = useRef({ limit: 50, offset: 0 });
  // Keep the CryptoKey and hex key in refs so async closures can access latest values
  const sharedKeyRef = useRef<CryptoKey | null>(null);
  const sharedKeyHexRef = useRef<string | null>(null);

  const { emit, on, off, isConnected } = useSocketIO();

  // ---------------------------------------------------------------------------
  // Load conversation details
  // ---------------------------------------------------------------------------
  const loadConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getConversation(conversationId);

      if (response.error) {
        setError(response.error);
        return;
      }

      const conv = (response.data as any)?.conversation;
      if (!conv) {
        setError('Conversation not found');
        return;
      }

      setConversation(conv);

      // Import the shared key returned by the server so we can decrypt messages
      const hexKey: string | null = conv.decryptedSharedKeyForCurrentUser ?? null;
      if (hexKey) {
        try {
          const cryptoKey = await importAesKey(hexKey);
          sharedKeyRef.current = cryptoKey;
          sharedKeyHexRef.current = hexKey;
          setSharedKey(cryptoKey);
        } catch (keyErr) {
          console.warn('[useMessagingV2] Failed to import shared key:', keyErr);
        }
      }

      // Join the Socket.io room for real-time updates
      if (isConnected) {
        emit('messaging:join-conversation', { conversationId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isConnected, emit]);

  // ---------------------------------------------------------------------------
  // Decrypt a single raw message from the API
  // ---------------------------------------------------------------------------
  const decryptMessage = useCallback(
    async (raw: any): Promise<DecryptedMessageV2> => {
      const key = sharedKeyRef.current;
      if (!key || !raw.encryptedContent || !raw.encryptionIv || !raw.authTag) {
        return {
          ...raw,
          decryptedContent: raw.encryptedContent ?? '',
          decryptionFailed: !key,
          decryptionError: !key ? 'No shared key available' : undefined,
        };
      }

      const plaintext = await aesDecrypt(
        raw.encryptedContent,
        raw.encryptionIv,
        raw.authTag,
        key
      );

      if (plaintext === null) {
        return {
          ...raw,
          decryptedContent: '🔒 Unable to decrypt message',
          decryptionFailed: true,
          decryptionError: 'Decryption failed',
        };
      }

      return { ...raw, decryptedContent: plaintext };
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Load messages with pagination
  // ---------------------------------------------------------------------------
  const loadMessages = useCallback(
    async (resetPagination = false) => {
      if (!conversationId) return;

      try {
        setIsLoading(true);
        setError(null);

        if (resetPagination) {
          paginationRef.current = { limit: 50, offset: 0 };
        }

        const { limit, offset } = paginationRef.current;

        const response = await apiClient.getMessages(conversationId, { limit, offset });

        if (response.error) {
          setError(response.error);
          return;
        }

        const raw = (response.data as any)?.messages ?? [];
        const hasMore = (response.data as any)?.hasMore ?? false;

        const decrypted: DecryptedMessageV2[] = [];
        const BATCH_SIZE = 10;
        for (let i = 0; i < raw.length; i += BATCH_SIZE) {
          const batch = raw.slice(i, i + BATCH_SIZE);
          const batchDecrypted = await Promise.all(batch.map(decryptMessage));
          decrypted.push(...batchDecrypted);

          // Yield to event loop to prevent UI freezing on slow devices
          if (i + BATCH_SIZE < raw.length) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        if (resetPagination) {
          setMessages(decrypted);
        } else {
          // Prepend older messages when paginating backwards
          setMessages((prev) => [...decrypted, ...prev]);
        }

        setHasMoreMessages(hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, decryptMessage]
  );

  // ---------------------------------------------------------------------------
  // Load more messages (pagination — scroll up)
  // ---------------------------------------------------------------------------
  const loadMoreMessages = useCallback(async () => {
    paginationRef.current.offset += paginationRef.current.limit;
    await loadMessages(false);
  }, [loadMessages]);

  // ---------------------------------------------------------------------------
  // Send a message
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (plaintext: string, files?: File[]) => {
      try {
        setError(null);

        if (!plaintext.trim() && (!files || files.length === 0)) {
          return;
        }

        const key = sharedKeyRef.current;
        if (!key) {
          setError('Cannot send message: encryption key not loaded. Please reload the conversation.');
          return;
        }

        // Encrypt the plaintext
        const { encryptedContent, encryptionIv, authTag } = await aesEncrypt(plaintext, key);

        const response = await apiClient.sendMessage({
          conversationId,
          encryptedContent,
          encryptionIv,
          authTag,
          messageType: 'text',
        });

        if (response.error) {
          setError(response.error);
          return;
        }

        const rawMsg = (response.data as any)?.message;
        if (rawMsg) {
          const attachmentsList = [];
          if (files && files.length > 0 && sharedKeyHexRef.current) {
            for (const file of files) {
              const uploadRes = await apiClient.uploadMessageAttachment(
                conversationId,
                rawMsg.id,
                sharedKeyHexRef.current,
                file
              );
              if (uploadRes.data?.attachment) {
                attachmentsList.push(uploadRes.data.attachment);
              }
            }
          }

          // Optimistically add to local state (already know plaintext)
          const decryptedMsg: DecryptedMessageV2 = {
            ...rawMsg,
            decryptedContent: plaintext,
            attachments: attachmentsList,
          };
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === decryptedMsg.id);
            if (exists) {
              return prev.map((m) => (m.id === decryptedMsg.id ? { ...m, ...decryptedMsg } : m));
            }
            return [...prev, decryptedMsg];
          });
        }

        // Notify other members via socket
        if (isConnected) {
          emit('messaging:message-sent', { conversationId });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    },
    [conversationId, isConnected, emit]
  );

  // ---------------------------------------------------------------------------
  // Edit a message
  // ---------------------------------------------------------------------------
  const editMessage = useCallback(
    async (messageId: string, plaintext: string) => {
      try {
        setError(null);

        const key = sharedKeyRef.current;
        if (!key) {
          setError('Cannot edit message: encryption key not loaded.');
          return;
        }

        const { encryptedContent, encryptionIv, authTag } = await aesEncrypt(plaintext, key);

        const response = await apiClient.editMessage(messageId, {
          encryptedContent,
          encryptionIv,
          authTag,
        });

        if (response.error) {
          setError(response.error);
          return;
        }

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, decryptedContent: plaintext, isEdited: true, editedAt: new Date() }
              : msg
          )
        );

        if (isConnected) {
          emit('messaging:edit-message', { conversationId, messageId });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to edit message');
      }
    },
    [conversationId, isConnected, emit]
  );

  // ---------------------------------------------------------------------------
  // Delete a message
  // ---------------------------------------------------------------------------
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        setError(null);

        const response = await apiClient.deleteMessage(messageId);

        if (response.error) {
          setError(response.error);
          return;
        }

        // Remove from local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        if (isConnected) {
          emit('messaging:delete-message', { conversationId, messageId });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete message');
      }
    },
    [conversationId, isConnected, emit]
  );

  // ---------------------------------------------------------------------------
  // Mark conversation as read
  // ---------------------------------------------------------------------------
  const markAsRead = useCallback(async () => {
    try {
      await apiClient.markMessagesAsRead(conversationId);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [conversationId]);

  // ---------------------------------------------------------------------------
  // Clear error
  // ---------------------------------------------------------------------------
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Real-time Socket.io listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isConnected) return;

    // Join conversation room
    emit('messaging:join-conversation', { conversationId });

    // New message from another user (decrypt before adding)
    const handleNewMessage = async (rawMessage: any) => {
      const decrypted = await decryptMessage(rawMessage);
      setMessages((prev) => {
        // Avoid duplicates (our own sent messages are added optimistically)
        if (prev.some((m) => m.id === decrypted.id)) return prev;
        return [...prev, decrypted];
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleMessageEdited = async (data: any) => {
      // Re-decrypt the edited content
      const plaintext = sharedKeyRef.current
        ? await aesDecrypt(data.encryptedContent, data.encryptionIv, data.authTag, sharedKeyRef.current)
        : null;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.id
            ? { ...msg, ...data, decryptedContent: plaintext ?? '🔒 Unable to decrypt', isEdited: true }
            : msg
        )
      );
    };

    const handleMessageDeleted = (data: any) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    };

    const handleUserTyping = (data: any) => {
      if (data.typing) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      } else {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    };

    const handleMessageRead = (data: any) => {
      setConversation((prev) =>
        prev
          ? {
            ...prev,
            members: prev.members.map((m) =>
              m.userId === data.userId
                ? { ...m, lastReadAt: new Date(data.lastReadAt) }
                : m
            ),
          }
          : null
      );
    };

    on('message:new', handleNewMessage);
    on('message:edited', handleMessageEdited);
    on('message:deleted', handleMessageDeleted);
    on('messaging:user-typing', handleUserTyping);
    on('message:read', handleMessageRead);

    return () => {
      off('message:new', handleNewMessage);
      off('message:edited', handleMessageEdited);
      off('message:deleted', handleMessageDeleted);
      off('messaging:user-typing', handleUserTyping);
      off('message:read', handleMessageRead);

      emit('messaging:leave-conversation', { conversationId });
    };
  }, [conversationId, isConnected, emit, on, off, decryptMessage]);

  // ---------------------------------------------------------------------------
  // Reset state when conversation changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setSharedKey(null);
    sharedKeyRef.current = null;
    sharedKeyHexRef.current = null;
    setError(null);
    setUnreadCount(0);
    setTypingUsers(new Set());
    setMemberPresences({});
    paginationRef.current = { limit: 50, offset: 0 };
  }, [conversationId]);

  return {
    conversation,
    messages,
    sharedKey,
    isLoading,
    error,
    hasMoreMessages,
    unreadCount,
    typingUsers,
    memberPresences,
    loadConversation,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    clearError,
    decryptedSharedKey: sharedKeyHexRef.current,
  };
}
