"use client";

import React, { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Dropdown, Space, Input } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ProjectOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  BarChartOutlined,
  ContactsOutlined,
  QuestionCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  ClipboardList,
  Users2,
  Megaphone,
  Truck,
  ClipboardCheck,
  Wrench,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Logo } from "./Logo";
import { navigation, type SidebarItem } from "@/config/buildtrack.config";
import { cn } from "@/lib/utils";

const { Header, Content, Footer, Sider } = Layout;

interface User {
  id: string;
  email: string;
  name?: string;
  role: {
    name: string;
    displayName: string;
  };
}

interface DashboardLayoutProps {
  user: User;
  children: ReactNode;
}

/** Map sidebar labels to lucide icons */
const sidebarIcons: Record<string, React.ReactNode> = {
  "My Dashboard": <LayoutDashboard className="w-5 h-5" />,
  "My Projects": <FolderKanban className="w-5 h-5" />,
  "My Calendar": <CalendarDays className="w-5 h-5" />,
  "My Tasks": <ClipboardList className="w-5 h-5" />,
  Leads: <Megaphone className="w-4 h-4" />,
  "Design Requests": <Wrench className="w-4 h-4" />,
  "Work Orders": <ClipboardCheck className="w-4 h-4" />,
  Inspections: <Users2 className="w-4 h-4" />,
  Deliveries: <Truck className="w-4 h-4" />,
};

/** Map top nav labels to antd icons */
const topNavIcons: Record<string, React.ReactNode> = {
  Search: <SearchOutlined />,
  Reports: <BarChartOutlined />,
  Contacts: <ContactsOutlined />,
  Support: <QuestionCircleOutlined />,
  PROFILE: <UserOutlined />,
};

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(
    pathname.startsWith("/app/tasks")
  );
  const [searchVisible, setSearchVisible] = useState(false);

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

  const isActive = (path: string) => {
    if (path === "/app/dashboard") return pathname === "/app" || pathname === "/app/dashboard";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar - built from config */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value: boolean) => setCollapsed(value)}
        trigger={null}
        theme="dark"
        width={250}
        collapsedWidth={70}
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
        {/* Logo */}
        <div className="h-16 mx-4 flex items-center justify-between">
          <Logo
            href="/app"
            size="sm"
            showText={!collapsed}
            textColor="white"
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <MenuUnfoldOutlined style={{ fontSize: 16 }} />
            ) : (
              <MenuFoldOutlined style={{ fontSize: 16 }} />
            )}
          </button>
        </div>

        {/* Navigation items from config */}
        <nav className="px-2 py-4 space-y-1">
          {navigation.sidebar.map((item) => (
            <SidebarNavItem
              key={item.path}
              item={item}
              collapsed={collapsed}
              pathname={pathname}
              isActive={isActive}
              tasksExpanded={tasksExpanded}
              onToggleTasks={() => setTasksExpanded(!tasksExpanded)}
              onNavigate={(path) => router.push(path)}
            />
          ))}
        </nav>

        {/* All Modules link */}
        <div className="px-2 mt-4 border-t border-slate-700 pt-4">
          <Link
            href="/app/modules"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith("/app/modules")
                ? "bg-orange-500/20 text-orange-300"
                : "text-gray-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <UnorderedListOutlined style={{ fontSize: 16 }} />
            {!collapsed && <span>All Modules</span>}
          </Link>
        </div>
      </Sider>

      {/* Main content area */}
      <Layout
        style={{
          marginLeft: collapsed ? 70 : 250,
          transition: "margin-left 0.2s",
        }}
      >
        {/* Top Nav - built from config */}
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 99,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {/* Left: page title or breadcrumb space */}
          <div />

          {/* Right: top nav items from config */}
          <Space size="middle">
            {navigation.topNav.map((item) => {
              if (item === "PROFILE") {
                return (
                  <Dropdown
                    key="profile"
                    menu={{ items: userMenuItems }}
                    trigger={["click"]}
                  >
                    <a
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="hidden sm:block text-right">
                        <p className="text-slate-900 font-medium text-sm leading-tight">
                          {displayName}
                        </p>
                        <p className="text-gray-400 text-xs leading-tight">
                          {user.role.displayName}
                        </p>
                      </div>
                      <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {initials}
                      </div>
                    </a>
                  </Dropdown>
                );
              }

              if (item === "Search") {
                return (
                  <div key="search" className="hidden md:block">
                    <Input
                      prefix={<SearchOutlined className="text-gray-400" />}
                      placeholder="Search..."
                      className="w-48"
                      size="middle"
                    />
                  </div>
                );
              }

              return (
                <button
                  key={item}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-slate-900 transition-colors text-sm"
                  onClick={() => {
                    // TODO: Wire up Reports, Contacts, Support pages
                    console.log(`Navigate to ${item}`);
                  }}
                >
                  {topNavIcons[item]}
                  <span className="hidden lg:inline">{item}</span>
                </button>
              );
            })}
          </Space>
        </Header>

        <Content style={{ margin: "24px 16px 0", overflow: "initial" }}>
          <div className="p-6 bg-white rounded-lg min-h-[360px]">
            {children}
          </div>
        </Content>

        <Footer style={{ textAlign: "center", color: "#999", fontSize: 12 }}>
          BuildTrack &copy;{new Date().getFullYear()} Created by BuildTrack Team
        </Footer>
      </Layout>
    </Layout>
  );
}

/** Sidebar navigation item with support for collapsible children */
function SidebarNavItem({
  item,
  collapsed,
  pathname,
  isActive,
  tasksExpanded,
  onToggleTasks,
  onNavigate,
}: {
  item: SidebarItem;
  collapsed: boolean;
  pathname: string;
  isActive: (path: string) => boolean;
  tasksExpanded: boolean;
  onToggleTasks: () => void;
  onNavigate: (path: string) => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const active = isActive(item.path);
  const icon = sidebarIcons[item.label] || (
    <DashboardOutlined style={{ fontSize: 16 }} />
  );

  if (hasChildren) {
    // Collapsible parent (My Tasks)
    const childActive = item.children!.some((c) => isActive(c.path));

    return (
      <div>
        <button
          onClick={onToggleTasks}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            active || childActive
              ? "bg-slate-700 text-white"
              : "text-gray-400 hover:text-white hover:bg-slate-700/50"
          )}
        >
          {icon}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {tasksExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </>
          )}
        </button>

        {/* Children */}
        {tasksExpanded && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-600 pl-3">
            {item.children!.map((child) => (
              <Link
                key={child.path}
                href={child.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive(child.path)
                    ? "bg-orange-500/20 text-orange-300 font-medium"
                    : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                )}
              >
                {sidebarIcons[child.label] || (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Simple nav item
  return (
    <Link
      href={item.path === "/app/dashboard" ? "/app" : item.path}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-slate-700 text-white"
          : "text-gray-400 hover:text-white hover:bg-slate-700/50"
      )}
    >
      {icon}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}
