"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Popconfirm,
  App,
} from "antd";
import {
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
  KeyOutlined,
} from "@ant-design/icons";
import { normalizePhoneNumber, formatPhoneNumber } from "@/lib/phoneUtils";
import { apiClient } from "@/lib/api/client";
import * as XLSX from "xlsx";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  bio: string | null;
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
  const { message } = App.useApp();
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
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

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
  }, [pagination.page, pagination.limit, searchText, roleFilter, statusFilter, message]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        Phone: formatPhoneNumber(user.phone),
        Company: user.company,
        JobTitle: user.jobTitle,
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
      phone: formatPhoneNumber(user.phone), // Format for display in edit
      company: user.company,
      jobTitle: user.jobTitle,
      bio: user.bio,
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // Normalize phone number before saving
      const normalizedPhone = normalizePhoneNumber(values.phone);
      // Optional: You might want to warn if normalization fails but user entered something
      // For now, if normalization returns null, we can treat it as null/empty if the field was optional
      // or error if required. The current usage implies optional phone.

      const payload = {
        ...values,
        phone: normalizedPhone || values.phone // Fallback to raw if normalization fails, or handle error? 
        // normalizePhoneNumber returns null if invalid. If field has value but is invalid, we might want to error?
        // But let's follow the util: if it returns null, it's invalid.
        // Let's assume we pass the valid one or if it's null and input was not empty, maybe validation failed?
        // Actually, let's just pass the normalized one.
      };

      // Better: if values.phone has content but normalized is null, it's an invalid number. 
      if (values.phone && !normalizedPhone) {
        form.setFields([
          {
            name: 'phone',
            errors: ['Invalid phone number format'],
          },
        ]);
        return;
      }

      const saveData = {
        ...values,
        phone: normalizedPhone,
      };

      if (editingUser) {
        const result = await apiClient.updateAdminUser(editingUser.id, {
          email: saveData.email,
          name: saveData.name,
          role: saveData.role,
          phone: saveData.phone,
          company: saveData.company,
          jobTitle: saveData.jobTitle,
          bio: saveData.bio,
          emailVerified: saveData.emailVerified,
        });
        if (result.error) {
          message.error(result.error);
          return;
        }
        message.success("User updated successfully");
      } else {
        const result = await apiClient.createAdminUser({
          email: saveData.email,
          password: values.password,
          name: saveData.name,
          role: saveData.role,
          emailVerified: saveData.emailVerified,
          phone: saveData.phone,
          company: saveData.company,
          jobTitle: saveData.jobTitle,
          bio: saveData.bio,
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

  const handleResetPassword = (userId: string) => {
    setResetPasswordUserId(userId);
    resetPasswordForm.resetFields();
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordOk = async () => {
    try {
      const values = await resetPasswordForm.validateFields();
      if (resetPasswordUserId) {
        const result = await apiClient.resetAdminUserPassword(resetPasswordUserId, values.password);
        if (result.error) {
          message.error(result.error);
          return;
        }
        message.success("Password reset successfully");
        setIsResetPasswordModalOpen(false);
        resetPasswordForm.resetFields();
        setResetPasswordUserId(null);
      }
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
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string | null) => formatPhoneNumber(phone) || "-",
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
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record.id)}
            title="Reset Password"
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

  return (
    <>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Role"
            allowClear
            style={{ width: 120 }}
            value={roleFilter || undefined}
            onChange={(value: string) => setRoleFilter(value || "")}
            options={[
              { value: "USER", label: "User" },
              { value: "ADMIN", label: "Admin" },
            ]}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            value={statusFilter || undefined}
            onChange={(value: string) => setStatusFilter(value || "")}
            options={[
              { value: "verified", label: "Verified" },
              { value: "unverified", label: "Unverified" },
              { value: "blocked", label: "Blocked" },
            ]}
          />
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
            showTotal: (total: number) => `Total ${total} users`,
            onChange: (page: number, pageSize: number) => {
              setPagination((prev) => ({
                ...prev,
                page,
                limit: pageSize || 10,
              }));
            },
          }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={isModalOpen}
        onOk={handleModalOk}
        forceRender
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

          <Form.Item name="phone" label="Phone">
            <Input
              placeholder="e.g. +1 312 285 6334"
              onBlur={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                if (formatted) {
                  form.setFieldsValue({ phone: formatted });
                }
              }}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="company" label="Company">
              <Input />
            </Form.Item>

            <Form.Item name="jobTitle" label="Job Title">
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            initialValue="SUBCONTRACTOR"
            rules={[{ required: true, message: "Please select role" }]}
          >
            <Select
              options={[
                { value: "ADMIN", label: "Admin - Full System Access" },
                { value: "PM", label: "Project Manager - Manage Projects & Tasks" },
                { value: "SUBCONTRACTOR", label: "Subcontractor - Update Assigned Tasks" },
                { value: "CLIENT", label: "Client - View Projects (Read-Only)" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="emailVerified"
            label="Email Verified"
            initialValue={false}
          >
            <Select
              options={[
                { value: true, label: "Yes (Verified)" },
                { value: false, label: "No (Unverified)" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Reset User Password"
        open={isResetPasswordModalOpen}
        onOk={handleResetPasswordOk}
        onCancel={() => {
          setIsResetPasswordModalOpen(false);
          resetPasswordForm.resetFields();
          setResetPasswordUserId(null);
        }}
        okText="Reset Password"
        okButtonProps={{ danger: true }}
      >
        <Form form={resetPasswordForm} layout="vertical" className="mt-4">
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
