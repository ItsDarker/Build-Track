"use client";

import React, { useState, useEffect } from "react";
import { Card, Table, Button, Empty, Spin, Modal, Form, Input, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  data?: any;
}

export default function BasicCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/clients");
      if (res.data) {
        setCustomers((res.data as any).clients || (res.data as any).records || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      message.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingCustomer) {
        await apiClient.put(`/clients/${editingCustomer.id}`, values);
        message.success("Customer updated successfully");
      } else {
        await apiClient.post("/clients", values);
        message.success("Customer added successfully");
      }
      setModalOpen(false);
      await fetchCustomers();
    } catch (error) {
      console.error("Failed to save customer:", error);
      message.error("Failed to save customer");
    }
  };

  const handleDelete = async (customerId: string) => {
    Modal.confirm({
      title: "Delete Customer",
      content: "Are you sure you want to delete this customer?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/clients/${customerId}`);
          message.success("Customer deleted successfully");
          await fetchCustomers();
        } catch (error) {
          console.error("Failed to delete customer:", error);
          message.error("Failed to delete customer");
        }
      },
    });
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Company", dataIndex: "company", key: "company" },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Customer) => (
        <div className="flex gap-2">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCustomer(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-white p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer relationships</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCustomer}>
          Add Customer
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <Card>
          {customers.length === 0 ? (
            <Empty description="No customers added yet" />
          ) : (
            <Table dataSource={customers} columns={columns} pagination={{ pageSize: 10 }} />
          )}
        </Card>
      )}

      {/* Modal for adding/editing customers */}
      <Modal
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="Customer name" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input type="email" placeholder="Email address" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Phone number" />
          </Form.Item>

          <Form.Item label="Company" name="company">
            <Input placeholder="Company name" />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Address" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
