"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layout,
  Menu,
  theme,
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Spin,
  Input,
  Select,
  Modal,
  Form,
  Popconfirm,
  Badge,
  Dropdown,
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
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import * as XLSX from "xlsx";

const { Header, Content, Footer, Sider } = Layout;
const { Option } = Select;

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: string | null;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [form] = Form.useForm();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.getAdminUsers({
      page: pagination.page,
      limit: pagination.limit,
      search: searchText || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    });

    if (result.error) {
      message.error(result.error);
    } else if (result.data) {
      const data = result.data as any;
      setUsers(data.users || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, searchText, roleFilter, statusFilter]);

  const fetchNotifications = useCallback(async () => {
    const result = await apiClient.getAdminNotifications({ unreadOnly: true });
    if (result.data) {
      setUnreadCount((result.data as any).notifications?.length || 0);
    }
  }, []);

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
      fetchUsers();
      fetchNotifications();
    });
  }, [fetchUsers, fetchNotifications, router]);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push("/login");
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleDownloadExcel = async () => {
    message.loading({ content: "Generating Excel file...", key: "excel" });
    const result = await apiClient.getAllAdminUsers();
    if (result.error) {
      message.error({ content: `Failed to fetch users: ${result.error}`, key: "excel" });
      return;
    }
    if (result.data) {
      const allUsers = (result.data as any).users || [];
      const worksheetData = allUsers.map((user: User) => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Verified: user.emailVerified ? "Yes" : "No",
        Blocked: user.isBlocked ? "Yes" : "No",
        "Created At": new Date(user.createdAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
      XLSX.writeFile(workbook, "users.xlsx");
      message.success({ content: "Excel file generated successfully!", key: "excel" });
    }
  };

  const handleBlockUser = async (userId: string) => {
    const result = await apiClient.blockUser(userId, "Blocked by admin");
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("User blocked successfully");
      fetchUsers();
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const result = await apiClient.unblockUser(userId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("User unblocked successfully");
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await apiClient.deleteAdminUser(userId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("User deleted successfully");
      fetchUsers();
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        // Update user
        const result = await apiClient.updateAdminUser(editingUser.id, {
          email: values.email,
          name: values.name,
          role: values.role,
        });
        if (result.error) {
          message.error(result.error);
          return;
        }
        message.success("User updated successfully");
      } else {
        // Create user
        const result = await apiClient.createAdminUser({
          email: values.email,
          password: values.password,
          name: values.name,
          role: values.role,
          emailVerified: values.emailVerified,
        });
        if (result.error) {
          message.error(result.error);
          return;
        }
        message.success("User created successfully");
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch {
      // Validation failed
    }
  };

  const columns = [
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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: User) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          />
          {record.isBlocked ? (
            <Button
              size="small"
              icon={<UnlockOutlined />}
              onClick={() => handleUnblockUser(record.id)}
            />
          ) : (
            <Button
              size="small"
              danger
              icon={<LockOutlined />}
              onClick={() => handleBlockUser(record.id)}
              disabled={record.role === "ADMIN"}
            />
          )}
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.role === "ADMIN"}
            />
          </Popconfirm>
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
          defaultSelectedKeys={["users"]}
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
            <span className="text-lg font-semibold">User Management</span>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Users</h2>
              <Space>
                <Button icon={<FileExcelOutlined />} onClick={handleDownloadExcel}>
                  Download Excel
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
                  Add User
                </Button>
              </Space>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <Space wrap>
                <Input
                  placeholder="Search by name or email"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ width: 250 }}
                />
                <Select
                  placeholder="Role"
                  allowClear
                  style={{ width: 120 }}
                  value={roleFilter || undefined}
                  onChange={(value) => setRoleFilter(value || "")}
                >
                  <Option value="USER">User</Option>
                  <Option value="ADMIN">Admin</Option>
                </Select>
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 120 }}
                  value={statusFilter || undefined}
                  onChange={(value) => setStatusFilter(value || "")}
                >
                  <Option value="verified">Verified</Option>
                  <Option value="unverified">Unverified</Option>
                  <Option value="blocked">Blocked</Option>
                </Select>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Search
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearchText("");
                    setRoleFilter("");
                    setStatusFilter("");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    fetchUsers();
                  }}
                >
                  Reset
                </Button>
              </Space>
            </Card>

            {/* Users Table */}
            <Card>
              <Table
                dataSource={users}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                  current: pagination.page,
                  pageSize: pagination.limit,
                  total: pagination.total,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} users`,
                  onChange: (page, pageSize) => {
                    setPagination((prev) => ({
                      ...prev,
                      page,
                      limit: pageSize || 10,
                    }));
                  },
                }}
              />
            </Card>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>
          BuildTrack Admin &copy;{new Date().getFullYear()}
        </Footer>
      </Layout>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingUser ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item name="name" label="Name">
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            initialValue="USER"
            rules={[{ required: true, message: "Please select role" }]}
          >
            <Select>
              <Option value="USER">User</Option>
              <Option value="ADMIN">Admin</Option>
            </Select>
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="emailVerified"
              label="Email Verified"
              initialValue={false}
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>Yes (Skip verification)</Option>
                <Option value={false}>No (Require verification)</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Layout>
  );
}
