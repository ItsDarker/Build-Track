'use client';

import ProRoute from "@/components/auth/ProRoute";

import React, { useState, useEffect } from 'react';
import { Card, Tabs, Empty, Button, Form, Input, Select, Tag, List, Badge, Typography, message, Skeleton, Space } from 'antd';
import { 
  QuestionCircleOutlined, 
  BookOutlined, 
  PhoneOutlined, 
  PlusOutlined, 
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import Link from 'next/link';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface TicketMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  author?: {
    displayName?: string;
    email?: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  messages?: TicketMessage[];
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/backend-api/support/tickets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await fetch(`/backend-api/support/tickets/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket);
      }
    } catch (err) {
      console.error('Fetch ticket details error:', err);
    }
  };

  const handleCreateTicket = async (values: any) => {
    setSubmitting(true);
    try {
      const res = await fetch('/backend-api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: 'include'
      });
      if (res.ok) {
        message.success('Ticket submitted successfully!');
        form.resetFields();
        setShowCreateForm(false);
        fetchTickets();
      } else {
        message.error('Failed to submit ticket');
      }
    } catch (err) {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/backend-api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
        credentials: 'include'
      });
      if (res.ok) {
        setReplyContent('');
        fetchTicketDetails(activeTicket.id);
      }
    } catch (err) {
      message.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'blue';
      case 'IN_PROGRESS': return 'orange';
      case 'RESOLVED': return 'green';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'red-inverse';
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'blue';
      default: return 'blue';
    }
  };

  const renderTicketItem = (ticket: Ticket) => (
    <List.Item
      key={ticket.id}
      className={`cursor-pointer hover:bg-gray-50 transition-colors p-4 rounded-lg border mb-2 ${activeTicket?.id === ticket.id ? 'border-orange-300 bg-orange-50/20' : 'border-gray-100'}`}
      onClick={() => fetchTicketDetails(ticket.id)}
    >
      <div className="w-full">
        <div className="flex justify-between items-start mb-1">
          <Text strong className="text-sm truncate mr-2">{ticket.subject}</Text>
          <Tag color={getStatusColor(ticket.status)} size="small" className="m-0 text-[10px] uppercase font-bold">{ticket.status}</Tag>
        </div>
        <div className="flex justify-between items-center text-[11px] text-gray-400">
          <Space>
            <span>#{ticket.id.slice(-6).toUpperCase()}</span>
            <span>•</span>
            <Tag color={getPriorityColor(ticket.priority)} size="small" className="m-0 text-[9px] flex items-center leading-none px-1.5 py-0.5">{ticket.priority}</Tag>
          </Space>
          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </List.Item>
  );

  const tabItems = [
    {
      key: 'tickets',
      label: (
        <Space>
          <QuestionCircleOutlined />
          My Tickets
        </Space>
      ),
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Sidebar: Ticket List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <Title level={5} className="m-0">Your Support Tickets</Title>
              <Button 
                type="primary" 
                size="small" 
                icon={<PlusOutlined />} 
                className="bg-orange-500"
                onClick={() => { setShowCreateForm(true); setActiveTicket(null); }}
              >
                New
              </Button>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto pr-2">
              {loading && <Skeleton active paragraph={{ rows: 4 }} />}
              {!loading && tickets.length === 0 && (
                <Empty description="No tickets yet" className="py-12 bg-white rounded-lg border border-dashed" />
              )}
              <List
                dataSource={tickets}
                renderItem={renderTicketItem}
                split={false}
              />
            </div>
          </div>

          {/* Main Content: Ticket Details or Form */}
          <div className="lg:col-span-8">
            {showCreateForm ? (
              <Card 
                title={<Title level={4} className="m-0">Submit New Support Ticket</Title>}
                extra={<Button type="text" onClick={() => setShowCreateForm(false)}>Cancel</Button>}
                className="shadow-sm border-orange-100"
              >
                <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
                  <Form.Item name="subject" label="Subject" required rules={[{ required: true, message: 'Please enter a subject' }]}>
                    <Input placeholder="Brief summary of the issue" />
                  </Form.Item>
                  <Form.Item name="priority" label="Priority" initialValue="MEDIUM">
                    <Select options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'CRITICAL', label: 'Critical' },
                    ]} />
                  </Form.Item>
                  <Form.Item name="description" label="Description" required rules={[{ required: true, message: 'Please describe your request' }]}>
                    <TextArea rows={5} placeholder="Provide details about your question or issue..." />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={submitting} className="bg-orange-500 h-10 text-lg font-medium">
                    Submit Ticket
                  </Button>
                </Form>
              </Card>
            ) : activeTicket ? (
              <Card 
                className="shadow-sm border-gray-100 flex flex-col h-full"
                title={
                  <div className="flex items-center justify-between">
                    <div>
                      <Title level={4} className="m-0">{activeTicket.subject}</Title>
                      <Text type="secondary" className="text-xs">Ticket #{activeTicket.id.toUpperCase()}</Text>
                    </div>
                    <Tag color={getStatusColor(activeTicket.status)}>{activeTicket.status}</Tag>
                  </div>
                }
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow max-h-[450px] overflow-y-auto mb-4 space-y-4 pr-2">
                    {activeTicket.messages?.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.isAdmin ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-100'}`}>
                          <div className="flex justify-between items-center mb-1 gap-4">
                            <Text strong className="text-xs">{msg.isAdmin ? 'Support Team' : 'You'}</Text>
                            <Text type="secondary" className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString()}</Text>
                          </div>
                          <p className="text-sm m-0 whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <TextArea 
                      rows={3} 
                      placeholder="Type your reply..." 
                      className="mb-2"
                      value={replyContent}
                      onChange={(e: any) => setReplyContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="primary" 
                        icon={<SendOutlined />} 
                        className="bg-orange-500"
                        onClick={handleSendReply}
                        loading={submitting}
                        disabled={!replyContent.trim()}
                      >
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center py-24 bg-gray-50/50 border-dashed">
                <MessageOutlined style={{ fontSize: 48, color: '#d1d5db' }} className="mb-4" />
                <Title level={4} className="text-gray-400 m-0">Select a ticket to view conversation</Title>
                <Text type="secondary">Or click 'New' to start a new inquiry</Text>
              </Card>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'kb',
      label: (
        <Space>
          <BookOutlined />
          Knowledge Base
        </Space>
      ),
      children: (
        <Card>
          <div className="space-y-6">
            <div>
              <Title level={4} className="mb-4">Knowledge Base</Title>
              <p className="text-gray-600 mb-6">
                BuildTrack Knowledge Base is being populated with comprehensive guides for all 16 workflow modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Getting Started</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Learn the basics of BuildTrack, create projects, and invite team members.
                </p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• Creating Your First Project</li>
                  <li>• Understanding Roles & Permissions</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Modules Guide</h4>
                <p className="text-sm text-gray-600 mb-3">
                  In-depth guides for all 16 BuildTrack modules.
                </p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• CRM Leads (crm-leads)</li>
                  <li>• Project Planning</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      ),
    },
    {
      key: 'contact',
      label: (
        <Space>
          <PhoneOutlined />
          Contact Support
        </Space>
      ),
      children: (
        <Card>
          <div className="max-w-2xl">
            <Title level={4} className="mb-4">Contact Our Support Team</Title>
            <p className="text-gray-600 mb-6">
              For urgent issues or complex problems, reach out directly to our support team.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📧 Email Support</h4>
                <p className="text-gray-600 text-sm">support@buildtrack.com</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📞 Phone Support</h4>
                <p className="text-gray-600 text-sm">(555) 123-4567</p>
              </div>
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <ProRoute>
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold mb-2">Support Center</h1>
            <p className="text-gray-600">
              Get help with BuildTrack features, troubleshooting, and best practices
            </p>
          </div>
          <Link href="/app/dashboard">
            <Button icon={<ClockCircleOutlined />}>Return to Dashboard</Button>
          </Link>
        </div>

        <Tabs items={tabItems} defaultActiveKey="tickets" />
      </div>
    </div>
    </ProRoute>
  );
}