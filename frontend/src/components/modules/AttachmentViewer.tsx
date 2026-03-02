"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Space,
  Spin,
  Empty,
  Tag,
  Typography,
  Tooltip,
  App,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt?: string;
  uploadedBy?: { name?: string; email: string };
}

interface AttachmentViewerProps {
  visible: boolean;
  attachment: Attachment | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function AttachmentViewer({
  visible,
  attachment,
  onClose,
  onDelete,
  canDelete = false,
}: AttachmentViewerProps) {
  const { modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{
    type: "image" | "pdf" | "text" | "unsupported";
    url?: string;
    data?: string;
  } | null>(null);

  useEffect(() => {
    if (visible && attachment) {
      loadContent();
    }
  }, [visible, attachment]);

  const loadContent = async () => {
    if (!attachment) return;

    setLoading(true);
    setContent(null);

    try {
      const mimeType = attachment.mimeType.toLowerCase();
      const viewUrl = `/backend-api/attachments/view/${attachment.id}`;

      // Images
      if (mimeType.startsWith("image/")) {
        setContent({ type: "image", url: viewUrl });
        return;
      }

      // PDFs
      if (mimeType === "application/pdf") {
        setContent({ type: "pdf", url: viewUrl });
        return;
      }

      // Text files
      if (
        mimeType.startsWith("text/") ||
        mimeType === "application/json" ||
        mimeType === "application/xml"
      ) {
        const res = await fetch(viewUrl);
        if (res.ok) {
          const text = await res.text();
          setContent({ type: "text", data: text });
        } else {
          setContent({ type: "unsupported" });
        }
        return;
      }

      // Unsupported
      setContent({ type: "unsupported" });
    } catch (error) {
      console.error("Failed to load attachment:", error);
      setContent({ type: "unsupported" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!attachment || !onDelete) return;

    modal.confirm({
      title: "Delete Attachment",
      content: `Are you sure you want to delete "${attachment.filename}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        onDelete(attachment.id);
      },
    });
  };

  const handleDownload = () => {
    if (!attachment) return;
    window.open(`/backend-api/attachments/download/${attachment.id}`, "_blank");
  };

  const getFileIcon = () => {
    if (!attachment) return <FileOutlined />;

    const mime = attachment.mimeType.toLowerCase();
    if (mime.startsWith("image/")) {
      return <FileImageOutlined className="text-blue-500" />;
    }
    if (mime === "application/pdf") {
      return <FilePdfOutlined className="text-red-500" />;
    }
    if (mime.startsWith("text/")) {
      return <FileTextOutlined className="text-gray-500" />;
    }
    return <FileOutlined className="text-gray-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Modal
      open={visible}
      title={
        <div className="flex items-center gap-2">
          {getFileIcon()}
          <span className="truncate">{attachment?.filename}</span>
        </div>
      }
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: "900px" }}
      footer={
        <div className="flex items-center justify-between">
          {attachment && (
            <div className="flex items-center gap-2 flex-1">
              <Text type="secondary" className="text-xs">
                {formatFileSize(attachment.size)}
              </Text>
              <Tag color="blue">{attachment.mimeType}</Tag>
              {attachment.createdAt && (
                <Text type="secondary" className="text-xs">
                  {new Date(attachment.createdAt).toLocaleString()}
                </Text>
              )}
            </div>
          )}
          <Space>
            <Button onClick={handleDownload} icon={<DownloadOutlined />}>
              Download
            </Button>
            {canDelete && (
              <Button
                onClick={handleDelete}
                icon={<DeleteOutlined />}
                danger
              >
                Delete
              </Button>
            )}
            <Button onClick={onClose} icon={<CloseOutlined />}>
              Close
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={loading} size="large">
        <div className="bg-gray-50 rounded-lg p-6 min-h-[500px] flex items-center justify-center">
          {!content ? (
            <Empty description="Loading..." />
          ) : content.type === "image" ? (
            <img
              src={content.url}
              alt={attachment?.filename}
              className="max-w-full max-h-[500px] object-contain"
            />
          ) : content.type === "pdf" ? (
            <iframe
              src={content.url}
              width="100%"
              height="500px"
              style={{ border: "none", borderRadius: "6px" }}
            />
          ) : content.type === "text" ? (
            <pre className="w-full overflow-auto bg-white border border-gray-200 rounded p-4 text-xs max-h-[500px] text-gray-800">
              {content.data}
            </pre>
          ) : (
            <Empty
              description="Cannot Preview"
              style={{
                marginTop: "50px",
              }}
            >
              <div className="mt-4 text-sm text-gray-600">
                <p>This file type cannot be previewed in the browser.</p>
                <Button
                  type="primary"
                  onClick={handleDownload}
                  icon={<DownloadOutlined />}
                  className="mt-2"
                >
                  Download to view
                </Button>
              </div>
            </Empty>
          )}
        </div>
      </Spin>
    </Modal>
  );
}
