'use client';

import { useState } from 'react';
import { Button, Dropdown, Space, Avatar, App } from 'antd';
import { PhoneOutlined, VideoCameraOutlined, InfoCircleOutlined, MoreOutlined, TeamOutlined } from '@ant-design/icons';
import { ConversationWithMembersV2 } from '@/types/messagingv2';
import GroupInfoModalV2 from './GroupInfoModalV2';

interface Props {
  conversation: ConversationWithMembersV2;
  onInitiateCall: (type: 'audio' | 'video') => void;
  currentUserId?: string;
  onLeave?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

/**
 * MessageHeaderV2
 * Header showing conversation name, members, and call buttons
 */
export default function MessageHeaderV2({ conversation, onInitiateCall, currentUserId, onLeave, onDelete, onUpdate }: Props) {
  const { message } = App.useApp();
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const getConversationTitle = () => {
    if (conversation.isGroup) {
      return conversation.name || 'Group Chat';
    }
    const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
    return otherMember?.user.displayName || otherMember?.user.name || 'Direct Message';
  };

  const getMembersInfo = () => {
    if (conversation.isGroup) {
      return `${conversation.members.length} members`;
    }
    const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
    return otherMember?.user.email || 'Direct message';
  };

  const handleCall = (type: 'audio' | 'video') => {
    onInitiateCall(type);
  };

  const dropdownItems = [
    {
      key: 'info',
      label: 'Conversation info',
      icon: <InfoCircleOutlined />,
      onClick: () => {
        const memberNames = conversation.members
          .map((m) => m.user.displayName || m.user.name)
          .join(', ');
        message.info(`Members: ${memberNames}`);
      },
    },
    {
      key: 'mute',
      label: 'Mute notifications',
      onClick: () => message.info('Mute feature coming soon'),
    },
    {
      type: 'divider' as const,
    },
    ...(onLeave ? [{
      key: 'leave',
      label: 'Leave conversation',
      danger: true,
      onClick: onLeave,
    }] : []),
    ...(onDelete ? [{
      key: 'delete',
      label: 'Delete conversation',
      danger: true,
      onClick: onDelete,
    }] : []),
  ];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left - Avatar + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar
          size={40}
          src={
            !conversation.isGroup
              ? conversation.members.find((m) => m.userId !== currentUserId)?.user.avatarUrl
              : undefined
          }
        >
          {conversation.isGroup ? (conversation.name || 'G')[0].toUpperCase() : undefined}
        </Avatar>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate leading-tight">
            {getConversationTitle()}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getMembersInfo()}</p>
        </div>
      </div>

      {/* Right - Actions */}
      <Space>
        {conversation.isGroup && (
          <Button
            type="text"
            icon={<TeamOutlined />}
            onClick={() => setIsGroupInfoOpen(true)}
            title="Group info"
            className="text-gray-600 hover:text-blue-600"
          />
        )}
        <Button
          type="text"
          icon={<PhoneOutlined />}
          onClick={() => handleCall('audio')}
          title="Start audio call"
          className="text-gray-600 hover:text-blue-600"
        />
        <Button
          type="text"
          icon={<VideoCameraOutlined />}
          onClick={() => handleCall('video')}
          title="Start video call"
          className="text-gray-600 hover:text-blue-600"
        />
        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight" trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} className="text-gray-600" />
        </Dropdown>
      </Space>

      <GroupInfoModalV2
        open={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        conversation={conversation}
        currentUserId={currentUserId || ''}
        onUpdate={onUpdate}
      />
    </div>
  );
}
