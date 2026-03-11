"use client";

import { useEffect, useState } from "react";
import { Table, Button, Card, Tag, Space, Modal, Form, Input, Select, DatePicker, App, Upload, List, AutoComplete, Tabs, Segmented } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UserAddOutlined, PlayCircleOutlined, CloseCircleOutlined, CheckCircleOutlined, UndoOutlined, FolderOpenOutlined, InboxOutlined, TeamOutlined, UnorderedListOutlined, AppstoreOutlined } from "@ant-design/icons";
import { getAllModules } from "@/config/buildtrack.config";
import { apiClient } from "@/lib/api/client";
import { downloadExcel } from "@/lib/downloadExcel";
import KanbanBoardBase, { Card as KanbanCard, Column as KanbanColumn } from "@/components/kanban/KanbanBoardBase";
import { PROJECT_KANBAN_CONFIG } from "@/components/kanban/moduleKanbanConfig";
import dayjs from "dayjs";

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

export default function ProjectsPage() {
    const { message, modal } = App.useApp();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [form] = Form.useForm();
    const [viewMode, setViewMode] = useState<"table" | "kanban">(() => {
      if (typeof window !== "undefined") {
        return (localStorage.getItem("bt_view_projects") as "table" | "kanban") || "table";
      }
      return "table";
    });

    // Action modal states (now inside edit modal)
    const [activeProject, setActiveProject] = useState<any>(null);
    const [assignForm] = Form.useForm();
    const [startForm] = Form.useForm();
    const [cancelForm] = Form.useForm();
    const [closeForm] = Form.useForm();

    // Team Invitations modal states (now inside edit modal)
    const [projectInvitations, setProjectInvitations] = useState<any[]>([]);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [emailSearch, setEmailSearch] = useState('');
    const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
    const [selectedInviteeId, setSelectedInviteeId] = useState<string | null>(null);
    const [inviteMessage, setInviteMessage] = useState('');
    const [editModalTab, setEditModalTab] = useState('details');

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchManagers();
        fetchAssignableUsers();
        fetchCurrentUser();
    }, []);

    // Defer form field population until modal is open and Form is rendered
    useEffect(() => {
        if (isModalOpen && editingProject) {
            form.setFieldsValue({
                ...editingProject,
                startDate: editingProject.startDate ? dayjs(editingProject.startDate) : undefined,
                endDate: editingProject.endDate ? dayjs(editingProject.endDate) : undefined,
            });
        } else if (isModalOpen && !editingProject) {
            form.resetFields();
            form.setFieldsValue({
                code: generateProjectId("PRJ"),
            });
        }
    }, [isModalOpen, editingProject, form]);

    const fetchProjects = async () => {
        setLoading(true);
        const result = await apiClient.getProjects();
        if (result.data) {
            setProjects((result.data as any).projects);
        }
        setLoading(false);
    };

    const fetchClients = async () => {
        const result = await apiClient.getClients();
        if (result.data) {
            setClients((result.data as any).clients);
        }
    };

    const fetchManagers = async () => {
        const result = await apiClient.getAssignableUsers('PROJECT_MANAGER');
        if (result.data) {
            setManagers((result.data as any).users);
        }
    };

    const fetchAssignableUsers = async () => {
        const result = await apiClient.getAssignableUsers('PROJECT_MANAGER,SUPER_ADMIN,ORG_ADMIN,SALES_MANAGER,PROJECT_COORDINATOR');
        if (result.data) {
            setAssignableUsers((result.data as any).users);
        }
    };

    const fetchCurrentUser = async () => {
        const result = await apiClient.getCurrentUser();
        if (result.data) {
            setCurrentUser((result.data as any).user);
        }
    };


    const handleSave = async (values: any) => {
        const payload = {
            ...values,
            startDate: values.startDate?.toISOString(),
            endDate: values.endDate?.toISOString(),
        };

        if (editingProject) {
            const result = await apiClient.updateProject(editingProject.id, payload);
            if (result.error) {
                message.error(result.error);
            } else {
                message.success("Project updated");
                fetchProjects();
                setIsModalOpen(false);
            }
        } else {
            const result = await apiClient.createProject(payload);
            if (result.error) {
                message.error(result.error);
            } else {
                message.success("Project created");
                fetchProjects();
                setIsModalOpen(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        modal.confirm({
            title: "Delete Project",
            content: "Are you sure? This will delete all tasks associated with this project.",
            onOk: async () => {
                const result = await apiClient.deleteProject(id);
                if (result.error) {
                    message.error(result.error);
                } else {
                    message.success("Project deleted");
                    fetchProjects();
                }
            }
        });
    };

    const handleAssign = async (values: any) => {
        const result = await apiClient.assignProject(activeProject.id, values.assignedToId);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success("Project assigned");
            fetchProjects();
            assignForm.resetFields();
        }
    };

    const handleStart = async (values: any) => {
        const result = await apiClient.startProject(activeProject.id, values.taskTitle, values.assigneeId);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success("Project started and task created");
            fetchProjects();
            startForm.resetFields();
        }
    };

    const handleCancel = async (values: any) => {
        const result = await apiClient.cancelProject(activeProject.id, values.cancellationReason);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success("Project cancelled");
            fetchProjects();
            cancelForm.resetFields();
        }
    };

    const handleClose = async (values: any) => {
        const result = await apiClient.closeProject(activeProject.id, values.completionNote);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success("Project closed");
            fetchProjects();
            closeForm.resetFields();
        }
    };

    const handleRestore = async (record: any) => {
        modal.confirm({
            title: "Restore Project",
            content: `Are you sure you want to restore "${record.name}" back to Planning?`,
            onOk: async () => {
                const result = await apiClient.restoreProject(record.id);
                if (result.error) {
                    message.error(result.error);
                } else {
                    message.success("Project restored");
                    fetchProjects();
                }
            }
        });
    };


    const handleEmailSearch = async (value: string) => {
        setEmailSearch(value);
        if (value.length < 2) {
            setUserSuggestions([]);
            return;
        }

        const result = await apiClient.searchUsers(value, activeProject?.id);
        if (result.data) {
            const users = (result.data as any).users || [];
            setUserSuggestions(users.map((u: any) => ({
                label: `${u.name || u.email} (${u.email})`,
                value: u.id,
                user: u
            })));
        }
    };

    const handleSendInvite = async () => {
        if (!selectedInviteeId) {
            message.error('Please select a user');
            return;
        }

        setInviteLoading(true);
        const result = await apiClient.sendProjectInvitation(activeProject.id, {
            inviteeId: selectedInviteeId,
            message: inviteMessage || undefined
        });

        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Invitation sent');
            setEmailSearch('');
            setSelectedInviteeId(null);
            setInviteMessage('');
            setUserSuggestions([]);

            // Refresh invitations list
            const refreshResult = await apiClient.getProjectInvitations(activeProject.id);
            if (refreshResult.data) {
                setProjectInvitations((refreshResult.data as any).invitations || []);
            }
        }
        setInviteLoading(false);
    };

    const handleDeleteInvite = async (inviteId: string) => {
        const result = await apiClient.deleteProjectInvitation(activeProject.id, inviteId);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Invitation deleted');
            setProjectInvitations(prev => prev.filter(i => i.id !== inviteId));
        }
    };

    const handleResendInvite = async (inviteId: string) => {
        const result = await apiClient.resendProjectInvitation(activeProject.id, inviteId);
        if (result.error) {
            message.error(result.error);
        } else {
            message.success('Invitation resent');
            // Refresh invitations list
            const refreshResult = await apiClient.getProjectInvitations(activeProject.id);
            if (refreshResult.data) {
                setProjectInvitations((refreshResult.data as any).invitations || []);
            }
        }
    };

    const openModal = async (project?: any) => {
        setEditingProject(project);
        setEditModalTab('details');
        setActiveProject(project);

        if (project) {
            // Fetch invitations if editing
            const invResult = await apiClient.getProjectInvitations(project.id);
            if (invResult.data) {
                setProjectInvitations((invResult.data as any).invitations || []);
            }
        } else {
            setProjectInvitations([]);
        }
        setIsModalOpen(true);
    };

    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const projectName = e.target.value;
        if (projectName && !editingProject) {
            // Auto-update Project ID based on project name in create mode
            form.setFieldsValue({
                code: generateProjectId(projectName),
            });
        }
    };

    const handleProjectStatusChange = async (projectId: string, newStatus: string): Promise<boolean> => {
        try {
            // Find the current project
            const currentProject = projects.find((p) => p.id === projectId);
            if (!currentProject) throw new Error("Project not found");

            // Update project with new status - only send fields the backend expects
            const result = await apiClient.updateProject(projectId, {
                name: currentProject.name,
                code: currentProject.code,
                description: currentProject.description,
                clientId: currentProject.clientId,
                managerId: currentProject.managerId,
                status: newStatus,
                startDate: currentProject.startDate,
                endDate: currentProject.endDate,
            });

            if (result.data) {
                setProjects((prev) =>
                    prev.map((p) =>
                        p.id === projectId ? { ...p, status: newStatus } : p
                    )
                );
                modal.success({
                    title: "Status Updated",
                    content: `Project status changed to ${newStatus}`,
                });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Status update failed:", e);
            modal.error({ title: "Update failed", content: String(e) });
            return false;
        }
    };

    const taskStatusColors: Record<string, string> = {
        TODO: "default",
        IN_PROGRESS: "orange",
        DONE: "green",
        COMPLETED: "green",
        BLOCKED: "red",
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: any) => (
                <div
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => openModal(record)}
                >
                    <div className="font-medium text-blue-500 underline">{text}</div>
                    <div className="text-xs text-gray-500">{record.code}</div>
                </div>
            )
        },
        {
            title: "Client",
            dataIndex: ["client", "name"],
            key: "client",
            render: (text: string) => text || "-"
        },
        {
            title: "Manager",
            dataIndex: ["manager", "name"],
            key: "manager",
            render: (text: string) => text || "-"
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const colors: Record<string, string> = {
                    PLANNING: "blue",
                    IN_PROGRESS: "orange",
                    COMPLETED: "green",
                    ON_HOLD: "default",
                    CANCELLED: "red",
                };
                return <Tag color={colors[status]}>{status.replace("_", " ")}</Tag>;
            },
        },
        {
            title: "Dates",
            key: "dates",
            render: (_: any, record: any) => (
                <div className="text-xs">
                    <div>Target Start: {record.startDate ? new Date(record.startDate).toLocaleDateString() : "-"}</div>
                    <div>Target End: {record.endDate ? new Date(record.endDate).toLocaleDateString() : "-"}</div>
                </div>
            )
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Projects</h1>
                <Space>
                    <Segmented
                        value={viewMode}
                        onChange={(v: string | number) => {
                            const newMode = v as "table" | "kanban";
                            setViewMode(newMode);
                            localStorage.setItem("bt_view_projects", newMode);
                        }}
                        options={[
                            { value: "table", icon: <UnorderedListOutlined /> },
                            { value: "kanban", icon: <AppstoreOutlined /> },
                        ]}
                    />
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={() => {
                            downloadExcel(
                                projects.map((p: any) => ({
                                    Name: p.name,
                                    "Project ID": p.code || "",
                                    Client: p.client?.name || "",
                                    Manager: p.manager?.name || "",
                                    Status: p.status?.replace("_", " ") || "",
                                    "Target Start Date": p.startDate ? new Date(p.startDate).toLocaleDateString() : "",
                                    "Target End Date": p.endDate ? new Date(p.endDate).toLocaleDateString() : "",
                                    Description: p.description || "",
                                })),
                                undefined,
                                "projects"
                            );
                        }}
                    >
                        Download Excel
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                        New Project
                    </Button>
                </Space>
            </div>

            {viewMode === "kanban" ? (
                <Card>
                    <KanbanBoardBase
                        columns={PROJECT_KANBAN_CONFIG.columns as KanbanColumn[]}
                        initialCards={projects.map((p) => ({
                            id: p.id,
                            title: p.name || p.code || p.id,
                            status: p.status,
                            tags: [
                                p.client?.name,
                                p.manager?.name,
                                p.startDate ? new Date(p.startDate).toLocaleDateString() : null,
                            ].filter(Boolean) as string[],
                        })) as KanbanCard[]}
                        onCardMove={handleProjectStatusChange}
                        onCardClick={(card) => {
                            const project = projects.find((p) => p.id === card.id);
                            if (project) openModal(project);
                        }}
                        isLoading={loading}
                        emptyColumnMessage="No projects"
                    />
                </Card>
            ) : (
                <Card>
                    <Table
                        columns={columns}
                        dataSource={projects}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            )}

            {/* Edit / New Project Modal with Tabs */}
            <Modal
                title={editingProject ? "Edit Project" : "New Project"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={900}
            >
                {!editingProject ? (
                    // Create mode - just show the form
                    <Form form={form} layout="vertical" onFinish={handleSave}>
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
                                <Input onChange={handleProjectNameChange} />
                            </Form.Item>
                            <Form.Item
                              name="code"
                              label="Project ID"
                              tooltip="Auto-generated based on project name"
                            >
                                <Input
                                  placeholder="Auto-generated"
                                  disabled={!!editingProject}
                                  className={editingProject ? "bg-gray-50" : ""}
                                />
                            </Form.Item>
                        </div>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item name="clientId" label="Client">
                                <Select
                                    showSearch
                                    optionFilterProp="label"
                                    options={clients.map(c => ({ value: c.id, label: c.name }))}
                                />
                            </Form.Item>
                            <Form.Item name="managerId" label="Project Manager">
                                <Select
                                    showSearch
                                    optionFilterProp="label"
                                    options={managers.map(u => ({ value: u.id, label: u.name || u.email }))}
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
                                        { value: "COMPLETED", label: "Completed" },
                                        { value: "CANCELLED", label: "Cancelled" },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item name="startDate" label="Target Start Date">
                                <DatePicker className="w-full" />
                            </Form.Item>
                            <Form.Item name="endDate" label="Target End Date">
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">Create</Button>
                        </div>
                    </Form>
                ) : (
                    // Edit mode - show tabs
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
                                                <Input onChange={handleProjectNameChange} />
                                            </Form.Item>
                                            <Form.Item
                                              name="code"
                                              label="Project ID"
                                              tooltip="Project ID cannot be changed after creation"
                                            >
                                                <Input
                                                  placeholder="Auto-generated"
                                                  disabled={true}
                                                  className="bg-gray-50"
                                                />
                                            </Form.Item>
                                        </div>
                                        <Form.Item name="description" label="Description">
                                            <Input.TextArea rows={3} />
                                        </Form.Item>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item name="clientId" label="Client">
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    options={clients.map(c => ({ value: c.id, label: c.name }))}
                                                />
                                            </Form.Item>
                                            <Form.Item name="managerId" label="Project Manager">
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    options={managers.map(u => ({ value: u.id, label: u.name || u.email }))}
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
                                                <DatePicker className="w-full" />
                                            </Form.Item>
                                            <Form.Item name="endDate" label="Target End Date">
                                                <DatePicker className="w-full" />
                                            </Form.Item>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                            <Button type="primary" htmlType="submit">Save</Button>
                                        </div>
                                    </Form>
                                )
                            },
                            {
                                key: "files",
                                label: "Files",
                                children: (
                                    <div className="space-y-4 mt-4">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                                            <InboxOutlined style={{ fontSize: 40, marginBottom: 8 }} />
                                            <div className="text-base font-medium">File uploads coming soon</div>
                                            <div className="text-sm mt-1">This area will allow you to upload and manage files for this project.</div>
                                        </div>
                                        <div className="text-gray-400 text-sm text-center">No files uploaded yet.</div>
                                    </div>
                                )
                            },
                            ...((['PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN'].includes(currentUser?.role?.name)) ? [{
                                key: "invitations",
                                label: "Team",
                                children: (
                                    <div className="space-y-6 mt-4">
                                        {/* Send New Invitation Section */}
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <h3 className="font-semibold text-gray-900 mb-3">Send New Invitation</h3>
                                            <div className="space-y-3">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">Search Users</label>
                                                        <AutoComplete
                                                            value={emailSearch}
                                                            options={userSuggestions}
                                                            onSearch={handleEmailSearch}
                                                            onChange={(value: string) => {
                                                                setEmailSearch(value);
                                                                const selected = userSuggestions.find(s => s.value === value);
                                                                setSelectedInviteeId(selected ? value : null);
                                                            }}
                                                            placeholder="Start typing email or name..."
                                                            notFoundContent={emailSearch.length < 2 ? "Type at least 2 characters" : "No users found"}
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
                                                    block
                                                >
                                                    Send Invitation
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Sent Invitations Section */}
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3">Sent Invitations</h3>
                                            {projectInvitations.length === 0 ? (
                                                <div className="text-center text-gray-500 py-6">
                                                    No invitations sent yet
                                                </div>
                                            ) : (
                                                <Table
                                                    columns={[
                                                        {
                                                            title: "User",
                                                            key: "user",
                                                            render: (_: any, record: any) => (
                                                                <div>
                                                                    <div className="font-medium">{record.invitee?.name || record.invitee?.email}</div>
                                                                    <div className="text-xs text-gray-500">{record.invitee?.email}</div>
                                                                </div>
                                                            )
                                                        },
                                                        {
                                                            title: "Status",
                                                            dataIndex: "status",
                                                            key: "status",
                                                            render: (status: string) => {
                                                                const colors: Record<string, string> = {
                                                                    PENDING: "orange",
                                                                    ACCEPTED: "green",
                                                                    DECLINED: "red"
                                                                };
                                                                return <Tag color={colors[status]}>{status}</Tag>;
                                                            }
                                                        },
                                                        {
                                                            title: "Sent",
                                                            dataIndex: "createdAt",
                                                            key: "createdAt",
                                                            render: (date: string) => new Date(date).toLocaleDateString()
                                                        },
                                                        {
                                                            title: "Actions",
                                                            key: "actions",
                                                            render: (_: any, record: any) => (
                                                                <Space>
                                                                    {record.status === 'PENDING' && (
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
                                                            )
                                                        }
                                                    ]}
                                                    dataSource={projectInvitations}
                                                    rowKey="id"
                                                    pagination={false}
                                                    size="small"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            }] : []),
                            {
                                key: "actions",
                                label: "Actions",
                                children: (
                                    <div className="space-y-4 mt-4">
                                        {/* Assign */}
                                        <div className="border rounded-lg p-4">
                                            <h3 className="font-semibold text-gray-900 mb-3">Assign Project</h3>
                                            <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
                                                <Form.Item name="assignedToId" label="Assign To" rules={[{ required: true, message: 'Please select a user' }]}>
                                                    <Select
                                                        showSearch
                                                        optionFilterProp="label"
                                                        options={assignableUsers.map(u => ({ value: u.id, label: u.name || u.email }))}
                                                    />
                                                </Form.Item>
                                                <Button type="primary" htmlType="submit" block>Assign</Button>
                                            </Form>
                                        </div>

                                        {/* Project Actions */}
                                        <div className="border rounded-lg p-4 space-y-3">
                                            <h3 className="font-semibold text-gray-900">Project Status Actions</h3>

                                            {editingProject?.status !== 'CANCELLED' && editingProject?.status !== 'COMPLETED' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Start Project</label>
                                                    <Form form={startForm} layout="vertical" onFinish={handleStart}>
                                                        <Form.Item name="taskTitle" label="First Task Title" rules={[{ required: true }]}>
                                                            <Input />
                                                        </Form.Item>
                                                        <Form.Item name="assigneeId" label="Assign Task To" rules={[{ required: true, message: 'Please select an assignee' }]}>
                                                            <Select
                                                                showSearch
                                                                optionFilterProp="label"
                                                                options={assignableUsers.map(u => ({ value: u.id, label: u.name || u.email }))}
                                                            />
                                                        </Form.Item>
                                                        <Button type="primary" htmlType="submit" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} block>Start Project</Button>
                                                    </Form>
                                                </div>
                                            )}

                                            {editingProject?.status !== 'CANCELLED' && editingProject?.status !== 'COMPLETED' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Cancel Project</label>
                                                    <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
                                                        <Form.Item name="cancellationReason" label="Reason for Cancellation" rules={[{ required: true, message: 'Please provide a reason' }]}>
                                                            <Input.TextArea rows={2} />
                                                        </Form.Item>
                                                        <Button danger htmlType="submit" block>Cancel Project</Button>
                                                    </Form>
                                                </div>
                                            )}

                                            {editingProject?.status !== 'CANCELLED' && editingProject?.status !== 'COMPLETED' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Close Project</label>
                                                    <Form form={closeForm} layout="vertical" onFinish={handleClose}>
                                                        <Form.Item name="completionNote" label="Completion Note (optional)">
                                                            <Input.TextArea rows={2} />
                                                        </Form.Item>
                                                        <Button type="primary" htmlType="submit" block>Close Project</Button>
                                                    </Form>
                                                </div>
                                            )}

                                            {editingProject?.status === 'CANCELLED' && (
                                                <Button icon={<UndoOutlined />} onClick={() => handleRestore(editingProject)} block>
                                                    Restore Project
                                                </Button>
                                            )}

                                            {editingProject?.cancellationReason && (
                                                <div className="bg-gray-50 p-3 rounded-lg border border-red-200">
                                                    <div className="text-sm font-semibold text-gray-900 mb-1">Cancellation Reason:</div>
                                                    <div className="text-sm text-gray-700">{editingProject.cancellationReason}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </Modal>

        </div>
    );
}