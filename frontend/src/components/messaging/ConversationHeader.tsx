'use client';

import React from 'react';
import { Button, Space, Divider, Drawer, Avatar, List } from 'antd';
import { InfoOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { ConversationWithMembers } from '@/types/messaging';

interface ConversationHeaderProps {
  conversation: ConversationWithMembers | null;
  onShowMembers: () => void;
  onDelete?: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  onShowMembers,
  onDelete,
}) => {
  if (!conversation) {
    return (
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <p className="text-gray-500">No conversation selected</p>
      </div>
    );
  }

  const getAvatarText = () => {
    if (conversation.isGroup) return 'G';
    return conversation.name?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* Left: Name and member count */}
      <div className="flex items-center gap-3">
        {conversation.isGroup ? (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <TeamOutlined className="text-blue-600 dark:text-blue-300 text-lg" />
          </div>
        ) : (
          <Avatar>{getAvatarText()}</Avatar>
        )}

        <div>
          <h2 className="font-semibold text-lg">
            {conversation.name || 'Direct Message'}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {conversation.members?.length || 0} members
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <Space>
        <Button
          type="text"
          icon={<InfoOutlined />}
          onClick={onShowMembers}
          title="View members"
        />
        {onDelete && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={onDelete}
            title="Delete conversation"
          />
        )}
      </Space>
    </div>
  );
};

/**
 * Members drawer component
 */
interface ConversationMembersDrawerProps {
  open: boolean;
  conversation: ConversationWithMembers | null;
  onClose: () => void;
}

export const ConversationMembersDrawer: React.FC<ConversationMembersDrawerProps> = ({
  open,
  conversation,
  onClose,
}) => {
  if (!conversation) return null;

  return (
    <Drawer
      title="Members"
      placement="right"
      onClose={onClose}
      open={open}
      width={300}
    >
      <List
        dataSource={conversation.members}
        renderItem={(member) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar>{member.user?.displayName?.[0]?.toUpperCase()}</Avatar>}
              title={member.user?.displayName || member.user?.name}
              description={member.user?.email}
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default ConversationHeader;
