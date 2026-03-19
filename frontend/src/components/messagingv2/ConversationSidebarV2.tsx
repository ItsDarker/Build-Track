'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, List, Avatar, Badge, Empty, Spin } from 'antd';
import { SearchOutlined, PlusOutlined, MessageOutlined } from '@ant-design/icons';
import { ConversationListItemV2 } from '@/types/messagingv2';
import { apiClient } from '@/lib/api/client';
import CreateConversationModalV2 from './CreateConversationModalV2';

interface Props {
  selectedId?: string;
  onSelectConversation: (id: string) => void;
  currentUserId: string;
}

/**
 * ConversationSidebarV2
 * Displays list of conversations with search, unread badges, and online status
 */
export default function ConversationSidebarV2({
  selectedId,
  onSelectConversation,
  currentUserId,
}: Props) {
  const [conversations, setConversations] = useState<ConversationListItemV2[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationListItemV2[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reusable function to load conversations
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getConversations();
      if (response.error) {
        console.error('Failed to load conversations:', response.error);
        return;
      }

      const conversations = ((response.data as any)?.conversations || []).map((conv: any) => ({
        ...conv,
        unreadCount: 0,
        lastActivity: new Date(conv.updatedAt),
        memberPresences: {},
      }));

      setConversations(conversations);
      setFilteredConversations(conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Filter conversations on search
  useEffect(() => {
    const filtered = conversations.filter((conv) => {
      const searchLower = searchText.toLowerCase();
      const name = conv.name || conv.members.map((m) => m.user.displayName).join(', ');
      return name.toLowerCase().includes(searchLower);
    });
    setFilteredConversations(filtered);
  }, [searchText, conversations]);

  const getConversationName = (conv: ConversationListItemV2) => {
    if (conv.isGroup) {
      return conv.name || 'Group Chat';
    }
    // For 1:1, show other person's name
    const otherMember = conv.members.find((m) => m.userId !== currentUserId);
    return otherMember?.user.displayName || otherMember?.user.name || 'Unknown';
  };

  const getAvatars = (conv: ConversationListItemV2) => {
    if (conv.isGroup) {
      return conv.members.slice(0, 2).map((m) => m.user.avatarUrl);
    }
    const otherMember = conv.members.find((m) => m.userId !== currentUserId);
    return [otherMember?.user.avatarUrl];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
          <Button
            type="text"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => setIsModalOpen(true)}
            title="New conversation"
          />
        </div>

        {/* Search */}
        <Input
          placeholder="Search conversations..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
          size="large"
          className="rounded-full"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spin />
          </div>
        ) : filteredConversations.length === 0 ? (
          <Empty
            description={searchText ? 'No conversations found' : 'No conversations yet'}
            style={{ marginTop: 48 }}
          />
        ) : (
          <List
            dataSource={filteredConversations}
            renderItem={(conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`px-3 py-2 cursor-pointer transition-colors ${selectedId === conversation.id
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Badge count={conversation.unreadCount} size="small">
                      {conversation.isGroup ? (
                        <div className="relative">
                          <Avatar
                            size={48}
                            src={conversation.iconUrl}
                            icon={!conversation.iconUrl && <MessageOutlined />}
                          />
                        </div>
                      ) : (
                        <Avatar src={getAvatars(conversation)[0]} size={48} />
                      )}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {getConversationName(conversation)}
                      </h3>
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge count={conversation.unreadCount || 0} showZero style={{ backgroundColor: '#ff4d4f' }} />
                      )}
                    </div>

                    {/* Last message preview */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {(conversation.lastMessage as any)?.decryptedContent || conversation.lastMessage?.encryptedContent || 'No messages yet'}
                    </p>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(conversation.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Create Conversation Modal */}
      <CreateConversationModalV2
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConversationCreated={(conversationId) => {
          // Reload conversations and select the new one
          loadConversations();
          onSelectConversation(conversationId);
        }}
        currentUserId={currentUserId}
      />
    </div>
  );
}

