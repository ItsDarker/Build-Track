"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  Form,
  Modal,
  App,
  Spin,
  Typography,
  Empty,
  Tooltip,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  UserOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { normalizePhoneNumber, formatPhoneNumber } from "@/lib/phoneUtils";
import { apiClient } from "@/lib/api/client";
import { downloadExcel } from "@/lib/downloadExcel";
import { DashboardLayout } from "@/components/ui-kit/DashboardLayout";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export default function ClientsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      const userResult = await apiClient.getCurrentUser();
      if (userResult.error || !userResult.data) {
        router.push("/login");
        return;
      }
      setUser((userResult.data as any).user);

      const clientsResult = await apiClient.getClients();
      if (clientsResult.data) {
        setClients((clientsResult.data as any).clients || []);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSave = async (values: any) => {
    setSaving(true);

    // Normalize phone
    const normalizedPhone = normalizePhoneNumber(values.phone);
    const payload = { ...values, phone: normalizedPhone || values.phone };

    if (editingClient) {
      const result = await apiClient.updateClient(editingClient.id, payload);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("Client updated");
        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? { ...c, ...payload } : c))
        );
        closeModal();
      }
    } else {
      const result = await apiClient.createClient(payload);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("Client created");
        const newClient = (result.data as any).client || { ...payload, id: `temp_${Date.now()}` };
        setClients((prev) => [...prev, newClient]);
        closeModal();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (clientId: string) => {
    const result = await apiClient.deleteClient(clientId);
    if (result.error) {
      message.error(result.error);
    } else {
      message.success("Client deleted");
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    form.setFieldsValue({
      ...client,
      phone: formatPhoneNumber(client.phone),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    form.resetFields();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-0">Customer / Client Profiles</Title>
          <Text type="secondary">Manage your clients and their information</Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={() => {
              downloadExcel(
                clients.map((c) => ({
                  Name: c.name,
                  Email: c.email || "",
                  Phone: c.phone ? formatPhoneNumber(c.phone) : "",
                  Company: c.company || "",
                  Address: c.address || "",
                  Notes: c.notes || "",
                })),
                undefined,
                "clients"
              );
            }}
          >
            Download Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            size="large"
          >
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserOutlined className="text-blue-500 text-lg" />
            </div>
            <div>
              <Text type="secondary" className="text-xs block">Total Clients</Text>
              <Text strong className="text-xl">{clients.length}</Text>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BankOutlined className="text-green-500 text-lg" />
            </div>
            <div>
              <Text type="secondary" className="text-xs block">Companies</Text>
              <Text strong className="text-xl">
                {new Set(clients.filter((c) => c.company).map((c) => c.company)).size}
              </Text>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MailOutlined className="text-orange-500 text-lg" />
            </div>
            <div>
              <Text type="secondary" className="text-xs block">With Email</Text>
              <Text strong className="text-xl">{clients.filter((c) => c.email).length}</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search clients by name, email, or company..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          size="large"
          allowClear
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card>
          <Empty description={searchQuery ? "No clients match your search" : "No clients yet. Add your first client!"}>
            {!searchQuery && (
              <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Add First Client
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              size="small"
              className="hover:shadow-md transition-shadow"
              actions={[
                <Tooltip key="edit" title="Edit">
                  <EditOutlined onClick={() => openEditModal(client)} />
                </Tooltip>,
                <Popconfirm
                  key="delete"
                  title="Delete this client?"
                  onConfirm={() => handleDelete(client.id)}
                >
                  <DeleteOutlined className="text-red-500" />
                </Popconfirm>,
              ]}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Text strong className="block">{client.name}</Text>
                    {client.company && (
                      <Tag color="blue" className="text-xs">{client.company}</Tag>
                    )}
                  </div>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MailOutlined /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <PhoneOutlined /> {formatPhoneNumber(client.phone)}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <EnvironmentOutlined /> {client.address}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        title={editingClient ? "Edit Client" : "Add New Client"}
        open={isModalOpen}
        onCancel={closeModal}
        forceRender
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label="Client Name"
              rules={[{ required: true, message: "Please enter a name" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Jane Smith" size="large" />
            </Form.Item>
            <Form.Item name="company" label="Company">
              <Input prefix={<BankOutlined />} placeholder="Smith Construction" size="large" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: "email", message: "Enter a valid email" }]}
            >
              <Input prefix={<MailOutlined />} placeholder="jane@company.com" size="large" />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="e.g. +1 312 285 6334"
                size="large"
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  if (formatted) {
                    form.setFieldsValue({ phone: formatted });
                  }
                }}
              />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Address">
            <Input prefix={<EnvironmentOutlined />} placeholder="123 Main St, City, State" size="large" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes about this client..." />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingClient ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
