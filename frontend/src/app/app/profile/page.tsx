"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Form,
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
} from "@ant-design/icons";
import { normalizePhoneNumber, formatPhoneNumber } from "@/lib/phoneUtils";
import { apiClient } from "@/lib/api/client";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  role: {
    name: string;
    displayName: string;
  };
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
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
      // Removed setFieldsValue here to avoid "Instance not connected" warning
      // because Form is not rendered while loading=true
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleSaveProfile = async (values: any) => {
    setSaving(true);

    const normalizedPhone = normalizePhoneNumber(values.phone);
    const payload = { ...values, phone: normalizedPhone || values.phone };

    const result = await apiClient.updateProfile(payload);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("Profile updated successfully");
      setUser((prev) => prev ? { ...prev, ...values, phone: normalizedPhone || values.phone } : prev);

      // Update form with formatted value
      if (normalizedPhone) {
        profileForm.setFieldsValue({ phone: formatPhoneNumber(normalizedPhone) });
      }
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

  const displayName = user.name || user.email.split("@")[0];
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
            name: user.name || "",
            phone: formatPhoneNumber(user.phone) || "",
            company: user.company || "",
            jobTitle: user.jobTitle || "",
            bio: user.bio || "",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter your name" }]}>
              <Input prefix={<UserOutlined />} placeholder="John Doe" size="large" />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="e.g. +1 312 285 6334"
                size="large"
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  if (formatted) {
                    profileForm.setFieldsValue({ phone: formatted });
                  }
                }}
              />
            </Form.Item>
            <Form.Item name="company" label="Company / Organization">
              <Input prefix={<BankOutlined />} placeholder="Acme Construction" size="large" />
            </Form.Item>
            <Form.Item name="jobTitle" label="Job Title">
              <Input prefix={<IdcardOutlined />} placeholder="Project Manager" size="large" />
            </Form.Item>
          </div>
          <Form.Item name="bio" label="Bio">
            <TextArea rows={3} placeholder="Tell us about yourself..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
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
              <Button type="primary" htmlType="submit" icon={<LockOutlined />} loading={changingPassword} size="large">
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
              <Text type="secondary" className="text-xs block">Email</Text>
              <Text strong>{user.email}</Text>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text type="secondary" className="text-xs block">Role</Text>
              <Text strong className="capitalize">{user.role?.displayName}</Text>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Text type="secondary" className="text-xs block">Account ID</Text>
              <Text code className="text-xs">{user.id}</Text>
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
          <Avatar size={64} style={{ backgroundColor: "#f97316", fontSize: 24 }}>
            {initials}
          </Avatar>
          <div>
            <Title level={3} className="mb-0">{displayName}</Title>
            <div className="flex items-center gap-2 text-gray-500">
              <MailOutlined /> <Text type="secondary">{user.email}</Text>
            </div>
            {user.jobTitle && (
              <Text type="secondary">{user.jobTitle}{user.company ? ` at ${user.company}` : ""}</Text>
            )}
          </div>
        </div>
      </div>
      <Divider />
      <Tabs items={tabItems} />
    </>
  );
}
