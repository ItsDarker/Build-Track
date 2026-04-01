"use client";

import { useEffect, useState } from "react";
import { Button, Card, Tag, Space, Modal, Form, Input, Select, DatePicker, App, Steps, Tabs, Table, Divider, AutoComplete } from "antd";
import { PlusOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, CloseCircleOutlined, WarningOutlined, UndoOutlined, CheckCircleOutlined, UserAddOutlined, SendOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { downloadExcel } from "@/lib/downloadExcel";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import BasicRoute from "@/components/auth/BasicRoute";

/** Generate a Project ID based on project name and timestamp */
function generateProjectId(projectName: string): string {
  const prefix = projectName
    .split(/[\s\/]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

/** Workflow steps for Basic plan */
const WORKFLOW_STEPS = [
  { key: "inquiry", title: "Inquiry", position: 0 },
  { key: "consultation", title: "Consultation", position: 1 },
  { key: "design", title: "Design", position: 2 },
  { key: "quote", title: "Quote", position: 3 },
  { key: "approval", title: "Approval", position: 4 },
  { key: "production", title: "Production", position: 5 },
  { key: "delivery", title: "Delivery", position: 6 },
];

/** Map project status to workflow step index */
function getWorkflowStepFromStatus(status: string): number {
  const statusMap: Record<string, number> = {
    PLANNING: 0,
    DESIGN: 1,
    QUOTING: 2,
    APPROVAL: 3,
    PRODUCTION: 4,
    DELIVERY: 5,
    COMPLETED: 6,
  };
  return statusMap[status] ?? 0;
}

/** Get status badge variant and label */
function getStatusBadge(status: string, dueDate?: string) {
  const now = dayjs();
  const due = dueDate ? dayjs(dueDate) : null;
  const isOverdue = due && due.isBefore(now);

  if (status === "CANCELLED") {
    return { label: "Cancelled", color: "default" };
  }
  if (status === "COMPLETED") {
    return { label: "Completed", color: "success" };
  }
  if (isOverdue) {
    return { label: "Delayed", color: "error" };
  }
  return { label: "In Progress", color: "processing" };
}

export default function BasicProjectsPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editModalTab, setEditModalTab] = useState("details");
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectInvitations, setProjectInvitations] = useState<any[]>([]);
  const [startForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const [inviteLoading, setInviteLoading] = useState(false);
  const [emailSearch, setEmailSearch] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [selectedInviteeId, setSelectedInviteeId] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsRes, clientsRes, managersRes, userRes] = await Promise.all([
          apiClient.getProjects(),
          apiClient.getClients(),
          apiClient.getAssignableUsers("PROJECT_MANAGER"),
          apiClient.getCurrentUser(),
        ]);

        if (projectsRes.data) {
          setProjects((projectsRes.data as any).projects || []);
        }
        if (clientsRes.data) {
          setClients((clientsRes.data as any).clients || []);
        }
        if (managersRes.data) {
          setManagers((managersRes.data as any).users || []);
        }
        if (userRes.data) {
          setCurrentUser((userRes.data as any).user);
        }
      } catch (error) {
        message.error("Failed to load projects");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [message]);

  const handleSave = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        clientId: values.clientId,
        assignedToId: values.projectManagerId || currentUser?.id,
        managerId: values.projectManagerId || currentUser?.id,
        description: values.description,
        status: values.status || "PLANNING",
        budget: values.budget || 0,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        ...(editingProject ? {} : { code: generateProjectId(values.name) }),
      };

      const result = editingProject
        ? await apiClient.updateProject(editingProject.id, payload)
        : await apiClient.createProject(payload);

      if (result.error) {
        message.error(result.error || "Failed to save project");
        return;
      }

      if (result.data) {
        const savedProject = (result.data as any).project;
        if (editingProject) {
          setProjects((prev) => prev.map((p) => (p.id === savedProject.id ? savedProject : p)));
          message.success("Project updated successfully");
        } else {
          setProjects((prev) => [...prev, savedProject]);
          message.success("Project created successfully");
        }
        setIsModalOpen(false);
        setEditingProject(null);
        form.resetFields();
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to save project");
    }
  };

  const handleStart = async (values: any) => {
    try {
      const result = await apiClient.startProject(
        editingProject.id,
        values.taskTitle,
        values.assigneeId
      );

      if (result.error) {
        message.error(result.error || "Failed to start project");
        return;
      }

      message.success("Project started successfully");
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, status: "IN_PROGRESS" } : p))
      );
      setEditingProject(null);
      setIsModalOpen(false);
      startForm.resetFields();
    } catch (error) {
      console.error(error);
      message.error("Failed to start project");
    }
  };

  const handleClose = async (values: any) => {
    try {
      const result = await apiClient.closeProject(
        editingProject.id,
        values.completionNote
      );

      if (result.error) {
        message.error(result.error || "Failed to close project");
        return;
      }

      message.success("Project closed successfully");
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, status: "COMPLETED" } : p))
      );
      setEditingProject(null);
      setIsModalOpen(false);
      closeForm.resetFields();
    } catch (error) {
      console.error(error);
      message.error("Failed to close project");
    }
  };

  const handleDelete = async () => {
    modal.confirm({
      title: "Delete Project",
      content: "Are you sure you want to delete this project? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const result = await apiClient.deleteProject(editingProject.id);
          if (result.error) {
            message.error(result.error || "Failed to delete project");
            return;
          }
          message.success("Project deleted successfully");
          setProjects((prev) => prev.filter((p) => p.id !== editingProject.id));
          setIsModalOpen(false);
          setEditingProject(null);
        } catch (error) {
          console.error(error);
          message.error("Failed to delete project");
        }
      },
    });
  };

  const handleDownloadExcel = () => {
    const data = projects.map((p) => ({
      "Project ID": p.projectCode || p.code,
      "Project Name": p.name,
      Customer: clients.find((c) => c.id === p.clientId)?.name || "Unknown",
      Status: p.status,
      "Due Date": p.endDate ? dayjs(p.endDate).format("MMM DD, YYYY") : "N/A",
      "Project Manager": managers.find((m) => m.id === p.projectManagerId)?.name || "Unassigned",
    }));

    downloadExcel(data, undefined, "projects");
  };

  const handleEmailSearch = async (value: string) => {
    setEmailSearch(value);
    if (value.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const result = await apiClient.searchUsers(value, editingProject?.id);
      if (result.data) {
        const users = (result.data as any).users || [];
        setUserSuggestions(
          users.map((u: any) => ({
            value: u.id,
            label: `${u.name || u.email} (${u.email})`,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedInviteeId || !editingProject) {
      message.error("Please select a user to invite");
      return;
    }

    setInviteLoading(true);
    try {
      const result = await apiClient.sendProjectInvitation(editingProject.id, {
        inviteeId: selectedInviteeId,
        message: inviteMessage,
      });

      if (result.error) {
        message.error(result.error || "Failed to send invitation");
        return;
      }

      message.success("Invitation sent successfully");
      setEmailSearch("");
      setSelectedInviteeId(null);
      setInviteMessage("");
      inviteForm.resetFields();

      // Refresh invitations
      if (editingProject) {
        const invRes = await apiClient.getProjectInvitations(editingProject.id);
        if (invRes.data) {
          setProjectInvitations((invRes.data as any).invitations || []);
        }
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!editingProject) return;

    modal.confirm({
      title: "Remove Team Member",
      content: "Are you sure you want to remove this member from the project?",
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          const result = await apiClient.deleteProjectInvitation(editingProject.id, memberId);
          if (result.error) {
            message.error(result.error || "Failed to remove member");
            return;
          }
          message.success("Member removed successfully");
          setProjectMembers((prev) => prev.filter((m) => m.id !== memberId));
        } catch (error) {
          console.error(error);
          message.error("Failed to remove member");
        }
      },
    });
  };

  const handleDeleteInvite = async (invitationId: string) => {
    if (!editingProject) return;

    try {
      const result = await apiClient.deleteProjectInvitation(editingProject.id, invitationId);
      if (result.error) {
        message.error(result.error || "Failed to delete invitation");
        return;
      }
      message.success("Invitation deleted");
      setProjectInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error(error);
      message.error("Failed to delete invitation");
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    if (!editingProject) return;

    try {
      const result = await apiClient.resendProjectInvitation(editingProject.id, invitationId);
      if (result.error) {
        message.error(result.error || "Failed to resend invitation");
        return;
      }
      message.success("Invitation resent");
    } catch (error) {
      console.error(error);
      message.error("Failed to resend invitation");
    }
  };

  const openModal = (project?: any) => {
    if (project) {
      setEditingProject(project);
      form.setFieldsValue({
        name: project.name,
        code: project.projectCode || project.code,
        description: project.description,
        clientId: project.clientId,
        projectManagerId: project.projectManagerId,
        status: project.status,
        startDate: project.startDate ? dayjs(project.startDate) : null,
        endDate: project.endDate ? dayjs(project.endDate) : null,
      });

      // Fetch project members and invitations
      Promise.all([
        apiClient.getProjectInvitations(project.id),
      ])
        .then(([invRes]) => {
          if (invRes.data) {
            const invitations = (invRes.data as any).invitations || [];
            // Separate accepted and pending invitations
            setProjectMembers(invitations.filter((inv: any) => inv.status === "ACCEPTED"));
            setProjectInvitations(invitations);
          }
        })
        .catch((err) => console.error("Failed to fetch data:", err));
    } else {
      setEditingProject(null);
      form.resetFields();
    }
    setProjectMembers([]); // Reset members
    setProjectInvitations([]);
    setEmailSearch("");
    setSelectedInviteeId(null);
    setInviteMessage("");
    inviteForm.resetFields();
    setEditModalTab("details");
    setIsModalOpen(true);
  };

  const renderProjectCard = (project: any) => {
    const clientName = clients.find((c) => c.id === project.clientId)?.name || "Unknown Client";
    const currentStep = getWorkflowStepFromStatus(project.status);
    const statusBadge = getStatusBadge(project.status, project.endDate);
    const dueDate = project.endDate ? dayjs(project.endDate) : null;
    const now = dayjs();
    const isOverdue = dueDate && dueDate.isBefore(now);

    return (
      <Card
        key={project.id}
        className="mb-6 shadow-sm hover:shadow-md transition-shadow"
        style={{ borderRadius: 8 }}
      >
        {/* Header with Client + Project Name + Warning */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-900">{clientName}</div>
            <div className="text-base font-normal text-gray-700">{project.name}</div>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-2 text-red-600 font-semibold ml-4">
              <WarningOutlined className="text-lg" />
              <span>Target Missed</span>
            </div>
          )}
        </div>

        {/* Workflow Stepper - Horizontal */}
        <div className="mb-6">
          <div className="flex items-center" style={{ gap: "0" }}>
            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={step.key} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0" }}>
                {/* Step Circle */}
                <div className="flex flex-col items-center" style={{ minWidth: "fit-content" }}>
                  <div
                    className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor:
                        idx < currentStep
                          ? "#20c997" // Completed - teal
                          : idx === currentStep
                            ? "transparent"
                            : "#d9d9d9", // Pending - light gray
                      border: idx === currentStep ? "3px solid #1890ff" : "none",
                      fontSize: "18px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {idx < currentStep ? (
                      <span style={{ fontSize: "24px" }}>✓</span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  {/* Step Title */}
                  <span
                    className="text-center text-sm font-semibold text-gray-700 whitespace-nowrap"
                    style={{ fontSize: "13px" }}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Connector Line (between circles) */}
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: "3px",
                      backgroundColor: idx < currentStep ? "#20c997" : "#d9d9d9",
                      margin: "0 -2px",
                      marginTop: "-28px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Badge + Due Date + Action Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag color={statusBadge.color}>{statusBadge.label}</Tag>
            {dueDate && (
              <div className="text-sm text-gray-600">
                <span>Due {dueDate.format("MMM DD, YYYY")}</span>
                {isOverdue && <span className="ml-2 text-red-600">• Overdue</span>}
              </div>
            )}
          </div>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => openModal(project)}
          >
            Edit
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <BasicRoute>
      <div className="w-full">
        {/* Header with Title and Action Buttons */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadExcel}>
              Download Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              New Project
            </Button>
          </Space>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="text-center py-12">
              <p className="text-gray-500">Loading projects...</p>
            </Card>
          ) : projects.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                Create Your First Project
              </Button>
            </Card>
          ) : (
            projects.map((project) => renderProjectCard(project))
          )}
        </div>

        {/* Project Modal - Create/Edit */}
        <Modal
          title={editingProject ? "Edit Project" : "New Project"}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingProject(null);
            form.resetFields();
          }}
          footer={null}
          width={900}
        >
          {!editingProject ? (
            // Create mode
            <Form form={form} layout="vertical" onFinish={handleSave} className="mt-6">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="name" label="Project Name" rules={[{ required: true, message: "Project name is required" }]}>
                  <Input placeholder="e.g., Office Renovation" size="large" />
                </Form.Item>
                <Form.Item
                  name="code"
                  label="Project ID"
                  tooltip="Auto-generated based on project name"
                >
                  <Input placeholder="Auto-generated" disabled size="large" />
                </Form.Item>
              </div>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Project description..." />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="clientId"
                  label="Customer"
                  rules={[{ required: true, message: "Customer is required" }]}
                >
                  <Select
                    placeholder="Select a customer"
                    size="large"
                    options={clients.map((c) => ({ label: c.name, value: c.id }))}
                  />
                </Form.Item>
                <Form.Item
                  name="projectManagerId"
                  label="Project Manager"
                  initialValue={currentUser?.id}
                >
                  <Select
                    placeholder="Select project manager"
                    size="large"
                    options={managers.map((m) => ({ label: m.name || m.email, value: m.id }))}
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Form.Item name="status" label="Status" initialValue="PLANNING">
                  <Select
                    options={[
                      { value: "PLANNING", label: "Planning" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "ON_HOLD", label: "On Hold" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="startDate" label="Target Start Date">
                  <DatePicker size="large" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item name="endDate" label="Target End Date">
                  <DatePicker size="large" style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit">
                  Create Project
                </Button>
              </div>
            </Form>
          ) : (
            // Edit mode - Tabs
            <Tabs
              activeKey={editModalTab}
              onChange={setEditModalTab}
              items={[
                {
                  key: "details",
                  label: "Details",
                  children: (
                    <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <Form.Item name="code" label="Project ID">
                          <Input disabled className="bg-gray-50" />
                        </Form.Item>
                      </div>

                      <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                      </Form.Item>

                      <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="clientId" label="Customer" rules={[{ required: true }]}>
                          <Select
                            options={clients.map((c) => ({ label: c.name, value: c.id }))}
                          />
                        </Form.Item>
                        <Form.Item name="projectManagerId" label="Project Manager">
                          <Select
                            options={managers.map((m) => ({ label: m.name || m.email, value: m.id }))}
                          />
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <Form.Item name="status" label="Status">
                          <Select
                            options={[
                              { value: "PLANNING", label: "Planning" },
                              { value: "IN_PROGRESS", label: "In Progress" },
                              { value: "ON_HOLD", label: "On Hold" },
                              { value: "COMPLETED", label: "Completed" },
                              { value: "CANCELLED", label: "Cancelled" },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item name="startDate" label="Target Start Date">
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item name="endDate" label="Target End Date">
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">
                          Save Changes
                        </Button>
                      </div>
                    </Form>
                  ),
                },
                {
                  key: "members",
                  label: "Team Members",
                  children: (
                    <div className="mt-4 space-y-6">
                      {/* Send New Invitation Section */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-900 mb-3">Send New Invitation</h3>
                        <div className="space-y-3">
                          <div>
                            <AutoComplete
                              className="w-full"
                              value={emailSearch}
                              options={userSuggestions}
                              onSearch={handleEmailSearch}
                              onChange={(value: string) => {
                                setEmailSearch(value);
                                const selected = userSuggestions.find((s) => s.value === value);
                                setSelectedInviteeId(selected ? value : null);
                              }}
                              placeholder="Start typing email or name..."
                              notFoundContent={
                                emailSearch.length < 2
                                  ? "Type at least 2 characters"
                                  : "No users found"
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Optional Message</label>
                            <Input.TextArea
                              rows={2}
                              placeholder="Add a personal message..."
                              value={inviteMessage}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInviteMessage(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          type="primary"
                          loading={inviteLoading}
                          disabled={!selectedInviteeId}
                          onClick={handleSendInvite}
                          icon={<SendOutlined />}
                          block
                        >
                          Send Invitation
                        </Button>
                      </div>

                      <Divider />

                      {/* Active Team Members Section */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Active Team Members</h3>
                        {projectMembers.length === 0 ? (
                          <div className="text-center text-gray-500 py-6 border rounded-lg bg-gray-50">
                            No active members yet
                          </div>
                        ) : (
                          <Table
                            columns={[
                              {
                                title: "User",
                                key: "user",
                                render: (_: any, record: any) => (
                                  <div>
                                    <div className="font-medium">
                                      {record.invitee?.name || record.user?.name || record.invitee?.email || record.user?.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {record.invitee?.email || record.user?.email}
                                    </div>
                                  </div>
                                ),
                              },
                              {
                                title: "Role",
                                key: "role",
                                render: () => <Tag color="blue">Member</Tag>,
                              },
                              {
                                title: "Actions",
                                key: "actions",
                                render: (_: any, record: any) => (
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    onClick={() => handleRemoveMember(record.id)}
                                  >
                                    Remove
                                  </Button>
                                ),
                              },
                            ]}
                            dataSource={projectMembers}
                            rowKey="id"
                            pagination={false}
                            size="small"
                          />
                        )}
                      </div>

                      {/* Sent Invitations Section */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Sent Invitations</h3>
                        {projectInvitations.filter((inv: any) => inv.status === "PENDING").length === 0 ? (
                          <div className="text-center text-gray-500 py-6">
                            No pending invitations
                          </div>
                        ) : (
                          <Table
                            columns={[
                              {
                                title: "User",
                                key: "user",
                                render: (_: any, record: any) => (
                                  <div>
                                    <div className="font-medium">
                                      {record.invitee?.name || record.invitee?.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {record.invitee?.email}
                                    </div>
                                  </div>
                                ),
                              },
                              {
                                title: "Status",
                                dataIndex: "status",
                                key: "status",
                                render: (status: string) => {
                                  const colors: Record<string, string> = {
                                    PENDING: "orange",
                                    ACCEPTED: "green",
                                    DECLINED: "red",
                                  };
                                  return <Tag color={colors[status]}>{status}</Tag>;
                                },
                              },
                              {
                                title: "Sent",
                                dataIndex: "createdAt",
                                key: "createdAt",
                                render: (date: string) =>
                                  new Date(date).toLocaleDateString(),
                              },
                              {
                                title: "Actions",
                                key: "actions",
                                render: (_: any, record: any) => (
                                  <Space>
                                    {record.status === "PENDING" && (
                                      <Button
                                        size="small"
                                        onClick={() => handleResendInvite(record.id)}
                                      >
                                        Resend
                                      </Button>
                                    )}
                                    <Button
                                      size="small"
                                      danger
                                      onClick={() => handleDeleteInvite(record.id)}
                                    >
                                      Delete
                                    </Button>
                                  </Space>
                                ),
                              },
                            ]}
                            dataSource={projectInvitations.filter(
                              (inv: any) => inv.status === "PENDING"
                            )}
                            rowKey="id"
                            pagination={false}
                            size="small"
                          />
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  children: (
                    <div className="mt-4 space-y-6">
                      {editingProject?.status !== "COMPLETED" && editingProject?.status !== "CANCELLED" && (
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Start Project</h3>
                          <Form form={startForm} layout="vertical" onFinish={handleStart}>
                            <Form.Item name="taskTitle" label="First Task Title" rules={[{ required: true }]}>
                              <Input />
                            </Form.Item>
                            <Form.Item name="assigneeId" label="Assign Task To" rules={[{ required: true }]}>
                              <Select
                                options={managers.map((m) => ({ label: m.name || m.email, value: m.id }))}
                              />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} block>
                              Start Project
                            </Button>
                          </Form>
                        </div>
                      )}

                      {editingProject?.status !== "COMPLETED" && editingProject?.status !== "CANCELLED" && (
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Close Project</h3>
                          <Form form={closeForm} layout="vertical" onFinish={handleClose}>
                            <Form.Item name="completionNote" label="Completion Note (optional)">
                              <Input.TextArea rows={2} />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} block>
                              Close Project
                            </Button>
                          </Form>
                        </div>
                      )}

                      <Divider />

                      <div>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleDelete}
                          block
                        >
                          Delete Project
                        </Button>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Modal>
      </div>
    </BasicRoute>
  );
}
