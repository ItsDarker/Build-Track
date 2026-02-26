"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Form,
  Select,
  Modal,
  Table,
  App,
  Spin,
  Tabs,
  Typography,
  Avatar,
  Tag,
  Empty,
  Tooltip,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UserAddOutlined,
  DeleteOutlined,
  MailOutlined,
  TeamOutlined,
  EditOutlined,
  CrownOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";

const { Title, Text } = Typography;

// ── LOV constants ─────────────────────────────────────────────────────────────
const TEAM_NAME_OPTIONS = ["Sales", "Designer", "Production", "QC", "Installer", "Finance", "Admin"];
const TEAM_TYPE_OPTIONS = ["Operational", "Administrative"];
const TEAM_STATUS_OPTIONS = ["Active", "Inactive"];

// ── Types ─────────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface TeamEntity {
  id: string;
  name: string;
  teamType: string | null;
  status: string;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
  role: { name: string };
}

const roleColors: Record<string, string> = {
  ADMIN: "red",
  PM: "blue",
  SUBCONTRACTOR: "orange",
  CLIENT: "green",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { message } = App.useApp();
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Team Members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm] = Form.useForm();

  // Team Entities state
  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamEntity | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamForm] = Form.useForm();

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const userResult = await apiClient.getCurrentUser();
      if (userResult.error || !userResult.data) { router.push("/login"); return; }
      setUser((userResult.data as any).user);

      const [membersResult, teamsResult] = await Promise.all([
        apiClient.getTeamMembers(),
        apiClient.getTeams(),
      ]);
      if (membersResult.data) setMembers((membersResult.data as any).members || []);
      if (teamsResult.data)   setTeams((teamsResult.data as any).teams || []);
      setLoading(false);
    };
    init();
  }, [router]);

  // ── Team Members handlers ────────────────────────────────────────────────────
  const handleInvite = async (values: { email: string; role: string }) => {
    setInviting(true);
    const result = await apiClient.inviteTeamMember(values);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success(`Invitation sent to ${values.email}`);
      setIsInviteModalOpen(false);
      inviteForm.resetFields();
      const r = await apiClient.getTeamMembers();
      if (r.data) setMembers((r.data as any).members || []);
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

  // ── Team Entity handlers ─────────────────────────────────────────────────────
  const openCreateTeam = () => {
    setEditingTeam(null);
    teamForm.resetFields();
    teamForm.setFieldsValue({ status: "Active" });
    setIsTeamModalOpen(true);
  };

  const openEditTeam = (team: TeamEntity) => {
    setEditingTeam(team);
    teamForm.setFieldsValue({ name: team.name, teamType: team.teamType, status: team.status });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (values: { name: string; teamType?: string; status: string }) => {
    setSavingTeam(true);
    const result = editingTeam
      ? await apiClient.updateTeam(editingTeam.id, values)
      : await apiClient.createTeam(values);

    if (result.error) {
      message.error(result.error);
    } else {
      message.success(editingTeam ? "Team updated" : "Team created");
      setIsTeamModalOpen(false);
      teamForm.resetFields();
      const r = await apiClient.getTeams();
      if (r.data) setTeams((r.data as any).teams || []);
    }
    setSavingTeam(false);
  };

  const handleDeleteTeam = async (teamId: string) => {
    const result = await apiClient.deleteTeam(teamId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("Team deleted");
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    }
  };

  // ── Teams table columns ──────────────────────────────────────────────────────
  const teamColumns: ColumnsType<TeamEntity> = [
    {
      title: "Team ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => (
        <Text code className="text-xs">{id.slice(0, 8)}…</Text>
      ),
    },
    {
      title: "Team Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Team Type",
      dataIndex: "teamType",
      key: "teamType",
      render: (t: string | null) => t ? <Tag>{t}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "Active" ? "green" : "default"}>{s}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: TeamEntity) => (
        <div className="flex gap-2">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditTeam(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this team?"
            onConfirm={() => handleDeleteTeam(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const isAdmin = (user.role as any)?.name === "ADMIN";

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: "members",
      label: "Team Members",
      children: (
        <>
          {/* Stats */}
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
                  <Text type="secondary" className="text-xs block">Subcontractors</Text>
                  <Text strong className="text-xl">{members.filter((m) => m.role === "SUBCONTRACTOR").length}</Text>
                </div>
              </div>
            </Card>
          </div>

          {/* Members list */}
          <Card title="Members">
            {members.length === 0 ? (
              <Empty description="No team members yet. Invite someone to get started!" />
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const name = member.name || member.email.split("@")[0];
                  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar style={{ backgroundColor: "#f97316" }}>{initials}</Avatar>
                        <div>
                          <Text strong>{name}</Text>
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <MailOutlined /> {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag color={roleColors[member.role] || "default"}>{member.role}</Tag>
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
        </>
      ),
    },
    {
      key: "teams",
      label: "Teams",
      children: (
        <Card
          title="Team Profiles"
          extra={
            isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateTeam}>
                Add Team
              </Button>
            )
          }
        >
          <Table<TeamEntity>
            columns={teamColumns}
            dataSource={teams}
            rowKey="id"
            loading={teamsLoading}
            pagination={false}
            locale={{ emptyText: <Empty description="No teams defined yet." /> }}
          />
        </Card>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-0">Team Profile</Title>
          <Text type="secondary">Manage your team members and team definitions</Text>
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

      <Tabs items={tabItems} defaultActiveKey="members" />

      {/* Invite Member Modal */}
      <Modal
        title="Invite Team Member"
        open={isInviteModalOpen}
        onCancel={() => { setIsInviteModalOpen(false); inviteForm.resetFields(); }}
        forceRender
        footer={null}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleInvite} className="mt-4">
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
            initialValue="SUBCONTRACTOR"
          >
            <select className="w-full h-10 px-3 border border-gray-300 rounded-md">
              <option value="PM">Project Manager</option>
              <option value="SUBCONTRACTOR">Subcontractor</option>
              <option value="CLIENT">Client Portal Access</option>
            </select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setIsInviteModalOpen(false); inviteForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={inviting}>Send Invitation</Button>
          </div>
        </Form>
      </Modal>

      {/* Add / Edit Team Modal */}
      <Modal
        title={editingTeam ? "Edit Team" : "Add Team"}
        open={isTeamModalOpen}
        onCancel={() => { setIsTeamModalOpen(false); teamForm.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form form={teamForm} layout="vertical" onFinish={handleSaveTeam} className="mt-4">
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: "Please select a team name" }]}
          >
            <Select size="large" placeholder="Select team name"
              options={TEAM_NAME_OPTIONS.map((n) => ({ label: n, value: n }))}
            />
          </Form.Item>
          <Form.Item name="teamType" label="Team Type">
            <Select size="large" placeholder="Select team type" allowClear
              options={TEAM_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active">
            <Select size="large"
              options={TEAM_STATUS_OPTIONS.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setIsTeamModalOpen(false); teamForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={savingTeam}>
              {editingTeam ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
