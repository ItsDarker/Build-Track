"use client";

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { Logo } from "@/components/ui-kit/Logo";
import {
  App,
  Layout,
  Menu,
  theme,
  Button,
  Space,
  Badge,
  Dropdown,
  message,
  Spin,
  Typography,
} from "antd";

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: {
    name: string;
    displayName: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface AdminContextType {
  currentUser: CurrentUser | null;
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within AdminLayout");
  }
  return context;
}

// Inner component that uses App context
function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const fetchNotifications = useCallback(async () => {
    const result = await apiClient.getAdminNotifications({ unreadOnly: false, limit: 10 });
    if (result.data) {
      const notifs = (result.data as any).notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await apiClient.getCurrentUser();
      if (result.error || !result.data) {
        router.push("/login");
        return;
      }

      const user = (result.data as any).user;
      // Allow SUPER_ADMIN and ORG_ADMIN to access admin panel
      const allowedRoles = ["SUPER_ADMIN", "ORG_ADMIN", "ADMIN"];
      if (!user.role?.name || !allowedRoles.includes(user.role.name)) {
        message.error("Access denied. Admin privileges required.");
        router.push("/app");
        return;
      }

      setCurrentUser(user);
      await fetchNotifications();
      setLoading(false);
    };

    checkAuth();
  }, [router, fetchNotifications, message]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push("/login");
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
      await fetchNotifications();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Spin size="large" />
      </div>
    );
  }

  // Get current menu key from pathname
  const getSelectedKey = () => {
    if (pathname === "/admin") return "dashboard";
    if (pathname?.startsWith("/admin/users")) return "users";
    if (pathname?.startsWith("/admin/pages")) return "pages";
    return "dashboard";
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => router.push("/admin"),
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Users",
      onClick: () => router.push("/admin/users"),
    },
    {
      key: "pages",
      icon: <FileTextOutlined />,
      label: "Manage Pages",
      onClick: () => router.push("/admin/pages"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const notificationDropdown = (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
        minWidth: 320,
        maxWidth: 380,
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: 600 }}>
        Notifications {unreadCount > 0 && <span style={{ color: "#1677ff", fontSize: 12 }}>({unreadCount} unread)</span>}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center", color: "#999" }}>
          <BellOutlined style={{ fontSize: 28, marginBottom: 8, display: "block" }} />
          <span>No notifications</span>
        </div>
      ) : (
        notifications.slice(0, 5).map((notif) => (
          <div
            key={notif.id}
            onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              cursor: notif.read ? "default" : "pointer",
              background: notif.read ? "transparent" : "#f0f7ff",
              transition: "background 0.2s",
            }}
          >
            <Text strong={!notif.read} style={{ display: "block", marginBottom: 2 }}>
              {notif.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {notif.message.length > 60 ? notif.message.substring(0, 60) + "…" : notif.message}
            </Text>
          </div>
        ))
      )}

      {notifications.length > 0 && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid #f0f0f0" }}>
          <Space>
            <Button type="link" size="small" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
            <Button type="link" size="small" danger onClick={handleClearAllNotifications}>
              Clear All
            </Button>
          </Space>
        </div>
      )}
    </div>
  );

  const contextValue: AdminContextType = {
    currentUser,
    notifications,
    unreadCount,
    refreshNotifications: fetchNotifications,
    markNotificationRead: handleMarkNotificationRead,
    markAllRead: handleMarkAllRead,
    clearAllNotifications: handleClearAllNotifications,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value: boolean) => setCollapsed(value)}
          theme="dark"
          width={250}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
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
            <Logo href="/admin" size="sm" showText={!collapsed} textColor="white" textLabel="Admin" />
          </div>
          <Menu
            theme="dark"
            selectedKeys={[getSelectedKey()]}
            mode="inline"
            items={menuItems}
          />

          {/* Back to App link */}
          <div
            style={{
              position: "absolute",
              bottom: 48,
              left: 0,
              right: 0,
              padding: "8px 12px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Link
              href="/app"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                color: "#94a3b8",
                fontSize: 14,
                transition: "all 0.2s",
                textDecoration: "none",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 14, flexShrink: 0 }} />
              {!collapsed && <span>Back to App</span>}
            </Link>
          </div>
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: "margin-left 0.2s" }}>
          <Header
            style={{
              padding: "0 24px",
              background: colorBgContainer,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 50,
            }}
          >
            <div>
              <span className="text-lg font-semibold">BuildTrack Admin Panel</span>
            </div>
            <Space size="middle">
              <Dropdown dropdownRender={() => notificationDropdown} trigger={["click"]} placement="bottomRight">
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
              {children}
            </div>
          </Content>
          <Footer style={{ textAlign: "center" }}>
            BuildTrack Admin &copy;{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </AdminContext.Provider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <App>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </App>
  );
}
