'use client';

import React, { useState } from 'react';
import { Button, Popconfirm, Modal, Spin, App } from 'antd';
import { DeleteOutlined, DownloadOutlined, FileOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import { MessageAttachment } from '@/types/messaging';
import { apiClient } from '@/lib/api/client';

interface FileAttachmentPreviewProps {
  attachment: MessageAttachment;
  messageId: string;
  canDelete?: boolean;
  onDelete?: () => Promise<void>;
  encryptionKey?: string;
}

const FileAttachmentPreview: React.FC<FileAttachmentPreviewProps> = ({
  attachment,
  messageId,
  canDelete,
  onDelete,
  encryptionKey,
}) => {
  const { message } = App.useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isImage = attachment.mimeType.startsWith('image/');
  const isPDF = attachment.mimeType === 'application/pdf';

  const getFileIcon = () => {
    if (isImage) return <FileImageOutlined />;
    if (isPDF) return <FilePdfOutlined />;
    return <FileOutlined />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    if (!encryptionKey) {
      message.error('Encryption key not available');
      return;
    }

    try {
      setIsDownloading(true);
      const response = await apiClient.downloadMessageAttachment(
        attachment.id,
        encryptionKey
      );

      if (response.error) {
        message.error('Failed to download file');
        return;
      }

      // Create blob from response and download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([response.data as BlobPart]));
      link.download = attachment.originalName;
      link.click();
      URL.revokeObjectURL(link.href);

      message.success('File downloaded');
    } catch (err) {
      console.error('Error downloading file:', err);
      message.error('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (isImage && encryptionKey) {
      try {
        setIsDownloading(true);
        const response = await apiClient.downloadMessageAttachment(
          attachment.id,
          encryptionKey
        );

        if (!response.error) {
          const blob = new Blob([response.data as BlobPart]);
          const url = URL.createObjectURL(blob);
          setPreviewImage(url);
          setPreviewOpen(true);
        }
      } catch (err) {
        console.error('Error loading preview:', err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deleteMessageAttachment(attachment.id);
      onDelete?.();
      message.success('Attachment deleted');
    } catch (err) {
      console.error('Error deleting attachment:', err);
      message.error('Failed to delete attachment');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
        <span className="text-lg">{getFileIcon()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.originalName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {formatFileSize(attachment.size)}
          </p>
        </div>
        <div className="flex gap-1">
          {isImage && (
            <Button
              type="text"
              size="small"
              onClick={handlePreview}
              loading={isDownloading}
              title="Preview"
            >
              👁️
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            loading={isDownloading}
            title="Download"
          />
          {canDelete && (
            <Popconfirm
              title="Delete attachment"
              description="Remove this file?"
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={isDeleting ? <Spin size="small" /> : <DeleteOutlined />}
                disabled={isDeleting}
                title="Delete"
              />
            </Popconfirm>
          )}
        </div>
      </div>

      <Modal
        title={attachment.originalName}
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false);
          if (previewImage) {
            URL.revokeObjectURL(previewImage);
          }
        }}
        width={800}
        footer={null}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt={attachment.originalName}
            style={{ maxWidth: '100%', maxHeight: '600px' }}
          />
        )}
      </Modal>
    </>
  );
};

export default FileAttachmentPreview;
