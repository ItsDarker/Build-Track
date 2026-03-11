"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, List, Select, App, Form, Input, Space, Segmented } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UnorderedListOutlined, AppstoreOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { useUser } from "@/lib/context/UserContext";
import { canWriteModule } from "@/config/rbac";
import KanbanBoardBase, { Card as KanbanCard, Column as KanbanColumn } from "@/components/kanban/KanbanBoardBase";
import { MODULE_KANBAN_CONFIGS } from "@/components/kanban/moduleKanbanConfig";

const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Closed"];
const TASK_STATUSES = ["New", "In Progress", "Completed"];

export default function LeadsPage() {
  const { message, modal } = App.useApp();
  const { role } = useUser();
  const hasWriteAccess = canWriteModule(role.name, "crm-leads");
  const [form] = Form.useForm();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("bt_view_crm-leads") as "table" | "kanban") || "table";
    }
    return "table";
  });

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

  const fetchClients = async () => {
    const result = await apiClient.getClients();
    if (result.data) {
      setClients((result.data as any).clients);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchClients();
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

  const openViewModal = (record: any) => {
    setViewRecord(record);
    setViewModalOpen(true);
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

  const handleKanbanStatusChange = async (recordId: string, newStatus: string): Promise<boolean> => {
    const config = MODULE_KANBAN_CONFIGS["crm-leads"];
    if (!config) return false;

    try {
      // Find the current record
      const currentRecord = records.find((r) => r.id === recordId);
      if (!currentRecord) throw new Error("Record not found");

      // Prepare the updated data
      const updatedData = { ...currentRecord.data, [config.statusFieldKey]: newStatus };

      const res = await fetch(`/backend-api/modules/crm-leads/records/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        message.success("Lead status updated");
        fetchRecords();
        return true;
      } else {
        const error = await res.json();
        throw new Error(error.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      console.error("Status update failed:", e);
      message.error(`Failed to update status: ${String(e)}`);
      return false;
    }
  };

  const openModal = (record?: any) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue(record.data || {});
    } else {
      form.resetFields();
    }
    setFormModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingRecord) {
        const res = await fetch(`/backend-api/modules/crm-leads/records/${editingRecord.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(values),
        });
        if (res.ok) {
          message.success("Lead updated");
          fetchRecords();
          setFormModalOpen(false);
        } else {
          message.error("Failed to update lead");
        }
      } else {
        const res = await fetch("/backend-api/modules/crm-leads/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(values),
        });
        if (res.ok) {
          message.success("Lead created");
          fetchRecords();
          setFormModalOpen(false);
        } else {
          message.error("Failed to create lead");
        }
      }
    } catch (e) {
      message.error("Error saving lead");
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete Lead",
      content: "Are you sure you want to delete this lead?",
      onOk: async () => {
        try {
          const res = await fetch(`/backend-api/modules/crm-leads/records/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (res.ok) {
            message.success("Lead deleted");
            fetchRecords();
          } else {
            message.error("Failed to delete lead");
          }
        } catch (e) {
          message.error("Error deleting lead");
        }
      }
    });
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
        return (
          <span
            className="text-blue-500 underline cursor-pointer"
            onClick={() => openViewModal(record)}
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
            onChange={(val: string) => handleStatusChange(record, "Lead Status (New, Contacted, Qualified, Closed)", val)}
            options={LEAD_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openViewModal(record)}
          />
          {hasWriteAccess && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          )}
          {hasWriteAccess && (
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM / Leads</h1>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(v: string | number) => {
              const newMode = v as "table" | "kanban";
              setViewMode(newMode);
              localStorage.setItem("bt_view_crm-leads", newMode);
            }}
            options={[
              { value: "table", icon: <UnorderedListOutlined /> },
              { value: "kanban", icon: <AppstoreOutlined /> },
            ]}
          />
          {hasWriteAccess && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              Create New Lead
            </Button>
          )}
        </Space>
      </div>

      {viewMode === "kanban" ? (
        <KanbanBoardBase
          columns={MODULE_KANBAN_CONFIGS["crm-leads"].columns as KanbanColumn[]}
          initialCards={records.map((r) => ({
            id: r.id,
            title: r.data?.["Project Name / Reference"] || r.data?.["Customer Name"] || r.data?.["Lead ID"] || r.id.slice(-6),
            status: r.data?.["Lead Status"] || "New",
            tags: [
              r.data?.["Lead ID"],
              r.data?.["Customer Name"],
            ].filter(Boolean) as string[],
          })) as KanbanCard[]}
          onCardMove={handleKanbanStatusChange}
          onCardClick={(card) => {
            const record = records.find((r) => r.id === card.id);
            if (record) openViewModal(record);
          }}
          isLoading={loading}
          emptyColumnMessage="No leads"
          readOnly={!hasWriteAccess}
        />
      ) : (
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      )}

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
                        <Tag color={({ TODO: "default", IN_PROGRESS: "orange", DONE: "green", COMPLETED: "green", BLOCKED: "red" } as Record<string, string>)[task.status] || "default"}>
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

      {/* Create/Edit Lead Modal */}
      <Modal
        title={editingRecord ? "Edit Lead" : "Create New Lead"}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <Form.Item
            name="Lead ID"
            label="Lead ID"
            rules={[{ required: true, message: "Lead ID is required" }]}
          >
            <Input placeholder="e.g., LD-001" />
          </Form.Item>
          <Form.Item
            name="Customer Name (text)"
            label="Customer Name"
            rules={[{ required: true, message: "Customer name is required" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Search and select a client"
              options={clients.map(c => ({ value: c.name, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="Lead Status (New, Contacted, Qualified, Closed)"
            label="Lead Status"
            initialValue="New"
          >
            <Select
              options={LEAD_STATUSES.map(s => ({ value: s, label: s }))}
            />
          </Form.Item>
          <Form.Item
            name="Task Status (New, In Progress, Completed)"
            label="Task Status"
            initialValue="New"
          >
            <Select
              options={TASK_STATUSES.map(s => ({ value: s, label: s }))}
            />
          </Form.Item>
          <Form.Item
            name="Project Name / Reference"
            label="Project Name / Reference"
          >
            <Input placeholder="Enter project reference" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setFormModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingRecord ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Lead Details Modal */}
      <Modal
        title="Lead Details"
        open={viewModalOpen}
        onCancel={() => { setViewModalOpen(false); setViewRecord(null); }}
        footer={null}
        width={700}
      >
        {viewRecord ? (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(viewRecord.data || {}).map(([key, value]: [string, any]) => {
                // Skip empty values
                if (!value) return null;
                return (
                  <div key={key}>
                    <div className="text-xs text-gray-500 mb-1">{key}</div>
                    <div className="font-medium text-sm">{String(value)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
