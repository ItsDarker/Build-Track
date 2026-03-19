'use client';

import React, { useState, useRef } from 'react';
import { Input, Button, Space, message as antMessage, Upload, Popover } from 'antd';
import { SendOutlined, PaperClipOutlined, SmileOutlined } from '@ant-design/icons';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Props {
  conversationId: string;
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  disabled?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

/**
 * MessageComposerV2
 * Input area for composing and sending messages
 */
export default function MessageComposerV2({
  conversationId,
  onSendMessage,
  disabled,
  error,
  onErrorDismiss,
}: Props) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<any>(null);

  const handleSend = async () => {
    if (!content.trim() && attachments.length === 0) return;

    try {
      setIsSending(true);
      await onSendMessage(content, attachments);
      setContent('');
      setAttachments([]);
      inputRef.current?.focus();
    } catch (err) {
      antMessage.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      {/* Error Message */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button type="text" size="small" onClick={onErrorDismiss}>
            ✕
          </Button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs flex items-center gap-1"
            >
              📎 {file.name}
              <button
                onClick={() => {
                  setAttachments(attachments.filter((_, i) => i !== index));
                }}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input.TextArea
          ref={inputRef}
          placeholder="Type a message..."
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={disabled || isSending}
          style={{ resize: 'none' }}
          className="rounded-lg"
        />

        {/* Actions */}
        <Space direction="vertical" className="flex-shrink-0">
          <Upload
            accept="*"
            multiple
            maxCount={5}
            disabled={disabled || isSending}
            beforeUpload={(file: any) => {
              setAttachments([...attachments, file]);
              return false;
            }}
          >
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              disabled={disabled || isSending}
              title="Attach file"
            />
          </Upload>

          <Popover
            content={
              <EmojiPicker
                onEmojiClick={(emojiData: EmojiClickData) => {
                  setContent((prev) => prev + emojiData.emoji);
                  inputRef.current?.focus();
                }}
              />
            }
            trigger="click"
            placement="topLeft"
          >
            <Button
              type="text"
              icon={<SmileOutlined />}
              disabled={disabled || isSending}
              title="Emoji picker"
            />
          </Popover>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={disabled || isSending || (!content.trim() && attachments.length === 0)}
            loading={isSending}
            title="Send message (Ctrl+Enter)"
          />
        </Space>
      </div>
    </div>
  );
}

