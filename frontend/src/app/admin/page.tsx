"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layout,
  Menu,
  theme,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Button,
  Space,
  Badge,
  Tag,
  message,
  Spin,
  Alert,
  Dropdown,
  List,
  Typography,
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";

const { Header, Content, Footer, Sider } = Layout;
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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const fetchData = useCallback(async () => {
    try {
      // Get current user
      const userResult = await apiClient.getCurrentUser();
      if (userResult.error || !userResult.data) {
        router.push("/login");
        return;
      }

      const user = (userResult.data as any).user;
      if (user.role !== "ADMIN") {
        message.error("Access denied. Admin privileges required.");
        router.push("/app");
        return;
      }

      setCurrentUser(user);

      // Fetch stats, users, and notifications in parallel
      const [statsResult, usersResult, notificationsResult] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAdminUsers({ limit: 5 }),
        apiClient.getAdminNotifications({ unreadOnly: false, limit: 10 }),
      ]);

      if (statsResult.data) {
        setStats((statsResult.data as any).stats);
      }

      if (usersResult.data) {
        setUsers((usersResult.data as any).users || []);
      }

      if (notificationsResult.data) {
        const notifs = (notificationsResult.data as any).notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load admin data");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push("/login");
  };

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

  const handleMarkNotificationRead = async (notificationId: string) => {
    await apiClient.markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await apiClient.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClearAllNotifications = async () => {
    const result = await apiClient.clearAllAdminNotifications();
    if (result.error) {
      message.error("Failed to clear notifications");
    } else {
      message.success("All notifications cleared");
      fetchData(); // Refetch data to update the UI
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Alert
          type="error"
          message="Error"
          description={error}
          action={
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          }
        />
      </div>
    );
  }

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
            <Tag icon={<CloseCircleOutlined />} color="warning">
              Unverified
            </Tag>
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

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Dashboard</Link>,
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: <Link href="/admin/users">Users</Link>,
    },
    {
      key: "pages",
      icon: <FileTextOutlined />,
      label: <Link href="/admin/pages">Manage Pages</Link>,
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const notificationMenu = {
    items: notifications.slice(0, 5).map((notif) => ({
      key: notif.id,
      label: (
        <div
          className={`py-2 ${!notif.read ? "font-semibold" : ""}`}
          onClick={() => handleMarkNotificationRead(notif.id)}
        >
          <Text strong={!notif.read}>{notif.title}</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {notif.message.substring(0, 50)}...
          </Text>
        </div>
      ),
    })),
    footer: (
      <div className="p-2 border-t">
        <Space>
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
          <Button type="link" size="small" danger onClick={handleClearAllNotifications}>
            Clear All
          </Button>
        </Space>
      </div>
    ),
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        width={250}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
          }}
        >
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M4 21V10.5M20 21V10.5" />
              </svg>
            </div>
            {!collapsed && <span className="text-xl font-bold text-white">Admin</span>}
          </Link>
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: "margin-left 0.2s" }}>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span className="text-lg font-semibold">BuildTrack Admin Panel</span>
          </div>
          <Space size="middle">
            <Dropdown menu={notificationMenu} trigger={["click"]} placement="bottomRight">
              <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>
            </Dropdown>
            <span className="text-gray-600">
              Welcome, {currentUser?.name || currentUser?.email}
            </span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            <Row gutter={16} className="mb-6">
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Verified Users"
                    value={stats?.verifiedUsers || 0}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Blocked Users"
                    value={stats?.blockedUsers || 0}
                    valueStyle={{ color: "#cf1322" }}
                    prefix={<LockOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Recent Signups (7d)"
                    value={stats?.recentSignups || 0}
                    valueStyle={{ color: "#1890ff" }}
                  />
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
                    <Button type="link" danger onClick={handleClearAllNotifications}>
                      Clear
                    </Button>
                    <Link href="/admin/notifications">
                      <Button type="link">View All</Button>
                    </Link>
                  </Space>
                }
              >
                <List
                  dataSource={notifications.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item
                      className={!item.read ? "bg-blue-50" : ""}
                      actions={[
                        !item.read && (
                          <Button
                            key="read"
                            type="link"
                            size="small"
                            onClick={() => handleMarkNotificationRead(item.id)}
                          >
                            Mark as read
                          </Button>
                        ),
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
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
                          </Space>
                        }
                        description={item.message}
                      />
                    </List.Item>
                  )}
                />
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
              />
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          BuildTrack Admin &copy;{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
