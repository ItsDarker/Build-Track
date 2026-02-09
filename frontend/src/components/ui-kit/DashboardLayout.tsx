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
import { Logo } from "./Logo";

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
  { key: "/app/profile", icon: <UserOutlined />, label: "My Profile" },
  { key: "/app/team", icon: <TeamOutlined />, label: "Team" },
  { key: "/app/clients", icon: <CheckSquareOutlined />, label: "Clients" },
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
      onClick: () => router.push("/app/profile"),
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
          <Logo href="/app" size="sm" showText={!collapsed} textColor="white" />
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
