'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Tabs, List, Avatar, Checkbox, Space, App, Spin, Empty } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  jobTitle?: string;
  role?: {
    name: string;
    displayName: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
  currentUserId: string;
}

/**
 * CreateConversationModalV2
 * Modal for creating direct chat or group chat conversations
 */
export default function CreateConversationModalV2({
  open,
  onClose,
  onConversationCreated,
  currentUserId,
}: Props) {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // For direct chat
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set()); // For group chat
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load all users when modal opens
  useEffect(() => {
    if (!open) return;

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await apiClient.getUsers();
        if (response.error) {
          console.error('Failed to load users:', response.error);
          message.error('Failed to load users');
          return;
        }

        const allUsers = ((response.data as any)?.users || [])
          .filter((u: User) => u.id !== currentUserId) // Exclude current user
          .sort((a: User, b: User) => {
            const nameA = (a.displayName || a.name || '').toLowerCase();
            const nameB = (b.displayName || b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });

        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        message.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadUsers();
  }, [open, currentUserId]);

  // Filter users based on search
  useEffect(() => {
    const searchLower = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      const displayName = (user.displayName || user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return displayName.includes(searchLower) || email.includes(searchLower);
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleCreateDirectChat = async () => {
    if (!selectedUser) {
      message.error('Please select a user');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiClient.createConversation({
        isGroup: false,
        memberIds: [currentUserId, selectedUser.id],
      });

      if (response.error) {
        message.error(response.error || 'Failed to create conversation');
        return;
      }

      message.success('Conversation created!');
      onConversationCreated((response.data as any)?.conversation?.id);
      handleClose();
    } catch (error) {
      console.error('Error creating conversation:', error);
      message.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      message.error('Please enter a group name');
      return;
    }

    if (selectedUsers.size === 0) {
      message.error('Please select at least one member');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiClient.createConversation({
        name: groupName,
        isGroup: true,
        memberIds: [currentUserId, ...Array.from(selectedUsers)],
      });

      if (response.error) {
        message.error(response.error || 'Failed to create group');
        return;
      }

      message.success('Group created!');
      onConversationCreated((response.data as any)?.conversation?.id);
      handleClose();
    } catch (error) {
      console.error('Error creating group:', error);
      message.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setSelectedUsers(new Set());
    setGroupName('');
    onClose();
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  return (
    <Modal
      title="Start Conversation"
      open={open}
      onCancel={handleClose}
      width={500}
      footer={null}
      className="create-conversation-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'direct',
            label: '💬 Direct Chat',
            children: (
              <div className="space-y-4 pt-4">
                {/* Search */}
                <Input
                  placeholder="Search users by name or email..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  size="large"
                />

                {/* User List */}
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Spin />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <Empty description="No users found" />
                ) : (
                  <List
                    dataSource={filteredUsers}
                    renderItem={(user) => (
                      <List.Item
                        key={user.id}
                        className={`p-3 rounded cursor-pointer transition-colors ${selectedUser?.id === user.id
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <List.Item.Meta
                          avatar={<Avatar src={user.avatarUrl} size={40} />}
                          title={
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.displayName || user.name}</span>
                              {selectedUser?.id === user.id && (
                                <span className="text-blue-600 dark:text-blue-400">✓</span>
                              )}
                            </div>
                          }
                          description={
                            <div className="text-xs space-y-1">
                              <div>{user.email}</div>
                              {user.jobTitle && <div>{user.jobTitle}</div>}
                              {user.role && <div className="text-gray-500">{user.role.displayName}</div>}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                    style={{ maxHeight: '400px', overflow: 'auto' }}
                  />
                )}

                {/* Create Button */}
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleCreateDirectChat}
                  disabled={!selectedUser || isCreating}
                  loading={isCreating}
                >
                  Start Chat
                </Button>
              </div>
            ),
          },
          {
            key: 'group',
            label: '👥 Create Group',
            children: (
              <div className="space-y-4 pt-4">
                {/* Group Name */}
                <Input
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupName(e.target.value)}
                  size="large"
                  maxLength={100}
                />

                {/* Search */}
                <Input
                  placeholder="Search members..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  size="large"
                />

                {/* Member List */}
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Spin />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <Empty description="No users found" />
                ) : (
                  <List
                    dataSource={filteredUsers}
                    renderItem={(user) => (
                      <List.Item key={user.id} className="p-3">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-full"
                        >
                          <span className="ml-2 flex items-center gap-3 flex-1">
                            <Avatar src={user.avatarUrl} size={32} />
                            <div className="flex-1">
                              <div className="font-medium">{user.displayName || user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </span>
                        </Checkbox>
                      </List.Item>
                    )}
                    style={{ maxHeight: '400px', overflow: 'auto' }}
                  />
                )}

                {/* Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedUsers.size} member{selectedUsers.size !== 1 ? 's' : ''}
                </div>

                {/* Create Button */}
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedUsers.size === 0 || isCreating}
                  loading={isCreating}
                >
                  Create Group
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}

