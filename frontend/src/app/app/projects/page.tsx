"use client";

import { useEffect, useState } from "react";
import { Table, Button, Card, Tag, Space, Modal, Form, Input, Select, DatePicker, App, Upload, List } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UserAddOutlined, PlayCircleOutlined, CloseCircleOutlined, CheckCircleOutlined, UndoOutlined, FolderOpenOutlined, InboxOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { downloadExcel } from "@/lib/downloadExcel";
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

    // Action modal states
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [startModalOpen, setStartModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [activeProject, setActiveProject] = useState<any>(null);
    const [assignForm] = Form.useForm();
    const [startForm] = Form.useForm();
    const [cancelForm] = Form.useForm();
    const [closeForm] = Form.useForm();
    const [detailsProject, setDetailsProject] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Project Files modal states
    const [filesModalOpen, setFilesModalOpen] = useState(false);
    const [filesProject, setFilesProject] = useState<any>(null);

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchManagers();
        fetchAssignableUsers();
        fetchCurrentUser();
    }, []);

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
        const result = await apiClient.getAssignableUsers('PROJECT_MANAGER,SUPER_ADMIN,ORG_ADMIN');
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

    const openDetailsModal = async (record: any) => {
        setDetailsModalOpen(true);
        setDetailsLoading(true);
        const result = await apiClient.getProject(record.id);
        if (result.data) {
            setDetailsProject((result.data as any).project);
        }
        setDetailsLoading(false);
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
            setAssignModalOpen(false);
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
            setStartModalOpen(false);
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
            setCancelModalOpen(false);
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
            setCloseModalOpen(false);
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

    const openModal = (project?: any) => {
        setEditingProject(project);
        if (project) {
            form.setFieldsValue({
                ...project,
                startDate: project.startDate ? dayjs(project.startDate) : undefined,
                endDate: project.endDate ? dayjs(project.endDate) : undefined,
            });
        } else {
            form.resetFields();
            // Auto-populate Project ID in create mode with a placeholder
            form.setFieldsValue({
                code: generateProjectId("PRJ"),
            });
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
                    onClick={() => openDetailsModal(record)}
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
                <Space wrap>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)} />
                    {record.cancellationReason && (
                        <Button
                            title="View Cancellation Reason"
                            onClick={() => { setActiveProject(record); setDetailsModalOpen(true); }}
                        >
                            Details
                        </Button>
                    )}
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
                    <Button
                        icon={<FolderOpenOutlined />}
                        title="Project Files"
                        onClick={() => { setFilesProject(record); setFilesModalOpen(true); }}
                    />
                    <Button
                        icon={<UserAddOutlined />}
                        title="Assign"
                        onClick={() => { setActiveProject(record); assignForm.resetFields(); setAssignModalOpen(true); }}
                    />
                    {record.status !== 'CANCELLED' && record.status !== 'COMPLETED' && (
                        <Button
                            icon={<PlayCircleOutlined />}
                            title="Start"
                            style={{ color: '#52c41a', borderColor: '#52c41a' }}
                            onClick={() => {
                                setActiveProject(record);
                                startForm.setFieldsValue({ taskTitle: 'CRM / Lead', assigneeId: currentUser?.id });
                                setStartModalOpen(true);
                            }}
                        />
                    )}
                    {record.status !== 'CANCELLED' && record.status !== 'COMPLETED' && (
                        <Button
                            icon={<CloseCircleOutlined />}
                            title="Cancel"
                            style={{ color: '#ff4d4f', borderColor: '#ff4d4f' }}
                            onClick={() => { setActiveProject(record); cancelForm.resetFields(); setCancelModalOpen(true); }}
                        />
                    )}
                    {record.status !== 'CANCELLED' && record.status !== 'COMPLETED' && (
                        <Button
                            icon={<CheckCircleOutlined />}
                            title="Close"
                            style={{ color: '#1677ff', borderColor: '#1677ff' }}
                            onClick={() => { setActiveProject(record); closeForm.resetFields(); setCloseModalOpen(true); }}
                        />
                    )}
                    {record.status === 'CANCELLED' && (
                        <Button
                            icon={<UndoOutlined />}
                            title="Restore"
                            onClick={() => handleRestore(record)}
                        />
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Projects</h1>
                <Space>
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

            <Card>
                <Table
                    columns={columns}
                    dataSource={projects}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

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
                                <div className="text-xs text-gray-500 mb-1">Project Code</div>
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
                                <Tag color={{
                                    PLANNING: "blue",
                                    IN_PROGRESS: "orange",
                                    COMPLETED: "green",
                                    ON_HOLD: "default",
                                    CANCELLED: "red",
                                }[detailsProject.status as string]}>
                                    {detailsProject.status?.replace("_", " ")}
                                </Tag>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Description</div>
                                <div className="font-medium">{detailsProject.description || "-"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Target Start Date</div>
                                <div className="font-medium">{detailsProject.startDate ? new Date(detailsProject.startDate).toLocaleDateString() : "-"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Target End Date</div>
                                <div className="font-medium">{detailsProject.endDate ? new Date(detailsProject.endDate).toLocaleDateString() : "-"}</div>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold mb-2">Tasks</div>
                            {detailsProject.tasks && detailsProject.tasks.length > 0 ? (
                                <List
                                    bordered
                                    dataSource={detailsProject.tasks}
                                    renderItem={(task: any) => (
                                        <List.Item>
                                            <div className="flex justify-between w-full items-center">
                                                <span>{task.title}</span>
                                                <Tag color={taskStatusColors[task.status] || "default"}>
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

            {/* Project Files Modal */}
            <Modal
                title={`Project Files — ${filesProject?.name || ""}`}
                open={filesModalOpen}
                onCancel={() => { setFilesModalOpen(false); setFilesProject(null); }}
                footer={null}
                width={600}
            >
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400">
                        <InboxOutlined style={{ fontSize: 40, marginBottom: 8 }} />
                        <div className="text-base font-medium">File uploads coming soon</div>
                        <div className="text-sm mt-1">This area will allow you to upload and manage files for this project.</div>
                    </div>
                    <div className="text-gray-400 text-sm text-center">No files uploaded yet.</div>
                </div>
            </Modal>

            {/* Edit / New Project Modal */}
            <Modal
                title={editingProject ? "Edit Project" : "New Project"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
                            <Input onChange={handleProjectNameChange} />
                        </Form.Item>
                        <Form.Item
                          name="code"
                          label="Project ID"
                          tooltip={editingProject ? "Project ID cannot be changed after creation" : "Auto-generated based on project name"}
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
                        <Button type="primary" htmlType="submit">Save</Button>
                    </div>
                </Form>
            </Modal>

            {/* Assign Modal */}
            <Modal
                title="Assign Project"
                open={assignModalOpen}
                onCancel={() => setAssignModalOpen(false)}
                footer={null}
            >
                <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
                    <Form.Item name="assignedToId" label="Assign To" rules={[{ required: true, message: 'Please select a user' }]}>
                        <Select
                            showSearch
                            optionFilterProp="label"
                            options={assignableUsers.map(u => ({ value: u.id, label: u.name || u.email }))}
                        />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Assign</Button>
                    </div>
                </Form>
            </Modal>

            {/* Start Modal */}
            <Modal
                title="Start Project"
                open={startModalOpen}
                onCancel={() => setStartModalOpen(false)}
                footer={null}
            >
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
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setStartModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Start Project</Button>
                    </div>
                </Form>
            </Modal>

            {/* Cancel Modal */}
            <Modal
                title="Cancel Project"
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                footer={null}
            >
                <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
                    <Form.Item name="cancellationReason" label="Reason for Cancellation" rules={[{ required: true, message: 'Please provide a reason' }]}>
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setCancelModalOpen(false)}>Back</Button>
                        <Button danger htmlType="submit">Cancel Project</Button>
                    </div>
                </Form>
            </Modal>

            {/* Close Modal */}
            <Modal
                title="Close Project"
                open={closeModalOpen}
                onCancel={() => setCloseModalOpen(false)}
                footer={null}
            >
                <Form form={closeForm} layout="vertical" onFinish={handleClose}>
                    <p className="mb-4 text-gray-600">Are you sure you want to close this project?</p>
                    <Form.Item name="completionNote" label="Completion Note (optional)">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setCloseModalOpen(false)}>Back</Button>
                        <Button type="primary" htmlType="submit">Close Project</Button>
                    </div>
                </Form>
            </Modal>

            {/* Project Details Modal */}
            <Modal
                title="Project Details"
                open={detailsModalOpen}
                onCancel={() => setDetailsModalOpen(false)}
                footer={null}
                width={600}
            >
                {activeProject && (
                    <div className="space-y-4">
                        <div>
                            <label className="font-semibold text-gray-700">Project Name</label>
                            <p className="text-gray-600">{activeProject.name}</p>
                        </div>
                        <div>
                            <label className="font-semibold text-gray-700">Status</label>
                            <p className="mt-1">
                                <Tag color={activeProject.status === 'CANCELLED' ? 'red' : activeProject.status === 'COMPLETED' ? 'green' : 'orange'}>
                                    {activeProject.status.replace(/_/g, ' ')}
                                </Tag>
                            </p>
                        </div>
                        {activeProject.cancellationReason && (
                            <div>
                                <label className="font-semibold text-gray-700">Reason for Cancellation</label>
                                <p className="text-gray-600 whitespace-pre-wrap">{activeProject.cancellationReason}</p>
                            </div>
                        )}
                        {activeProject.completionNote && (
                            <div>
                                <label className="font-semibold text-gray-700">Completion Note</label>
                                <p className="text-gray-600 whitespace-pre-wrap">{activeProject.completionNote}</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-6">
                            <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}