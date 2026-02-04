"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, theme, Dropdown, Space } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";

const { Header, Content, Footer, Sider } = Layout;

interface User {
  id: string;
  email: string;
  name?: string;
}

interface DashboardLayoutProps {
  user: User;
  children: ReactNode;
}

const navItems = [
  { key: "/app", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/app/tasks", icon: <CheckSquareOutlined />, label: "Tasks", disabled: true },
  { key: "/app/team", icon: <TeamOutlined />, label: "Team", disabled: true },
  { key: "/app/reports", icon: <BarChartOutlined />, label: "Reports", disabled: true },
  { key: "/app/settings", icon: <SettingOutlined />, label: "Settings", disabled: true },
];

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const displayName = user.name || user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push("/");
    router.refresh();
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      disabled: true,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  const menuItems = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.disabled ? (
      <span className="flex items-center justify-between w-full">
        {item.label}
        <span className="text-xs bg-slate-600 px-2 py-0.5 rounded ml-2">Soon</span>
      </span>
    ) : (
      item.label
    ),
    disabled: item.disabled,
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = navItems.find((i) => i.key === key);
    if (!item?.disabled) {
      router.push(key);
    }
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
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
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
            {!collapsed && (
              <span className="text-xl font-bold text-white">BuildTrack</span>
            )}
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: "margin-left 0.2s" }}>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 99,
          }}
        >
          <Space size="middle">
            <div className="hidden sm:block text-right">
              <p className="text-slate-900 font-medium text-sm">{displayName}</p>
              <p className="text-gray-500 text-xs">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <a
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
              </a>
            </Dropdown>
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
          BuildTrack &copy;{new Date().getFullYear()} Created by BuildTrack Team
        </Footer>
      </Layout>
    </Layout>
  );
}
