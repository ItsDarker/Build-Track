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
  role: string;
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
      if (user.role !== "ADMIN") {
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
