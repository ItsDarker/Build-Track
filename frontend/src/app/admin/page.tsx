"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  message,
  Skeleton,
  Typography,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { useAdminContext } from "./layout";

const { Text } = Typography;

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: string | null;
  isBlocked: boolean;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  blockedUsers: number;
  adminUsers: number;
  recentSignups: number;
}

export default function AdminDashboardPage() {
  const { notifications, markNotificationRead, clearAllNotifications } = useAdminContext();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResult, usersResult] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAdminUsers({ limit: 5 }),
      ]);

      if (statsResult.data) {
        setStats(statsResult.data as any);
      }

      if (usersResult.data) {
        setUsers((usersResult.data as any).users || []);
      }
    } catch (err) {
      message.error("Failed to load dashboard data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBlockUser = async (userId: string) => {
    const result = await apiClient.blockUser(userId, "Blocked by admin");
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("User blocked successfully");
      fetchData();
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const result = await apiClient.unblockUser(userId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("User unblocked successfully");
      fetchData();
    }
  };

  const userColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string | null) => name || "-",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "ADMIN" ? "purple" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: User) => (
        <Space>
          {record.emailVerified ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Verified
            </Tag>
          ) : (
            <Tag color="warning">Unverified</Tag>
          )}
          {record.isBlocked && (
            <Tag icon={<LockOutlined />} color="error">
              Blocked
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: User) => (
        <Space>
          {record.isBlocked ? (
            <Button
              size="small"
              icon={<UnlockOutlined />}
              onClick={() => handleUnblockUser(record.id)}
            >
              Unblock
            </Button>
          ) : (
            <Button
              size="small"
              danger
              icon={<LockOutlined />}
              onClick={() => handleBlockUser(record.id)}
              disabled={record.role === "ADMIN"}
            >
              Block
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Total Users"
                value={stats?.totalUsers || 0}
                prefix={<UserOutlined />}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Verified Users"
                value={stats?.verifiedUsers || 0}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Blocked Users"
                value={stats?.blockedUsers || 0}
                valueStyle={{ color: "#cf1322" }}
                prefix={<LockOutlined />}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title="Recent Signups (7d)"
                value={stats?.recentSignups || 0}
                valueStyle={{ color: "#1890ff" }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card
          title="Recent Notifications"
          className="mb-6"
          extra={
            <Space>
              <Button type="link" danger onClick={clearAllNotifications}>
                Clear
              </Button>
              <Link href="/admin/notifications">
                <Button type="link">View All</Button>
              </Link>
            </Space>
          }
        >
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={`py-4 px-2 flex items-start justify-between ${!item.read ? "bg-blue-50 rounded" : ""
                  }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag
                      color={
                        item.type === "auto_blocked"
                          ? "error"
                          : item.type === "new_user"
                            ? "success"
                            : "default"
                      }
                    >
                      {item.type.replace("_", " ").toUpperCase()}
                    </Tag>
                    <Text strong={!item.read}>{item.title}</Text>
                  </div>
                  <Text type="secondary" className="text-sm">
                    {item.message}
                  </Text>
                </div>
                {!item.read && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => markNotificationRead(item.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Users Table */}
      <Card
        title="Recent Users"
        extra={
          <Link href="/admin/users">
            <Button type="primary">View All Users</Button>
          </Link>
        }
      >
        <Table
          dataSource={users}
          columns={userColumns}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>
    </>
  );
}
