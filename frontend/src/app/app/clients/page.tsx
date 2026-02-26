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
  App,
  Spin,
  Typography,
  Empty,
  Tooltip,
  Popconfirm,
  Tag,
  Divider,
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
  CheckCircleOutlined,
} from "@ant-design/icons";
import { normalizePhoneNumber, formatPhoneNumber } from "@/lib/phoneUtils";
import { apiClient } from "@/lib/api/client";
import { downloadExcel } from "@/lib/downloadExcel";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── LOV constants ─────────────────────────────────────────────────────────────
const ROLE_OPTIONS = ["Owner", "Manager", "Purchasing"];
const APPROVAL_OPTIONS = ["Online", "Email", "In-Person"];

const roleColors: Record<string, string> = {
  Owner: "purple",
  Manager: "blue",
  Purchasing: "orange",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  company?: string;
  role?: string;
  projectAddress?: string;
  billingAddress?: string;
  preferredApprovalMethod?: string;
  notes?: string;
  createdAt?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
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
      if (userResult.error || !userResult.data) { router.push("/login"); return; }
      setUser((userResult.data as any).user);
      const clientsResult = await apiClient.getClients();
      if (clientsResult.data) setClients((clientsResult.data as any).clients || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSave = async (values: any) => {
    setSaving(true);
    const normalizedPhone = normalizePhoneNumber(values.phone);
    const normalizedAlt   = normalizePhoneNumber(values.altPhone);
    const payload = {
      ...values,
      phone:    normalizedPhone || values.phone,
      altPhone: normalizedAlt   || values.altPhone,
    };

    if (editingClient) {
      const result = await apiClient.updateClient(editingClient.id, payload);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("Customer updated");
        setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...payload } : c)));
        closeModal();
      }
    } else {
      const result = await apiClient.createClient(payload);
      if (result.error) {
        message.error(result.error);
      } else {
        message.success("Customer created");
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
      message.success("Customer deleted");
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    form.setFieldsValue({
      ...client,
      phone:    formatPhoneNumber(client.phone),
      altPhone: formatPhoneNumber(client.altPhone),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    form.resetFields();
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} className="mb-0">Customer / Client Profiles</Title>
          <Text type="secondary">Manage your customers and their contact information</Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={<DownloadOutlined />}
            size="large"
            onClick={() => {
              downloadExcel(
                clients.map((c) => ({
                  "Customer ID":              c.id,
                  "Contact Name":             c.name,
                  "Company Name":             c.company || "",
                  "Role":                     c.role || "",
                  "Phone Number":             c.phone ? formatPhoneNumber(c.phone) : "",
                  "Alt Phone Number":         c.altPhone ? formatPhoneNumber(c.altPhone) : "",
                  "Email":                    c.email || "",
                  "Project Address":          c.projectAddress || "",
                  "Billing Address":          c.billingAddress || "",
                  "Preferred Approval Method": c.preferredApprovalMethod || "",
                  "Notes / Preferences":      c.notes || "",
                })),
                undefined,
                "customers"
              );
            }}
          >
            Download Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="large">
            Add Customer
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
              <Text type="secondary" className="text-xs block">Total Customers</Text>
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
          placeholder="Search by name, email, or company..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          size="large"
          allowClear
        />
      </div>

      {/* Customers Grid */}
      {filteredClients.length === 0 ? (
        <Card>
          <Empty description={searchQuery ? "No customers match your search" : "No customers yet. Add your first customer!"}>
            {!searchQuery && (
              <Button type="primary" onClick={() => setIsModalOpen(true)}>Add First Customer</Button>
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
                  title="Delete this customer?"
                  onConfirm={() => handleDelete(client.id)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <DeleteOutlined className="text-red-500" />
                </Popconfirm>,
              ]}
            >
              <div className="space-y-2">
                {/* Avatar + name + company */}
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Text strong className="block truncate">{client.name}</Text>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {client.company && <Tag color="blue" className="text-xs m-0">{client.company}</Tag>}
                      {client.role && <Tag color={roleColors[client.role] || "default"} className="text-xs m-0">{client.role}</Tag>}
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MailOutlined /> <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <PhoneOutlined /> {formatPhoneNumber(client.phone)}
                    {client.altPhone && <span className="text-gray-400">· Alt: {formatPhoneNumber(client.altPhone)}</span>}
                  </div>
                )}
                {client.billingAddress && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <EnvironmentOutlined /> <span className="truncate">{client.billingAddress}</span>
                  </div>
                )}
                {client.preferredApprovalMethod && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircleOutlined /> Approval: {client.preferredApprovalMethod}
                  </div>
                )}

                {/* Customer ID */}
                <div className="pt-1 border-t border-gray-100">
                  <Text type="secondary" className="text-[10px]">ID: {client.id.slice(0, 12)}…</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        title={editingClient ? "Edit Customer" : "Add New Customer"}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width={680}
        destroyOnHidden
      >
        {/* Read-only Customer ID when editing */}
        {editingClient && (
          <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg">
            <Text type="secondary" className="text-xs block">Customer ID</Text>
            <Text code className="text-xs">{editingClient.id}</Text>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSave}>
          {/* Row 1: Contact Name + Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label="Contact Name"
              rules={[{ required: true, message: "Contact name is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Jane Smith" size="large" />
            </Form.Item>
            <Form.Item name="company" label="Company Name">
              <Input prefix={<BankOutlined />} placeholder="Smith Construction" size="large" />
            </Form.Item>

            {/* Row 2: Role + Preferred Approval Method */}
            <Form.Item name="role" label="Role">
              <Select size="large" placeholder="Select role" allowClear>
                {ROLE_OPTIONS.map((r) => (
                  <Select.Option key={r} value={r}>{r}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="preferredApprovalMethod" label="Preferred Approval Method">
              <Select size="large" placeholder="Select method" allowClear>
                {APPROVAL_OPTIONS.map((a) => (
                  <Select.Option key={a} value={a}>{a}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Row 3: Phone + Alt Phone */}
            <Form.Item name="phone" label="Phone Number">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+1 312 285 6334"
                size="large"
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const f = formatPhoneNumber(e.target.value);
                  if (f) form.setFieldsValue({ phone: f });
                }}
              />
            </Form.Item>
            <Form.Item name="altPhone" label="Alt Phone Number">
              <Input
                prefix={<PhoneOutlined />}
                placeholder="+1 312 285 6335"
                size="large"
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const f = formatPhoneNumber(e.target.value);
                  if (f) form.setFieldsValue({ altPhone: f });
                }}
              />
            </Form.Item>

            {/* Row 4: Email (full width) */}
            <Form.Item
              name="email"
              label="Email"
              className="md:col-span-2"
              rules={[{ type: "email", message: "Enter a valid email" }]}
            >
              <Input prefix={<MailOutlined />} placeholder="jane@company.com" size="large" />
            </Form.Item>
          </div>

          {/* Addresses */}
          <Form.Item name="projectAddress" label="Project Address">
            <Input prefix={<EnvironmentOutlined />} placeholder="123 Site St, City, State" size="large" />
          </Form.Item>
          <Form.Item name="billingAddress" label="Billing Address">
            <Input prefix={<EnvironmentOutlined />} placeholder="456 Billing Ave, City, State" size="large" />
          </Form.Item>

          <Form.Item name="notes" label="Notes / Preferences">
            <TextArea rows={3} placeholder="Preferences, special instructions, or notes..." />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingClient ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
