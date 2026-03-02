"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Table,
    Button,
    Card,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Tag,
    Empty,
    App,
    Divider,
    Badge,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import { modules, getModuleBySlug, ModuleConfig } from "@/config/buildtrack.config";

interface LookupItem {
    id: string;
    moduleSlug: string;
    category: string;
    value: string;
    label: string;
    order: number;
    isActive: boolean;
}

function cleanLabel(raw: string): string {
    return raw.replace(/\s*\(.*?\)\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
}

function getFieldsWithDropdowns(moduleConfig: ModuleConfig): string[] {
    return moduleConfig.fields
        .map((f) => cleanLabel(f))
        .filter((label) => {
            const lower = label.toLowerCase();
            return (
                !["created at", "update at", "created by", "updated by", "optional", "mvp fields"].includes(lower) &&
                !lower.includes("id") &&
                !lower.includes("date") &&
                !lower.includes("notes") &&
                !lower.includes("description") &&
                !lower.includes("address") &&
                !lower.includes("attachment") &&
                !lower.includes("photo") &&
                !lower.includes("file") &&
                !lower.includes("link") &&
                !lower.includes("email") &&
                !lower.includes("phone") &&
                !lower.includes("summary") &&
                !lower.includes("reference") ||
                [
                    "assigned to", "assignee", "inspector", "operator", "technician",
                    "driver", "installer", "crew", "approver", "planner",
                    "manager", "coordinator", "owner", "rework assigned to"
                ].some(kw => lower.includes(kw))
            );
        });
}

export default function ModuleFieldsPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { message } = App.useApp();

    const moduleConfig = getModuleBySlug(slug);
    const [lookups, setLookups] = useState<LookupItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("");
    const [form] = Form.useForm();

    const fetchLookups = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/backend-api/lookups/all?moduleSlug=${slug}`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch lookups");
            const data = await res.json();
            setLookups(data.lookups || []);
        } catch {
            message.error("Error loading field options");
        } finally {
            setLoading(false);
        }
    }, [slug, message]);

    useEffect(() => {
        fetchLookups();
    }, [fetchLookups]);

    if (!moduleConfig) {
        return (
            <div className="p-8 text-center text-gray-500">Module not found: {slug}</div>
        );
    }

    const dropdownFields = getFieldsWithDropdowns(moduleConfig);

    // Group lookups by category
    const lookupsByCategory: Record<string, LookupItem[]> = {};
    lookups.forEach((l) => {
        if (!lookupsByCategory[l.category]) lookupsByCategory[l.category] = [];
        lookupsByCategory[l.category].push(l);
    });

    const handleOpenModal = (category: string, item?: LookupItem) => {
        setActiveCategory(category);
        if (item) {
            setEditingItem(item);
            form.setFieldsValue({ value: item.value, label: item.label, order: item.order });
        } else {
            setEditingItem(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        form.resetFields();
    };

    const handleSave = async (values: any) => {
        try {
            const url = editingItem
                ? `/backend-api/lookups/${editingItem.id}`
                : "/backend-api/lookups";
            const method = editingItem ? "PUT" : "POST";

            const body = editingItem
                ? { value: values.value, label: values.label || values.value, order: values.order ?? 0 }
                : { moduleSlug: slug, category: activeCategory, value: values.value, label: values.label || values.value, order: values.order ?? 0, isActive: true };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            message.success(editingItem ? "Option updated!" : "Option added!");
            handleCloseModal();
            fetchLookups();
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/backend-api/lookups/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to delete");
            message.success("Option deleted");
            fetchLookups();
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const optionColumns = (category: string) => [
        {
            title: "Label",
            dataIndex: "label",
            key: "label",
        },
        {
            title: "Value",
            dataIndex: "value",
            key: "value",
            render: (text: string) => <code className="text-xs bg-gray-100 px-1 rounded">{text}</code>,
        },
        {
            title: "Order",
            dataIndex: "order",
            key: "order",
            width: 80,
        },
        {
            title: "",
            key: "actions",
            width: 100,
            render: (_: any, record: LookupItem) => (
                <Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(category, record)}
                    />
                    <Popconfirm
                        title="Delete option?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    icon={<ArrowLeftOutlined />}
                    type="text"
                    onClick={() => router.push("/admin")}
                />
                <div>
                    <div className="flex items-center gap-2">
                        <SettingOutlined className="text-blue-500" />
                        <h1 className="text-2xl font-semibold mb-0">
                            {moduleConfig.name} — Field Options
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Configure the static dropdown options for each field in this module. These options appear for all users.
                    </p>
                </div>
            </div>

            <Divider />

            {/* Per-field cards */}
            {dropdownFields.length === 0 ? (
                <Empty description="No configurable dropdown fields found for this module." />
            ) : (
                dropdownFields.map((fieldLabel) => {
                    const items = lookupsByCategory[fieldLabel] || [];
                    return (
                        <Card
                            key={fieldLabel}
                            title={
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{fieldLabel}</span>
                                    <Badge count={items.length} style={{ backgroundColor: items.length > 0 ? "#1677ff" : "#d9d9d9" }} />
                                </div>
                            }
                            extra={
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleOpenModal(fieldLabel)}
                                >
                                    Add Option
                                </Button>
                            }
                            size="small"
                        >
                            {items.length === 0 ? (
                                <div className="text-gray-400 text-sm py-2 text-center">
                                    No static options configured. Users will see a text input. Click "Add Option" to configure.
                                </div>
                            ) : (
                                <Table
                                    columns={optionColumns(fieldLabel)}
                                    dataSource={items.sort((a, b) => a.order - b.order)}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                />
                            )}
                        </Card>
                    );
                })
            )}

            {/* Add / Edit Modal */}
            <Modal
                title={editingItem ? `Edit "${activeCategory}" Option` : `Add Option to "${activeCategory}"`}
                open={isModalOpen}
                onCancel={handleCloseModal}
                onOk={() => form.submit()}
                okText={editingItem ? "Update" : "Add"}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="label"
                        label="Display Label"
                        rules={[{ required: true, message: "Please enter a label" }]}
                    >
                        <Input placeholder="e.g. Delivery only" />
                    </Form.Item>
                    <Form.Item
                        name="value"
                        label="Internal Value"
                        tooltip="The value stored in the database when this option is selected. Can be the same as the label."
                        rules={[{ required: true, message: "Please enter a value" }]}
                    >
                        <Input placeholder="e.g. delivery_only" />
                    </Form.Item>
                    <Form.Item name="order" label="Sort Order" initialValue={0}>
                        <InputNumber min={0} className="w-full" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
