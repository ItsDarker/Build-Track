"use client";

import { useEffect, useState } from "react";
import { Table, Button, Card, Tag, Space, Modal, Form, Input, Select, DatePicker, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { downloadExcel } from "@/lib/downloadExcel";
import dayjs from "dayjs";

export default function ProjectsPage() {
    const { message, modal } = App.useApp();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchManagers();
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
        const result = await apiClient.getAssignableUsers('PM,ADMIN');
        if (result.data) {
            setManagers((result.data as any).users);
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
        }
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: any) => (
                <div>
                    <div className="font-medium">{text}</div>
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
                    <div>Start: {record.startDate ? new Date(record.startDate).toLocaleDateString() : "-"}</div>
                    <div>End: {record.endDate ? new Date(record.endDate).toLocaleDateString() : "-"}</div>
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
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={() => {
                            downloadExcel(
                                projects.map((p: any) => ({
                                    Name: p.name,
                                    Code: p.code || "",
                                    Client: p.client?.name || "",
                                    Manager: p.manager?.name || "",
                                    Status: p.status?.replace("_", " ") || "",
                                    "Start Date": p.startDate ? new Date(p.startDate).toLocaleDateString() : "",
                                    "End Date": p.endDate ? new Date(p.endDate).toLocaleDateString() : "",
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
                            <Input />
                        </Form.Item>
                        <Form.Item name="code" label="Project Code">
                            <Input placeholder="e.g. PRJ-2024-01" />
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
                        <Form.Item name="startDate" label="Start Date">
                            <DatePicker className="w-full" />
                        </Form.Item>
                        <Form.Item name="endDate" label="End Date">
                            <DatePicker className="w-full" />
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
