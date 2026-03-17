'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Spin, message as antMessage, Alert } from 'antd';
import { apiClient } from '@/lib/api/client';
import { AssignableUser } from '@/types/messaging';

interface GroupCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
  isAllowedToCreate?: boolean;
}

const GroupCreationModal: React.FC<GroupCreationModalProps> = ({
  open,
  onClose,
  onSuccess,
  isAllowedToCreate = true,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load assignable users
  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers();
    }
  }, [open, users.length]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiClient.getAssignableUsers?.();
      if (response?.data) {
        const userData = response.data as any;
        const usersList = userData.users || userData || [];
        setUsers(Array.isArray(usersList) ? usersList : []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      antMessage.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (values: { name: string; description?: string; memberIds: string[] }) => {
    try {
      setLoading(true);

      // Ensure current user is in the member list
      const allMemberIds = Array.from(new Set([...values.memberIds]));

      const response = await apiClient.createConversation({
        name: values.name.trim(),
        description: values.description?.trim(),
        isGroup: true,
        memberIds: allMemberIds,
      });

      if (response.error) {
        antMessage.error(response.error);
        return;
      }

      const data = response.data as { conversation: { id: string } };
      antMessage.success('Group created successfully!');
      form.resetFields();
      onSuccess(data.conversation.id);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      antMessage.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Group Chat"
      open={open}
      onCancel={onClose}
      width={500}
      footer={null}
      destroyOnHidden
    >
      {!isAllowedToCreate ? (
        <Alert
          type="error"
          message="Permission Denied"
          description="Only Project Managers and administrators can create group chats."
          showIcon
        />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            label="Group Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter a group name' },
              { max: 100, message: 'Group name must be 100 characters or less' },
            ]}
          >
            <Input placeholder="Project Team, Stakeholders, etc." />
          </Form.Item>

          <Form.Item
            label="Description (optional)"
            name="description"
            rules={[
              { max: 500, message: 'Description must be 500 characters or less' },
            ]}
          >
            <Input.TextArea placeholder="What is this group about?" rows={3} />
          </Form.Item>

          <Form.Item
            label="Members"
            name="memberIds"
            rules={[
              { required: true, message: 'Please select at least one member' },
              {
                validator: (_, value) => {
                  if (value && value.length > 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Select at least one member'));
                },
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Search and select members..."
              disabled={loadingUsers}
              notFoundContent={loadingUsers ? <Spin size="small" /> : undefined}
              optionLabelProp="label"
              options={users.map((user) => ({
                value: user.id,
                label: (
                  <div>
                    <p className="font-medium">{user.displayName || user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                ),
              }))}
              filterOption={(input: string, option: any) => {
                const user = users.find((u) => u.id === option?.value);
                if (!user) return false;
                const searchStr = input.toLowerCase();
                return (
                  user.displayName?.toLowerCase().includes(searchStr) ||
                  user.name?.toLowerCase().includes(searchStr) ||
                  user.email.toLowerCase().includes(searchStr)
                );
              }}
            />
          </Form.Item>

          <div className="flex gap-2 justify-end">
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Create Group
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default GroupCreationModal;
