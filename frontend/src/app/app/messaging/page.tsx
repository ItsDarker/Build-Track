'use client';

import React, { useState } from 'react';
import { Empty, message as antMessage } from 'antd';
import { useUser } from '@/lib/context/UserContext';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import GroupCreationModal from '@/components/messaging/GroupCreationModal';

/**
 * Messaging Page
 * Main messaging interface with conversation list and chat window
 */
export default function MessagingPage() {
  const user = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const userRole = user?.role?.name;

  // Check if user can create groups (PM, ORG_ADMIN, SUPER_ADMIN)
  const canCreateGroup = ['PROJECT_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'].includes(
    userRole || ''
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="Please log in to access messaging" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-800">
      {/* Conversation List Sidebar */}
      <div className="w-80 hidden lg:flex flex-col">
        <ConversationList
          onSelectConversation={setSelectedConversationId}
          onOpenCreateGroup={() => setIsCreatingGroup(true)}
          selectedId={selectedConversationId || undefined}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.id}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              description="Select a conversation to start messaging"
              style={{ marginBottom: 48 }}
            />
          </div>
        )}
      </div>

      {/* Group Creation Modal */}
      <GroupCreationModal
        open={isCreatingGroup}
        onClose={() => setIsCreatingGroup(false)}
        onSuccess={(conversationId) => {
          setSelectedConversationId(conversationId);
          antMessage.success('Group created! Start chatting.');
        }}
        isAllowedToCreate={canCreateGroup}
      />
    </div>
  );
}
