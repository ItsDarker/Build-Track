'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Empty, Spin, Skeleton, App } from 'antd';
import { useMessaging } from '@/hooks/useMessaging';
import ConversationHeader, { ConversationMembersDrawer } from './ConversationHeader';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

interface ChatWindowProps {
  conversationId: string;
  currentUserId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, currentUserId }) => {
  const { message } = App.useApp();
  const {
    conversation,
    messages,
    isLoading,
    error,
    isSending,
    editingMessageId,
    sendMessage,
    editMessage,
    deleteMessage,
    setEditingMessageId,
    deleteConversation,
  } = useMessaging(conversationId, 3000, message);

  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (text: string, files: File[]) => {
    try {
      await sendMessage(text);
      // TODO: Handle file uploads in Phase 2.5
      if (files.length > 0) {
        message.info('File attachments coming soon!');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleDeleteConversation = async () => {
    try {
      await deleteConversation?.();
      message.success('Conversation deleted');
      // Parent component should handle navigation
    } catch (err) {
      console.error('Error deleting conversation:', err);
      message.error('Failed to delete conversation');
    }
  };

  if (isLoading && !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!conversation && error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Empty description={error} />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty description="No conversation selected" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header - fixed height */}
      <div className="flex-shrink-0">
        <ConversationHeader
          conversation={conversation}
          onShowMembers={() => setShowMembers(true)}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Messages - scrollable middle section */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 flex flex-col">
        {isLoading && messages.length === 0 ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} paragraph={{ rows: 1 }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty description="No messages yet. Start the conversation!" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="break-words">
                <MessageBubble
                  message={msg}
                  isCurrentUser={msg.senderId === currentUserId}
                  isEditing={editingMessageId === msg.id}
                  currentUserId={currentUserId}
                  onEdit={(text) => editMessage(msg.id, text)}
                  onDelete={() => deleteMessage(msg.id)}
                  onEditModeChange={(editing) => {
                    if (editing) {
                      setEditingMessageId(msg.id);
                    } else {
                      setEditingMessageId(null);
                    }
                  }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer - fixed height */}
      <div className="flex-shrink-0">
        <MessageComposer
          onSend={handleSendMessage}
          disabled={!conversation || isSending}
        />
      </div>

      {/* Members drawer */}
      <ConversationMembersDrawer
        open={showMembers}
        conversation={conversation}
        onClose={() => setShowMembers(false)}
      />
    </div>
  );
};

export default ChatWindow;
