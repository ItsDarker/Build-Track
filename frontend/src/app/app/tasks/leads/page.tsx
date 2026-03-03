"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, List, Select, App } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Closed"];
const TASK_STATUSES = ["New", "In Progress", "Completed"];

export default function LeadsPage() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/backend-api/modules/crm-leads/records", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records ?? []);
      }
    } catch (e) {
      console.error("Failed to load leads:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const openProjectDetails = async (projectId: string) => {
    if (!projectId) return;
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    const result = await apiClient.getProject(projectId);
    if (result.data) {
      setDetailsProject((result.data as any).project);
    }
    setDetailsLoading(false);
  };

  const handleStatusChange = async (record: any, field: string, value: string) => {
    try {
      const updatedData = { ...record.data, [field]: value };
      const res = await fetch(`/backend-api/modules/crm-leads/records/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        message.success("Status updated");
        fetchRecords();
      } else {
        message.error("Failed to update status");
      }
    } catch (e) {
      message.error("Failed to update status");
    }
  };

  const taskStatusColors: Record<string, string> = {
    New: "default",
    "In Progress": "orange",
    Completed: "green",
  };

  const leadStatusColors: Record<string, string> = {
    New: "blue",
    Contacted: "orange",
    Qualified: "purple",
    Closed: "green",
  };

  const columns = [
    {
      title: "Lead ID",
      key: "leadId",
      render: (_: any, record: any) => {
        const leadId = record.data?.["Lead ID"] || record.id.slice(-6).toUpperCase();
        const projectId = record.data?._projectId;
        return (
          <span
            className="text-blue-500 underline cursor-pointer"
            onClick={() => openProjectDetails(projectId)}
          >
            {leadId}
          </span>
        );
      },
    },
    {
      title: "Project ID",
      key: "projectCode",
      render: (_: any, record: any) => {
        const projectCode = record.data?._projectCode;
        const projectId = record.data?._projectId;
        return projectCode ? (
          <span
            className="text-blue-500 underline cursor-pointer"
            onClick={() => openProjectDetails(projectId)}
          >
            {projectCode}
          </span>
        ) : "-";
      },
    },
    {
      title: "Project Name",
      key: "projectName",
      render: (_: any, record: any) => record.data?._projectName || record.data?.["Project Name / Reference"] || "-",
    },
    {
      title: "Customer",
      key: "customer",
      render: (_: any, record: any) => record.data?.["Customer Name (text)"] || "-",
    },
    {
      title: "Task Status",
      key: "taskStatus",
      render: (_: any, record: any) => {
        const status = record.data?.["Task Status (New, In Progress, Completed)"] || "New";
        return <Tag color={taskStatusColors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Lead Status",
      key: "leadStatus",
      render: (_: any, record: any) => {
        const status = record.data?.["Lead Status (New, Contacted, Qualified, Closed)"] || "New";
        return (
          <Select
            value={status}
            size="small"
            style={{ width: 130 }}
            onChange={(val) => handleStatusChange(record, "Lead Status (New, Contacted, Qualified, Closed)", val)}
            options={LEAD_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openProjectDetails(record.data?._projectId)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM / Leads</h1>
      </div>

      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Project Details Modal */}
      <Modal
        title="Project Details"
        open={detailsModalOpen}
        onCancel={() => { setDetailsModalOpen(false); setDetailsProject(null); }}
        footer={null}
        width={700}
      >
        {detailsLoading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : detailsProject ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Project Name</div>
                <div className="font-medium">{detailsProject.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Project ID</div>
                <div className="font-medium">{detailsProject.code || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Client</div>
                <div className="font-medium">{detailsProject.client?.name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Project Manager</div>
                <div className="font-medium">{detailsProject.manager?.name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <Tag color={{ PLANNING: "blue", IN_PROGRESS: "orange", COMPLETED: "green", ON_HOLD: "default", CANCELLED: "red" }[detailsProject.status as string]}>
                  {detailsProject.status?.replace("_", " ")}
                </Tag>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <div className="font-medium">{detailsProject.description || "-"}</div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">Tasks</div>
              {detailsProject.tasks?.length > 0 ? (
                <List
                  bordered
                  dataSource={detailsProject.tasks}
                  renderItem={(task: any) => (
                    <List.Item>
                      <div className="flex justify-between w-full items-center">
                        <span>{task.title}</span>
                        <Tag color={{ TODO: "default", IN_PROGRESS: "orange", DONE: "green", COMPLETED: "green", BLOCKED: "red" }[task.status] || "default"}>
                          {task.status?.replace("_", " ")}
                        </Tag>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-gray-400 text-sm">No tasks yet.</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
