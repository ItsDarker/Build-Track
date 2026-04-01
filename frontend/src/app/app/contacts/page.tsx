'use client';

import ProRoute from "@/components/auth/ProRoute";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Avatar,
  Empty,
  Spin,
  Tooltip,
  Space,
  Popconfirm,
  Segmented,
  Drawer,
  Divider,
  Typography,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  SearchOutlined,
  ExportOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  type: 'TEAM' | 'VENDOR' | 'CLIENT' | 'SUBCONTRACTOR';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt?: string;
}

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TEAM' | 'VENDOR' | 'CLIENT' | 'SUBCONTRACTOR'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch team members
      const teamRes = await fetch('/backend-api/teams/members');
      const teamData = await teamRes.json();
      setTeamMembers(teamData.members || []);

      // Fetch clients
      const clientsRes = await fetch('/backend-api/clients');
      const clientsData = await clientsRes.json();

      // Combine all contacts
      const allContacts: Contact[] = [];

      // Add team members
      if (Array.isArray(teamData.members)) {
        teamData.members.forEach((m: TeamMember) => {
          allContacts.push({
            id: `team-${m.id}`,
            name: m.name || m.email.split('@')[0],
            email: m.email,
            role: m.role,
            type: 'TEAM',
            company: 'BuildTrack Internal',
          });
        });
      }

      // Add clients
      if (Array.isArray(clientsData.clients)) {
        clientsData.clients.forEach((c: any) => {
          allContacts.push({
            id: `client-${c.id}`,
            name: c.name,
            email: c.email || '',
            phone: c.phone,
            company: c.company,
            address: c.address,
            city: c.city,
            state: c.state,
            zipCode: c.zipCode,
            notes: c.notes,
            type: 'CLIENT',
          });
        });
      }

      setContacts(allContacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (contact.company && contact.company.toLowerCase().includes(searchText.toLowerCase())) ||
        (contact.phone && contact.phone.includes(searchText));

      const matchesType = filterType === 'ALL' || contact.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [contacts, searchText, filterType]);

  const getContactTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TEAM: 'blue',
      VENDOR: 'orange',
      CLIENT: 'green',
      SUBCONTRACTOR: 'purple',
    };
    return colors[type] || 'default';
  };

  const getContactTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      TEAM: <TeamOutlined />,
      VENDOR: <BankOutlined />,
      CLIENT: <UserOutlined />,
      SUBCONTRACTOR: <UserOutlined />,
    };
    return icons[type];
  };

  const handleAddContact = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingId(contact.id);
    form.setFieldsValue(contact);
    setIsModalOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDrawerOpen(true);
  };

  const handleSaveContact = async (values: any) => {
    try {
      if (editingId) {
        // Update existing contact
        if (editingId.startsWith('client-')) {
          const clientId = editingId.replace('client-', '');
          await fetch(`/backend-api/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
        }
      } else {
        // Create new contact
        if (values.type === 'CLIENT') {
          await fetch('/backend-api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      if (id.startsWith('client-')) {
        const clientId = id.replace('client-', '');
        await fetch(`/backend-api/clients/${clientId}`, {
          method: 'DELETE',
        });
      }
      fetchData();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleExport = () => {
    // Prepare CSV data
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Type', 'Address', 'Notes'];
    const rows = filteredContacts.map((c) => [
      c.name,
      c.email,
      c.phone || '',
      c.company || '',
      c.type,
      `${c.address || ''} ${c.city || ''} ${c.state || ''} ${c.zipCode || ''}`.trim(),
      c.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
      ),
    ].join('\n');

    // Download CSV
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', 'contacts.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const columns: ColumnsType<Contact> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      render: (text, record) => (
        <a onClick={() => handleViewContact(record)}>
          <Space>
            <Avatar size="small" icon={getContactTypeIcon(record.type)} />
            {text}
          </Space>
        </a>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
      render: (text) => (
        <a href={`mailto:${text}`}>
          <MailOutlined /> {text}
        </a>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: '15%',
      render: (text) => text ? <a href={`tel:${text}`}><PhoneOutlined /> {text}</a> : '-',
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      width: '15%',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      render: (type) => <Tag color={getContactTypeColor(type)}>{type}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<FileOutlined />}
              onClick={() => handleViewContact(record)}
            />
          </Tooltip>
          {!record.id.startsWith('team-') && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditContact(record)}
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Popconfirm
                  title="Delete Contact"
                  description="Are you sure you want to delete this contact?"
                  onConfirm={() => handleDeleteContact(record.id)}
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ProRoute>
      <>
      <div className="mb-6">
        <Title level={2}>Contacts Directory</Title>
        <Text type="secondary">
          Manage all your contacts: team members, clients, vendors, and subcontractors
        </Text>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search by name, email, phone, or company..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              size="large"
            />
          </Col>
          <Col>
            <Segmented
              value={filterType}
              onChange={(value: string | number) => setFilterType(value as 'ALL' | 'TEAM' | 'VENDOR' | 'CLIENT' | 'SUBCONTRACTOR')}
              options={[
                { label: 'All', value: 'ALL' },
                { label: 'Team', value: 'TEAM' },
                { label: 'Clients', value: 'CLIENT' },
                { label: 'Vendors', value: 'VENDOR' },
                { label: 'Subcontractors', value: 'SUBCONTRACTOR' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-center">
              <Title level={2} className="mb-0">{contacts.filter(c => c.type === 'TEAM').length}</Title>
              <Text type="secondary">Team Members</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-center">
              <Title level={2} className="mb-0">{contacts.filter(c => c.type === 'CLIENT').length}</Title>
              <Text type="secondary">Clients</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-center">
              <Title level={2} className="mb-0">{contacts.filter(c => c.type === 'VENDOR').length}</Title>
              <Text type="secondary">Vendors</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-center">
              <Title level={2} className="mb-0">{contacts.filter(c => c.type === 'SUBCONTRACTOR').length}</Title>
              <Text type="secondary">Subcontractors</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Toolbar */}
      <Card className="mb-6">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddContact}
          >
            Add Contact
          </Button>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </Space>
      </Card>

      {/* Contacts Table */}
      <Card>
        {filteredContacts.length === 0 ? (
          <Empty description="No contacts found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredContacts}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        )}
      </Card>

      {/* Add/Edit Contact Modal */}
      <Modal
        title={editingId ? 'Edit Contact' : 'Add New Contact'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveContact}
          initialValues={{ type: 'CLIENT' }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="john@example.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="+1 (555) 123-4567" />
          </Form.Item>

          <Form.Item
            name="company"
            label="Company"
          >
            <Input placeholder="ABC Construction" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Contact Type"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'Client', value: 'CLIENT' },
                { label: 'Vendor', value: 'VENDOR' },
                { label: 'Subcontractor', value: 'SUBCONTRACTOR' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input placeholder="123 Main St" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input placeholder="New York" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="state" label="State">
                <Input placeholder="NY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="zipCode"
            label="Zip Code"
          >
            <Input placeholder="10001" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Additional information..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save Contact
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Contact Detail Drawer */}
      <Drawer
        title={selectedContact?.name}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={400}
      >
        {selectedContact && (
          <div className="space-y-6">
            <div>
              <Text type="secondary" className="block mb-2">Type</Text>
              <Tag color={getContactTypeColor(selectedContact.type)}>
                {selectedContact.type}
              </Tag>
            </div>

            {selectedContact.email && (
              <div>
                <Text type="secondary" className="block mb-2">Email</Text>
                <a href={`mailto:${selectedContact.email}`}>
                  <MailOutlined /> {selectedContact.email}
                </a>
              </div>
            )}

            {selectedContact.phone && (
              <div>
                <Text type="secondary" className="block mb-2">Phone</Text>
                <a href={`tel:${selectedContact.phone}`}>
                  <PhoneOutlined /> {selectedContact.phone}
                </a>
              </div>
            )}

            {selectedContact.company && (
              <div>
                <Text type="secondary" className="block mb-2">Company</Text>
                <Text>{selectedContact.company}</Text>
              </div>
            )}

            {(selectedContact.address || selectedContact.city || selectedContact.state || selectedContact.zipCode) && (
              <div>
                <Text type="secondary" className="block mb-2">Address</Text>
                <Text>
                  {selectedContact.address} {selectedContact.city} {selectedContact.state} {selectedContact.zipCode}
                </Text>
              </div>
            )}

            {selectedContact.notes && (
              <div>
                <Text type="secondary" className="block mb-2">Notes</Text>
                <Text>{selectedContact.notes}</Text>
              </div>
            )}

            {!selectedContact.id.startsWith('team-') && (
              <>
                <Divider />
                <Space>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      handleEditContact(selectedContact);
                      setDrawerOpen(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete Contact"
                    description="Are you sure?"
                    onConfirm={() => {
                      handleDeleteContact(selectedContact.id);
                      setDrawerOpen(false);
                    }}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>
    </>
    </ProRoute>
  );
}