"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Form,
  Select,
  Upload,
  message,
  Spin,
  Tabs,
  Typography,
  Divider,
  Avatar,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  SaveOutlined,
  BankOutlined,
  IdcardOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import { normalizePhoneNumber, formatPhoneNumber } from "@/lib/phoneUtils";
import { apiClient } from "@/lib/api/client";

const { Title, Text } = Typography;
const { TextArea } = Input;

const USER_TYPE_OPTIONS = ["Employee", "Contractor", "Customer", "Admin"];
const USER_STATUS_OPTIONS = ["Active", "Inactive"];
const TEAM_OPTIONS = ["Sales", "Designer", "Production", "QC", "Installer", "Finance", "Admin"];

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  userType?: string | null;
  userStatus?: string | null;
  team?: string | null;
  phone?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  role: { name: string; displayName: string };
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    const fetchUser = async () => {
      const result = await apiClient.getCurrentUser();
      if (result.error || !result.data) {
        router.push("/login");
        return;
      }
      const userData = (result.data as any).user;
      setUser(userData);
      setAvatarPreview(userData.avatarUrl || null);
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  // Handle avatar file pick — store as base64 data URL, no server upload needed
  const handleAvatarChange = (info: UploadChangeParam<UploadFile>) => {
    const file = info.file.originFileObj ?? (info.file as any);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAvatarPreview(dataUrl);
      profileForm.setFieldsValue({ avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (values: any) => {
    setSaving(true);
    const normalizedPhone = normalizePhoneNumber(values.phone);
    const payload = {
      ...values,
      phone: normalizedPhone || values.phone,
      avatarUrl: avatarPreview ?? undefined,
    };
    const result = await apiClient.updateProfile(payload);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("Profile updated successfully");
      setUser((prev) =>
        prev ? { ...prev, ...payload } : prev
      );
      if (normalizedPhone) {
        profileForm.setFieldsValue({ phone: formatPhoneNumber(normalizedPhone) });
      }
      // Refresh the page to update the dashboard with new profile data
      setTimeout(() => {
        router.refresh();
      }, 500);
    }
    setSaving(false);
  };

  const handleChangePassword = async (values: any) => {
    setChangingPassword(true);
    const result = await apiClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("Password changed successfully");
      passwordForm.resetFields();
    }
    setChangingPassword(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const displayName =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    user.email.split("@")[0];

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tabItems = [
    {
      key: "profile",
      label: "Profile Details",
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleSaveProfile}
          className="max-w-2xl"
          initialValues={{
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            displayName: user.displayName || "",
            phone: formatPhoneNumber(user.phone) || "",
            userType: user.userType || undefined,
            userStatus: user.userStatus || "Active",
            team: user.team || undefined,
            company: user.company || "",
            jobTitle: user.jobTitle || "",
            bio: user.bio || "",
          }}
        >
          {/* Avatar upload */}
          <Form.Item label="Profile Photo" name="avatarUrl" className="mb-6">
            <div className="flex items-center gap-4">
              <Avatar
                size={80}
                src={avatarPreview || undefined}
                style={{ backgroundColor: "#f97316", fontSize: 28, flexShrink: 0 }}
              >
                {!avatarPreview && initials}
              </Avatar>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarChange}
              >
                <Button icon={<CameraOutlined />}>Change Photo</Button>
              </Upload>
            </div>
          </Form.Item>

          <Divider className="my-4" />

          {/* Name row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: "First name is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="John" size="large" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: "Last name is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Doe" size="large" />
            </Form.Item>

            <Form.Item name="displayName" label="Display Name (optional)">
              <Input prefix={<UserOutlined />} placeholder="e.g. JD or Johnny" size="large" />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="e.g. +1 312 285 6334"
                size="large"
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  if (formatted) profileForm.setFieldsValue({ phone: formatted });
                }}
              />
            </Form.Item>

            <Form.Item name="userType" label="User Type">
              <Select size="large" placeholder="Select user type" allowClear
                options={USER_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
              />
            </Form.Item>
            <Form.Item name="userStatus" label="Status">
              <Select size="large" placeholder="Select status"
                options={USER_STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
              />
            </Form.Item>

            <Form.Item name="team" label="Team">
              <Select size="large" placeholder="Select team" allowClear
                options={TEAM_OPTIONS.map((t) => ({ label: t, value: t }))}
              />
            </Form.Item>
            <Form.Item name="jobTitle" label="Job Title">
              <Input prefix={<IdcardOutlined />} placeholder="Project Manager" size="large" />
            </Form.Item>

            <Form.Item name="company" label="Company / Organization" className="md:col-span-2">
              <Input prefix={<BankOutlined />} placeholder="Acme Construction" size="large" />
            </Form.Item>
          </div>

          <Form.Item name="bio" label="Bio">
            <TextArea rows={3} placeholder="Tell us about yourself..." />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
            >
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "security",
      label: "Security",
      children: (
        <div className="max-w-md">
          <Title level={5}>Change Password</Title>
          <Text type="secondary" className="block mb-4">
            Update your password to keep your account secure.
          </Text>
          <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: "Enter current password" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Current password" size="large" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Enter new password" },
                { min: 10, message: "Must be at least 10 characters" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" />
            </Form.Item>
            <Form.Item
              name="confirmNewPassword"
              label="Confirm New Password"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Confirm your new password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" size="large" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LockOutlined />}
                loading={changingPassword}
                size="large"
              >
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "account",
      label: "Account Info",
      children: (
        <div className="max-w-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text type="secondary" className="text-xs block">User ID</Text>
              <Text code className="text-xs break-all">{user.id}</Text>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text type="secondary" className="text-xs block">Email (Login)</Text>
              <Text strong>{user.email}</Text>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text type="secondary" className="text-xs block">Role</Text>
              <Text strong className="capitalize">{user.role?.displayName}</Text>
            </div>
            {user.createdAt && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <Text type="secondary" className="text-xs block">Member Since</Text>
                <Text strong>{new Date(user.createdAt).toLocaleDateString()}</Text>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            size={64}
            src={avatarPreview || undefined}
            style={{ backgroundColor: "#f97316", fontSize: 24 }}
          >
            {!avatarPreview && initials}
          </Avatar>
          <div>
            <Title level={3} className="mb-0">{displayName}</Title>
            <div className="flex items-center gap-2 text-gray-500">
              <MailOutlined /> <Text type="secondary">{user.email}</Text>
            </div>
            {user.jobTitle && (
              <Text type="secondary">
                {user.jobTitle}{user.company ? ` at ${user.company}` : ""}
              </Text>
            )}
          </div>
        </div>
      </div>
      <Divider />
      <Tabs items={tabItems} />
    </>
  );
}
