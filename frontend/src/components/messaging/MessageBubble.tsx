'use client';

import React from 'react';
import { Button, Space, Tooltip, Popconfirm, Spin } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DecryptedMessage } from '@/types/messaging';
import { formatDistanceToNow } from 'date-fns';
import FileAttachmentPreview from './FileAttachmentPreview';

interface MessageBubbleProps {
  message: DecryptedMessage;
  isCurrentUser: boolean;
  isEditing: boolean;
  isLoadingEdit?: boolean;
  currentUserId?: string;
  onEdit: (plaintext: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onEditModeChange: (editing: boolean) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  isEditing,
  isLoadingEdit,
  currentUserId,
  onEdit,
  onDelete,
  onEditModeChange,
}) => {
  const [editText, setEditText] = React.useState(message.decryptedContent);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      return;
    }
    await onEdit(editText.trim());
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  const timeDisplay = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });

  // Message bubble styles
  const bubbleClasses = isCurrentUser
    ? 'bg-blue-500 text-white rounded-lg rounded-tr-none'
    : 'bg-gray-100 text-gray-900 rounded-lg rounded-tl-none';

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} my-2 gap-2`}>
      {!isCurrentUser && message.sender?.avatarUrl && (
        <img
          src={message.sender.avatarUrl}
          alt={message.sender.displayName}
          className="w-8 h-8 rounded-full"
        />
      )}
      {!isCurrentUser && !message.sender?.avatarUrl && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
          {message.sender?.displayName?.[0]?.toUpperCase() || 'U'}
        </div>
      )}

      <div className={isCurrentUser ? 'flex-row-reverse' : ''}>
        {!isCurrentUser && (
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {message.sender?.displayName || 'Unknown'}
          </p>
        )}

        {isEditing ? (
          <div className={`px-3 py-2 ${bubbleClasses} max-w-xs sm:max-w-md md:max-w-lg`}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-transparent border-0 resize-none focus:outline-none text-sm break-words"
              rows={3}
              maxLength={4000}
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="small"
                type="primary"
                onClick={handleSaveEdit}
                disabled={!editText.trim() || editText === message.decryptedContent}
                loading={isLoadingEdit}
              >
                Save
              </Button>
              <Button size="small" onClick={() => onEditModeChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={`px-3 py-2 ${bubbleClasses} max-w-xs sm:max-w-md md:max-w-lg overflow-hidden`}>
              {message.decryptionFailed ? (
                <p className="text-sm italic opacity-75">
                  [Failed to decrypt message: {message.decryptionError}]
                </p>
              ) : (
                <>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {message.decryptedContent}
                  </p>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att) => (
                        <FileAttachmentPreview
                          key={att.id}
                          attachment={att}
                          messageId={message.id}
                          canDelete={isCurrentUser}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <Tooltip title={new Date(message.createdAt).toLocaleString()}>
              <p className="text-xs text-gray-500 mt-1 px-2">
                {timeDisplay}
                {message.isEdited && ' (edited)'}
              </p>
            </Tooltip>

            {isCurrentUser && (
              <Space size={4} className="mt-1 px-2">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditModeChange(true)}
                  title="Edit message"
                />
                <Popconfirm
                  title="Delete message"
                  description="Are you sure you want to delete this message?"
                  onConfirm={handleDeleteClick}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={isDeleting ? <Spin size="small" /> : <DeleteOutlined />}
                    disabled={isDeleting}
                  />
                </Popconfirm>
              </Space>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
