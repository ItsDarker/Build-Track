'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Empty, Spin, Divider } from 'antd';
import { UseMessagingV2Return } from '@/types/messagingv2';
import { UseWebRTCReturn } from '@/types/messagingv2';
import MessageHeaderV2 from './MessageHeaderV2';
import MessageListV2 from './MessageListV2';
import MessageComposerV2 from './MessageComposerV2';
import { apiClient } from '@/lib/api/client';

interface Props {
  conversationId: string;
  currentUserId: string;
  messaging: UseMessagingV2Return;
  webrtc: UseWebRTCReturn;
}

/**
 * MessagePaneV2
 * Main message display area with header, message list, and composer
 */
export default function MessagePaneV2({
  conversationId,
  currentUserId,
  messaging,
  webrtc,
}: Props) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Load conversation first (to get the shared decryption key), then messages
  useEffect(() => {
    messaging.loadConversation().then(() => messaging.loadMessages(true));
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messaging.messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isNearBottom);

    // Load more messages when scrolling up
    if (element.scrollTop === 0 && messaging.hasMoreMessages) {
      messaging.loadMoreMessages();
    }
  };

  if (messaging.isLoading && messaging.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <Spin size="large" />
        <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  if (!messaging.conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty description="Conversation not found" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <MessageHeaderV2
        conversation={messaging.conversation}
        currentUserId={currentUserId}
        onInitiateCall={(type) => {
          const recipientIds = messaging.conversation!.members
            .filter((m) => m.userId !== currentUserId)
            .map((m) => m.userId);
          webrtc.initiateCall(recipientIds, conversationId, type);
        }}
        onUpdate={() => messaging.loadConversation()}
        onLeave={async () => {
          // TODO: hook up to apiClient.leaveConversation
        }}
        onDelete={async () => {
          try {
            await apiClient.deleteConversation(conversationId);
            window.location.href = '/app/messagingv2'; // redirect to messaging root
          } catch (err) {
            console.error(err);
          }
        }}
      />

      <Divider className="my-0" />

      {/* Messages */}
      <div
        ref={messageListRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-4"
      >
        {messaging.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Empty description="No messages yet. Start the conversation!" />
          </div>
        ) : (
          <MessageListV2
            messages={messaging.messages}
            currentUserId={currentUserId}
            typingUsers={messaging.typingUsers}
            memberPresences={messaging.memberPresences}
            sharedKeyHex={messaging.decryptedSharedKey}
          />
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        {(() => {
          const currentMember = messaging.conversation!.members.find(m => m.userId === currentUserId);
          if (currentMember?.role === 'READ_ONLY') {
            return (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center text-gray-500 text-sm">
                You have read-only permissions in this conversation.
              </div>
            );
          }
          return (
            <MessageComposerV2
              conversationId={conversationId}
              onSendMessage={messaging.sendMessage}
              disabled={messaging.isLoading}
              error={messaging.error}
              onErrorDismiss={messaging.clearError}
            />
          );
        })()}
      </div>
    </div>
  );
}

