"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Button, Empty, Spin, Upload, message, Modal, Tag, Input, Select, Row, Col } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined, FileOutlined, SearchOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import type { UploadFile } from "antd/es/upload/interface";

interface Document {
  id: string;
  fileName: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  projectId?: string;
  mimeType?: string;
  driveFileId?: string;
  data?: any;
}

interface Project {
  id: string;
  name: string;
}

export default function BasicDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/projects");
      if (res.data) {
        setProjects((res.data as any).projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const endpoint = selectedProject
        ? `/projects/${selectedProject}/attachments`
        : "/attachments";
      const res = await apiClient.get(endpoint);

      if (res.data) {
        const docs = (res.data as any).attachments || (res.data as any).data || [];
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      message.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: UploadFile) => {
    if (!file) return false;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file as any);
      if (selectedProject) {
        formData.append("projectId", selectedProject);
      }

      const res = await fetch("/backend-api/attachments/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("Upload response:", responseData);
        message.success("Document uploaded successfully");
        await fetchDocuments();
      } else {
        const errorData = await res.json().catch(() => ({}));
        message.error(
          errorData.message || errorData.error || "Failed to upload document"
        );
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      message.error("Failed to upload document");
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleDelete = async (docId: string) => {
    Modal.confirm({
      title: "Delete Document",
      content: "Are you sure you want to delete this document?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/attachments/${docId}`);
          message.success("Document deleted successfully");
          await fetchDocuments();
        } catch (error) {
          console.error("Failed to delete document:", error);
          message.error("Failed to delete document");
        }
      },
    });
  };

  const handleDownload = async (doc: Document) => {
    try {
      const res = await fetch(
        `/backend-api/attachments/${doc.id}/download`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.fileName || "download";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        message.error("Failed to download document");
      }
    } catch (error) {
      console.error("Failed to download document:", error);
      message.error("Failed to download document");
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "File Name",
      dataIndex: "fileName",
      key: "fileName",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <FileOutlined />
          {text}
        </div>
      ),
      width: 250,
    },
    {
      title: "Type",
      dataIndex: "mimeType",
      key: "mimeType",
      render: (type: string) => {
        let color = "blue";
        if (type?.includes("pdf")) color = "red";
        else if (type?.includes("image")) color = "green";
        else if (type?.includes("word") || type?.includes("document"))
          color = "purple";
        else if (type?.includes("sheet")) color = "orange";
        return (
          <Tag color={color}>{type?.split("/")[1]?.toUpperCase() || "FILE"}</Tag>
        );
      },
      width: 100,
    },
    {
      title: "Size",
      dataIndex: "fileSize",
      key: "fileSize",
      render: (size: number) => {
        if (!size) return "—";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      },
      width: 100,
    },
    {
      title: "Uploaded By",
      dataIndex: "uploadedBy",
      key: "uploadedBy",
      render: (uploader: string) => uploader || "—",
      width: 150,
    },
    {
      title: "Date",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "—",
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Document) => (
        <div className="flex gap-2">
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            title="Download"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            title="Delete"
          />
        </div>
      ),
      width: 100,
    },
  ];

  return (
    <div className="w-full bg-white p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-2">Manage and organize project documents</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Search documents..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e: any) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Select
                  placeholder="Filter by project"
                  allowClear
                  value={selectedProject}
                  onChange={setSelectedProject}
                  style={{ width: "100%" }}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Upload
                  beforeUpload={handleUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,image/*,.jpg,.jpeg,.png,.gif"
                  disabled={uploading}
                  maxCount={5}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    loading={uploading}
                    block
                  >
                    Upload Documents
                  </Button>
                </Upload>
              </Col>
            </Row>

            {filteredDocuments.length === 0 ? (
              <Empty description="No documents found" />
            ) : (
              <Table
                dataSource={filteredDocuments}
                columns={columns}
                pagination={{ pageSize: 15, showSizeChanger: true }}
                rowKey="id"
                scroll={{ x: 1000 }}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
