"use client";

import { useEffect, useState } from "react";
import { Table, Button, Card, Tag, Space, Modal, Form, Input, Select, DatePicker, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import dayjs from "dayjs";

export default function TasksPage() {
    const { message } = App.useApp();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false); // Initially false until we pick a project? For now load all if possible or require project selection. 
    // Wait, backend 'getTasks' REQUIRES projectId. 
    // So we should probably fetch projects first and let user select one, OR fetch all tasks (but backend doesn't support that yet).
    // Let's modify the Plan: The Tasks page should ideally show "My Tasks" or allow filtering by project.
    // For now I'll implement it to fetch ALL tasks if I modify the backend, or just pick the first project.
    // Actually, standard task managers show a list of tasks.
    // I'll update the backend route to make projectId optional for "listing my tasks", or just force project selection.
    // Let's force project selection for now to keep it simple and performant.

    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [projectMembers, setProjectMembers] = useState<any[]>([]); // Assignments
    const [form] = Form.useForm();

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchTasks(selectedProjectId);
            // fetchProjectMembers(selectedProjectId); // For now just use all users for simplicity
            fetchUsers();
        } else {
            setTasks([]);
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        const result = await apiClient.getProjects();
        if (result.data) {
            const projs = (result.data as any).projects;
            setProjects(projs);
            if (projs.length > 0 && !selectedProjectId) {
                setSelectedProjectId(projs[0].id);
            }
        }
    };

    const fetchTasks = async (projectId: string) => {
        setLoading(true);
        const result = await apiClient.getTasks({ projectId });
        if (result.data) {
            setTasks((result.data as any).tasks);
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        const result = await apiClient.getAssignableUsers('SUBCONTRACTOR');
        if (result.data) {
            setProjectMembers((result.data as any).users);
        }
    };


    const handleSave = async (values: any) => {
        if (!selectedProjectId) {
            message.error("No project selected");
            return;
        }

        const payload = {
            ...values,
            projectId: selectedProjectId,
            dueDate: values.dueDate?.toISOString(),
        };

        if (editingTask) {
            const result = await apiClient.updateTask(editingTask.id, payload);
            if (result.error) {
                message.error(result.error);
            } else {
                message.success("Task updated");
                fetchTasks(selectedProjectId);
                setIsModalOpen(false);
            }
        } else {
            const result = await apiClient.createTask(payload);
            if (result.error) {
                message.error(result.error);
            } else {
                message.success("Task created");
                fetchTasks(selectedProjectId);
                setIsModalOpen(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: "Delete Task",
            content: "Are you sure?",
            onOk: async () => {
                const result = await apiClient.deleteTask(id);
                if (result.error) {
                    message.error(result.error);
                } else {
                    message.success("Task deleted");
                    if (selectedProjectId) fetchTasks(selectedProjectId);
                }
            }
        });
    };

    const openModal = (task?: any) => {
        setEditingTask(task);
        if (task) {
            form.setFieldsValue({
                ...task,
                dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
            });
        } else {
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text: string) => <span className="font-medium">{text}</span>
        },
        {
            title: "Assignee",
            dataIndex: ["assignee", "name"],
            key: "assignee",
            render: (text: string) => text || "Unassigned"
        },
        {
            title: "Priority",
            dataIndex: "priority",
            key: "priority",
            render: (priority: string) => {
                const colors: Record<string, string> = {
                    LOW: "blue",
                    MEDIUM: "orange",
                    HIGH: "volcano",
                    URGENT: "red",
                };
                return <Tag color={colors[priority]}>{priority}</Tag>;
            }
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                const colors: Record<string, string> = {
                    TODO: "default",
                    IN_PROGRESS: "processing",
                    REVIEW: "purple",
                    DONE: "success",
                };
                return <Tag color={colors[status]}>{status.replace("_", " ")}</Tag>;
            },
        },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            key: "dueDate",
            render: (date: string) => date ? new Date(date).toLocaleDateString() : "-"
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
                <h1 className="text-2xl font-bold">Tasks</h1>
                <div className="flex gap-4">
                    <Select
                        className="w-64"
                        placeholder="Select Project"
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        options={projects.map(p => ({ value: p.id, label: p.name }))}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()} disabled={!selectedProjectId}>
                        New Task
                    </Button>
                </div>
            </div>

            <Card>
                {!selectedProjectId ? (
                    <div className="text-center py-10 text-gray-500">Please select a project to view tasks</div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={tasks}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                )}
            </Card>

            <Modal
                title={editingTask ? "Edit Task" : "New Task"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="assigneeId" label="Assignee">
                            <Select
                                showSearch
                                optionFilterProp="label"
                                options={projectMembers.map(u => ({ value: u.id, label: u.name || u.email }))}
                            />
                        </Form.Item>
                        <Form.Item name="dueDate" label="Due Date">
                            <DatePicker className="w-full" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="status" label="Status" initialValue="TODO">
                            <Select
                                options={[
                                    { value: "TODO", label: "To Do" },
                                    { value: "IN_PROGRESS", label: "In Progress" },
                                    { value: "REVIEW", label: "Review" },
                                    { value: "DONE", label: "Done" },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="priority" label="Priority" initialValue="MEDIUM">
                            <Select
                                options={[
                                    { value: "LOW", label: "Low" },
                                    { value: "MEDIUM", label: "Medium" },
                                    { value: "HIGH", label: "High" },
                                    { value: "URGENT", label: "Urgent" },
                                ]}
                            />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Save</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
