'use client';

import React, { useEffect, useState } from 'react';
import { List, Input, Button, Empty, Spin, Badge, Tooltip, Popconfirm, App } from 'antd';
import { PlusOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { Conversation, ConversationListItem } from '@/types/messaging';
import { apiClient } from '@/lib/api/client';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  onOpenCreateGroup: () => void;
  selectedId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  onOpenCreateGroup,
  selectedId,
}) => {
  const { message } = App.useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getConversations();

      if (response.error) {
        setError(response.error);
        return;
      }

      const data = response.data as { conversations: Conversation[] };
      const convs = data.conversations || [];
      setConversations(convs);
      setFilteredConversations(convs);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // Filter conversations
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) =>
      conv.name?.toLowerCase().includes(query)
    );
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await apiClient.deleteConversation(id);
      if (response.error) {
        message.error('Failed to delete conversation');
        return;
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      message.success('Conversation deleted');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      message.error('Failed to delete conversation');
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header with new chat button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <Button
          type="primary"
          block
          icon={<PlusOutlined />}
          onClick={onOpenCreateGroup}
        >
          New Chat
        </Button>
        <Input.Search
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          allowClear
          size="large"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spin />
          </div>
        ) : error ? (
          <div className="p-4">
            <Empty description={error} />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4">
            <Empty
              description="No conversations"
              style={{ marginTop: 48 }}
            />
          </div>
        ) : (
          <List
            dataSource={filteredConversations}
            renderItem={(conv) => (
              <List.Item
                key={conv.id}
                className={`cursor-pointer px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                  selectedId === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900'
                    : ''
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="w-full flex items-center gap-3">
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    {conv.isGroup ? (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <TeamOutlined className="text-blue-600 dark:text-blue-300" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold">
                        {conv.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-sm">
                        {conv.name || 'Direct Message'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {conv.description || 'No description'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <Popconfirm
                      title="Delete conversation"
                      description="This will remove the conversation from your list."
                      onConfirm={(e: React.MouseEvent) => {
                        e?.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      onCancel={(e: React.MouseEvent) => e?.stopPropagation()}
                      okText="Delete"
                      cancelText="Cancel"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default ConversationList;
