'use client';

import React from 'react';
import { Avatar, Tooltip, Button } from 'antd';
import { DownloadOutlined, FileOutlined, CheckOutlined } from '@ant-design/icons';
import { DecryptedMessageV2 } from '@/types/messagingv2';
import { apiClient } from '@/lib/api/client';

interface Props {
  message: DecryptedMessageV2;
  isOwn: boolean;
  isFirstInGroup: boolean;
  sharedKeyHex: string | null;
}

/**
 * MessageBubbleV2
 * Individual message bubble with timestamps and read receipts
 */
export default function MessageBubbleV2({
  message,
  isOwn,
  isFirstInGroup,
  sharedKeyHex,
}: Props) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar */}
      {!isOwn && isFirstInGroup && (
        <Avatar
          src={message.sender?.avatarUrl}
          size={32}
          className="flex-shrink-0"
        >
          {message.sender?.displayName?.[0] || message.sender?.name?.[0] || 'U'}
        </Avatar>
      )}
      {!isOwn && !isFirstInGroup && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (only for groups, first message in group) */}
        {!isOwn && isFirstInGroup && message.sender.displayName && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-2">
            {message.sender.displayName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`max-w-sm px-4 py-2 rounded-2xl ${isOwn
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
            } ${message.decryptionFailed ? 'opacity-60' : ''}`}
        >
          {message.decryptionFailed ? (
            <p className="text-sm italic">Failed to decrypt message</p>
          ) : (
            <p className="text-sm break-words">{message.decryptedContent || message.encryptedContent}</p>
          )}
        </div>

        {/* Metadata */}
        <div className={`flex items-center gap-1 mt-1 px-2 text-xs text-gray-500 dark:text-gray-500`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <Tooltip title={message.isEdited ? 'edited' : 'sent'}>
              {message.isEdited ? (
                <span className="text-xs text-gray-400">(edited)</span>
              ) : (
                <CheckOutlined className="text-gray-400" />
              )}
            </Tooltip>
          )}
        </div>

        {/* Attachments (if any) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {message.attachments.map((attachment) => {
              const isImage = attachment.mimeType.startsWith('image/');

              return (
                <div
                  key={attachment.id}
                  className={`rounded-lg overflow-hidden border ${isOwn ? 'bg-blue-600 border-blue-400' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    } max-w-xs`}
                >
                  {isImage && (
                    <div className="relative group cursor-pointer" onClick={() => window.open(apiClient.getMessageAttachmentDownloadUrl(attachment.id, sharedKeyHex || ''), '_blank')}>
                      <img
                        src={apiClient.getMessageAttachmentDownloadUrl(attachment.id, sharedKeyHex || '')}
                        alt={attachment.originalName}
                        className="w-full h-auto max-h-60 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <DownloadOutlined className="text-white opacity-0 group-hover:opacity-100 text-xl" />
                      </div>
                    </div>
                  )}
                  <div className="p-2 flex items-center justify-between gap-3 overflow-hidden">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileOutlined className={isOwn ? 'text-blue-100' : 'text-gray-400'} />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-xs font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                          {attachment.originalName}
                        </span>
                        <span className={`text-[10px] ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                          {(attachment.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      className={isOwn ? 'text-white hover:bg-blue-700' : ''}
                      onClick={() => window.open(apiClient.getMessageAttachmentDownloadUrl(attachment.id, sharedKeyHex || ''), '_blank')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

