"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    Button,
    Card,
    Space,
    Tag,
    Typography,
    Divider,
} from "antd";
import {
    SettingOutlined,
    ArrowLeftOutlined,
    DatabaseOutlined,
} from "@ant-design/icons";
import { getAllModules } from "@/config/buildtrack.config";

const { Title, Paragraph } = Typography;

export default function AdminModulesPage() {
    const router = useRouter();
    const modules = getAllModules();

    const columns = [
        {
            title: "Module Name",
            dataIndex: "name",
            key: "name",
            render: (text: string) => <span className="text-base font-semibold">{text}</span>,
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
            render: (text: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{text}</code>,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "Access Roles",
            dataIndex: "accessRoles",
            key: "access",
            render: (roles: string[]) => (
                <Space size={[0, 4]} wrap>
                    {roles.map(role => (
                        <Tag key={role} color="blue" className="text-[10px] uppercase">{role}</Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "Fields",
            key: "fields",
            render: (_: any, record: any) => record.fields?.length || 0,
        },
        {
            title: "Actions",
            key: "actions",
            width: 150,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    icon={<SettingOutlined />}
                    onClick={() => router.push(`/admin/modules/${record.slug}/fields`)}
                >
                    Update Options
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    icon={<ArrowLeftOutlined />}
                    type="text"
                    onClick={() => router.push("/admin")}
                />
                <div>
                    <div className="flex items-center gap-2">
                        <DatabaseOutlined className="text-blue-500 text-2xl" />
                        <Title level={2} className="mb-0">All Modules</Title>
                    </div>
                    <Paragraph type="secondary" className="mb-0">
                        Manage field options and dropdown lists for all system modules. Changes apply instantly to app forms.
                    </Paragraph>
                </div>
            </div>

            <Divider />

            <Card>
                <Table
                    dataSource={modules}
                    columns={columns}
                    rowKey="slug"
                    pagination={false}
                />
            </Card>
        </div>
    );
}
