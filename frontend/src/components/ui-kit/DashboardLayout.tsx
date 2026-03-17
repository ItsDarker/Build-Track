"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Dropdown, Space, Input, App, Badge, Button, Modal, Tag } from "antd";
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
  BellOutlined,
  CloseOutlined,
  MessageOutlined,
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
  ShieldCheck,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Logo } from "./Logo";
import { navigation, type SidebarItem } from "@/config/buildtrack.config";
import { canAccessModule } from "@/config/rbac";
import { cn } from "@/lib/utils";
import { HelpNestChat } from "@/components/support/HelpNestChat";

/** Map sidebar child paths to module slugs for RBAC filtering */
const SIDEBAR_PATH_TO_MODULE: Record<string, string> = {
  "/app/tasks/leads": "crm-leads",
  "/app/tasks/design-requests": "design-configurator",
  "/app/tasks/work-orders": "work-orders",
  "/app/tasks/support-warranty": "support-warranty",
  "/app/tasks/inspections": "quality-control",
  "/app/tasks/deliveries": "delivery-installation",
};

const { Header, Content, Footer, Sider } = Layout;

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
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
  "Team Profile": <Users2 className="w-5 h-5" />,
  "Customers": <ContactsOutlined style={{ fontSize: 18 }} />,
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

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  invitationId?: string;
  data?: string;
  createdAt: string;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(
    pathname.startsWith("/app/tasks")
  );
  const [searchVisible, setSearchVisible] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeInvite, setActiveInvite] = useState<UserNotification | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Filter sidebar items based on user role
  const filteredSidebar = navigation.sidebar
    .map((item) => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter((child) => {
        const moduleSlug = SIDEBAR_PATH_TO_MODULE[child.path];
        if (!moduleSlug) return true; // No mapping = always show
        const roleName = user?.role?.name ?? "VENDOR";
        return canAccessModule(roleName, moduleSlug);
      });
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    })
    .filter(Boolean) as SidebarItem[];

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

  // Fetch notifications
  const fetchUserNotifications = async () => {
    try {
      const result = await apiClient.getUserNotifications({ limit: 20 });
      if (result.data) {
        const notifs = (result.data as any).notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: UserNotification) => !n.read).length);
      }
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
    }
  };

  // Polling for notifications
  useEffect(() => {
    fetchUserNotifications();
    const interval = setInterval(fetchUserNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.read) {
      await apiClient.markUserNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (notif.type === 'PROJECT_INVITE') {
      setActiveInvite(notif);
      setInviteModalOpen(true);
    } else if (notif.type === 'TEAM_INVITE') {
      // Show team invite modal
      setActiveInvite(notif);
      setInviteModalOpen(true);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    const result = await apiClient.deleteUserNotification(notifId);
    if (result.data) {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      const notif = notifications.find(n => n.id === notifId);
      if (notif && !notif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      message.success('Notification cleared');
    } else {
      message.error(result.error || 'Failed to delete notification');
    }
  };

  const handleAcceptInvite = async (notifId: string) => {
    const inviteType = activeInvite?.type;
    const apiCall = inviteType === 'TEAM_INVITE'
      ? apiClient.acceptTeamInvite(notifId)
      : apiClient.acceptProjectInvite(notifId);

    const result = await apiCall;
    if (result.data) {
      message.success(inviteType === 'TEAM_INVITE' ? 'Invitation accepted!' : 'You joined the project!');
      setInviteModalOpen(false);
      setActiveInvite(null);
      await fetchUserNotifications();
      if (inviteType === 'PROJECT_INVITE' && (result.data as any).projectId) {
        router.push(`/app/projects`);
      }
    } else {
      message.error(result.error || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvite = async (notifId: string) => {
    const inviteType = activeInvite?.type;
    const apiCall = inviteType === 'TEAM_INVITE'
      ? apiClient.declineTeamInvite(notifId)
      : apiClient.declineProjectInvite(notifId);

    const result = await apiCall;
    if (result.data) {
      message.success('Invitation declined');
      setInviteModalOpen(false);
      setActiveInvite(null);
      await fetchUserNotifications();
    } else {
      message.error(result.error || 'Failed to decline invitation');
    }
  };

  const notificationDropdown = (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        minWidth: 320,
        maxWidth: 380,
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
        Notifications {unreadCount > 0 && <span style={{ color: '#1677ff', fontSize: 12 }}>({unreadCount} unread)</span>}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#999' }}>
          <BellOutlined style={{ fontSize: 28, marginBottom: 8, display: 'block' }} />
          <span>No notifications</span>
        </div>
      ) : (
        notifications.slice(0, 5).map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              background: notif.read ? 'transparent' : '#f0f7ff',
              transition: 'background 0.2s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: notif.read ? 'normal' : '600' }}>
                  {notif.title}
                </span>
                {notif.type === 'PROJECT_INVITE' && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>Pending invite</Tag>
                )}
                {notif.type === 'TEAM_INVITE' && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>Team invite</Tag>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {notif.message.length > 60 ? notif.message.substring(0, 60) + '…' : notif.message}
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteNotification(e, notif.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: '#999',
                fontSize: 14,
                minWidth: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Clear notification"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#f5222d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#999';
              }}
            >
              <CloseOutlined style={{ fontSize: 14 }} />
            </button>
          </div>
        ))
      )}
    </div>
  );

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
          {filteredSidebar.map((item) => (
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

        {/* Messaging and All Modules section */}
        <div className="px-2 mt-4 border-t border-slate-700 pt-4">
          <Link
            href="/app/messaging"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith("/app/messaging")
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <MessageOutlined style={{ fontSize: 16 }} />
            {!collapsed && <span>Messaging</span>}
          </Link>

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

        {/* Super Admin link — only for admin roles */}
        {["SUPER_ADMIN", "ADMIN", "ORG_ADMIN"].includes(user?.role?.name ?? "") && (
          <div className="px-2 mt-2 border-t border-slate-700 pt-3 pb-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-purple-400 hover:text-purple-200 hover:bg-purple-900/30"
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="font-medium">Super Admin</span>}
            </Link>
          </div>
        )}
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
            <Dropdown popupRender={() => notificationDropdown} trigger={["click"]} placement="bottomRight">
              <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
              </Badge>
            </Dropdown>

            {/* Help & Support Chat Widget */}
            <HelpNestChat user={user} />

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
                          {user.role?.displayName || 'No Role'}
                        </p>
                      </div>
                      <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
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

              // Handle navigation for Support, Reports, and Contacts
              if (item === "Support") {
                return (
                  <button
                    key={item}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-slate-900 transition-colors text-sm"
                    onClick={() => router.push("/app/support")}
                  >
                    {topNavIcons[item]}
                    <span className="hidden lg:inline">{item}</span>
                  </button>
                );
              }

              if (item === "Reports") {
                return (
                  <button
                    key={item}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-slate-900 transition-colors text-sm"
                    onClick={() => router.push("/app/reports")}
                  >
                    {topNavIcons[item]}
                    <span className="hidden lg:inline">{item}</span>
                  </button>
                );
              }

              if (item === "Contacts") {
                return (
                  <button
                    key={item}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-slate-900 transition-colors text-sm"
                    onClick={() => router.push("/app/contacts")}
                  >
                    {topNavIcons[item]}
                    <span className="hidden lg:inline">{item}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-slate-900 transition-colors text-sm"
                  onClick={() => {
                    // Search handled separately
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

        <Content
          style={{
            margin: pathname === "/app/messaging" ? "0" : "24px 16px 0",
            overflow: pathname === "/app/messaging" ? "hidden" : "initial",
            padding: pathname === "/app/messaging" ? "0" : undefined,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {pathname === "/app/messaging" ? (
            children
          ) : (
            <div className="p-6 bg-white rounded-lg min-h-[360px]">
              {children}
            </div>
          )}
        </Content>

        <Footer style={{ textAlign: "center", color: "#999", fontSize: 12 }}>
          BuildTrack &copy;{new Date().getFullYear()} Created by BuildTrack Team
        </Footer>
      </Layout>

      {/* Invitation Modal (Project or Team) */}
      {activeInvite && (
        <Modal
          title={activeInvite.type === 'TEAM_INVITE' ? 'Team Invitation' : 'Project Invitation'}
          open={inviteModalOpen}
          onCancel={() => {
            setInviteModalOpen(false);
            setActiveInvite(null);
          }}
          footer={[
            <Button key="decline" onClick={() => handleDeclineInvite(activeInvite.id)}>
              Decline
            </Button>,
            <Button key="accept" type="primary" onClick={() => handleAcceptInvite(activeInvite.id)}>
              Accept
            </Button>,
          ]}
        >
          <div style={{ padding: '12px 0' }}>
            {activeInvite.data && (
              <>
                {(() => {
                  try {
                    const inviteData = JSON.parse(activeInvite.data);
                    if (activeInvite.type === 'TEAM_INVITE') {
                      return (
                        <div style={{ lineHeight: '1.8' }}>
                          <p><strong>Role:</strong> {inviteData.role}</p>
                          <p><strong>Invited by:</strong> {inviteData.inviterName} ({inviteData.inviterEmail})</p>
                          {inviteData.invitationToken && (
                            <p><strong>Invitation Token:</strong> <code>{inviteData.invitationToken.slice(0, 16)}...</code></p>
                          )}
                          <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
                            By accepting, you will join the team and have access to team resources.
                          </p>
                        </div>
                      );
                    } else {
                      // PROJECT_INVITE
                      return (
                        <div style={{ lineHeight: '1.8' }}>
                          <p><strong>Project:</strong> {inviteData.projectName}</p>
                          <p><strong>Invited by:</strong> {inviteData.inviterName} ({inviteData.inviterEmail})</p>
                          {inviteData.pmMessage && (
                            <p><strong>Message:</strong> {inviteData.pmMessage}</p>
                          )}
                        </div>
                      );
                    }
                  } catch {
                    return <p>{activeInvite.message}</p>;
                  }
                })()}
              </>
            )}
          </div>
        </Modal>
      )}
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
