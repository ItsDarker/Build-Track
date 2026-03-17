'use client';

import React, { useRef, useState } from 'react';
import { Button, Space, Input, Tooltip, Progress, App } from 'antd';
import { SendOutlined, PaperClipOutlined, SmileOutlined } from '@ant-design/icons';

interface MessageComposerProps {
  onSend: (text: string, files: File[]) => Promise<void>;
  disabled?: boolean;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled = false }) => {
  const { message } = App.useApp();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const maxChars = 4000;
  const isOverLimit = charCount > maxChars;

  const handleSend = async () => {
    if (!content.trim() && files.length === 0) {
      message.warning('Enter a message or select a file');
      return;
    }

    if (isOverLimit) {
      message.error('Message exceeds 4000 character limit');
      return;
    }

    try {
      setIsLoading(true);
      await onSend(content.trim(), files);
      setContent('');
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate file count
    if (files.length + selectedFiles.length > 5) {
      message.error('Maximum 5 files per message');
      return;
    }

    // Validate file size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0) +
                      selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (totalSize > maxSize) {
      message.error('Total file size cannot exceed 50MB');
      return;
    }

    setFiles([...files, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded text-sm flex items-center gap-2"
            >
              <span className="truncate max-w-xs">{file.name}</span>
              <Button
                type="text"
                size="small"
                onClick={() => removeFile(idx)}
                className="!h-auto !p-0 !w-auto !min-w-0"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Message input */}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Ctrl+Enter to send)"
          disabled={isLoading || disabled}
          maxLength={maxChars}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          style={{ minHeight: '40px', maxHeight: '200px' }}
          rows={1}
        />
        <div className="flex flex-col gap-1">
          <Tooltip title="Attach files (max 5, 50MB total)">
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled}
            />
          </Tooltip>
          <Tooltip title="Send message (Ctrl+Enter)">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isLoading}
              disabled={(!content.trim() && files.length === 0) || disabled || isOverLimit}
            />
          </Tooltip>
        </div>
      </div>

      {/* Character count and file input */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {charCount} / {maxChars} characters
          {isOverLimit && <span className="text-red-500 ml-2">Over limit!</span>}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
        />
      </div>
    </div>
  );
};

export default MessageComposer;
