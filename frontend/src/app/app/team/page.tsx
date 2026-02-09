"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Form,
  Modal,
  message,
  Spin,
  Typography,
  Avatar,
  Tag,
  Empty,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  MailOutlined,
  TeamOutlined,
  EditOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { DashboardLayout } from "@/components/ui-kit/DashboardLayout";

const { Title, Text } = Typography;

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  joinedAt?: string;
  status?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

const roleColors: Record<string, string> = {
  PM: "blue",
  ADMIN: "red",
  CONTRACTOR: "orange",
  OWNER: "green",
  USER: "default",
};

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      const userResult = await apiClient.getCurrentUser();
      if (userResult.error || !userResult.data) {
        router.push("/login");
        return;
      }
      setUser((userResult.data as any).user);

      const teamResult = await apiClient.getTeamMembers();
      if (teamResult.data) {
        setMembers((teamResult.data as any).members || []);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleInvite = async (values: { email: string; role: string }) => {
    setInviting(true);
    const result = await apiClient.inviteTeamMember(values);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success(`Invitation sent to ${values.email}`);
      setIsInviteModalOpen(false);
      form.resetFields();
      // Refresh members
      const teamResult = await apiClient.getTeamMembers();
      if (teamResult.data) {
        setMembers((teamResult.data as any).members || []);
      }
    }
    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const result = await apiClient.removeTeamMember(memberId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-0">Team Profile</Title>
          <Text type="secondary">Manage your team members and roles</Text>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setIsInviteModalOpen(true)}
          size="large"
        >
          Invite Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TeamOutlined className="text-blue-500 text-lg" />
            </div>
            <div>
              <Text type="secondary" className="text-xs block">Total Members</Text>
              <Text strong className="text-xl">{members.length}</Text>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CrownOutlined className="text-orange-500 text-lg" />
            </div>
            <div>
              <Text type="secondary" className="text-xs block">Project Managers</Text>
              <Text strong className="text-xl">{members.filter((m) => m.role === "PM").length}</Text>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <EditOutlined className="text-green-500 text-lg" />
            </div>
            <div>
              <Text type="secondary" className="text-xs block">Contractors</Text>
              <Text strong className="text-xl">{members.filter((m) => m.role === "CONTRACTOR").length}</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Members List */}
      <Card title="Team Members">
        {members.length === 0 ? (
          <Empty description="No team members yet. Invite someone to get started!" />
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const name = member.name || member.email.split("@")[0];
              const memberInitials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar style={{ backgroundColor: "#f97316" }}>{memberInitials}</Avatar>
                    <div>
                      <Text strong>{name}</Text>
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <MailOutlined /> {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color={roleColors[member.role] || "default"}>
                      {member.role}
                    </Tag>
                    {member.id !== user.id && (
                      <Popconfirm
                        title="Remove this member?"
                        onConfirm={() => handleRemoveMember(member.id)}
                        okText="Remove"
                        cancelText="Cancel"
                      >
                        <Tooltip title="Remove member">
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Tooltip>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <Modal
        title="Invite Team Member"
        open={isInviteModalOpen}
        onCancel={() => { setIsInviteModalOpen(false); form.resetFields(); }}
        forceRender
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleInvite} className="mt-4">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter an email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="colleague@company.com" size="large" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
            initialValue="CONTRACTOR"
          >
            <select className="w-full h-10 px-3 border border-gray-300 rounded-md">
              <option value="PM">Project Manager</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="OWNER">Owner / Builder</option>
            </select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setIsInviteModalOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={inviting}>
              Send Invitation
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
