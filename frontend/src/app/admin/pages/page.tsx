"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layout,
  Menu,
  theme,
  Card,
  Button,
  Space,
  Badge,
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
  EditOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";

const { Header, Content, Footer, Sider } = Layout;
const { Text, Paragraph } = Typography;

interface PageInfo {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  lastUpdated?: string;
}

const pages: PageInfo[] = [
  {
    key: "home",
    title: "Homepage",
    description: "Edit the main landing page content including hero, features, and security sections.",
    icon: <HomeOutlined style={{ fontSize: 24 }} />,
    path: "/admin/pages/home",
  },
];

export default function PagesManagementPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    // Check auth
    apiClient.getCurrentUser().then((result) => {
      if (result.error || !result.data) {
        router.push("/login");
        return;
      }
      const user = (result.data as any).user;
      if (user.role !== "ADMIN") {
        router.push("/app");
        return;
      }
    });

    // Fetch notifications count
    apiClient.getAdminNotifications({ unreadOnly: true }).then((result) => {
      if (result.data) {
        setUnreadCount((result.data as any).notifications?.length || 0);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push("/login");
  };

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
          defaultSelectedKeys={["pages"]}
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
            <span className="text-lg font-semibold">Page Management</span>
          </div>
          <Space size="middle">
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined />} onClick={() => router.push("/admin")} />
            </Badge>
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Manage Pages</h2>
              <Text type="secondary">
                Edit and customize the content of your website pages.
              </Text>
            </div>

            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
              dataSource={pages}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    onClick={() => router.push(item.path)}
                    actions={[
                      <Button
                        key="edit"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(item.path);
                        }}
                      >
                        Edit Page
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                          {item.icon}
                        </div>
                      }
                      title={item.title}
                      description={
                        <Paragraph ellipsis={{ rows: 2 }} className="mb-0">
                          {item.description}
                        </Paragraph>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          BuildTrack Admin &copy;{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
