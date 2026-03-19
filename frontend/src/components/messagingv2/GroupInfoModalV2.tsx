'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Avatar, Typography, List, Divider, Space, Tag, Button, App, Form, Input, Select } from 'antd';
import { ConversationWithMembersV2 } from '@/types/messagingv2';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api/client';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    conversation: ConversationWithMembersV2;
    currentUserId: string;
    onUpdate?: () => void;
}

export default function GroupInfoModalV2({ open, onClose, conversation, currentUserId, onUpdate }: Props) {
    const { message } = App.useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(conversation.name || '');
    const [editIconUrl, setEditIconUrl] = useState(conversation.iconUrl || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setIsEditing(false);
            setEditName(conversation.name || '');
            setEditIconUrl(conversation.iconUrl || '');
        }
    }, [open, conversation]);

    const isOwner = currentUserId === conversation.createdById;
    const currentMember = conversation.members.find(m => m.userId === currentUserId);
    const isAdmin = currentMember?.role === 'ADMIN';
    const canManage = isOwner || isAdmin;

    if (!conversation.isGroup) return null;

    const handleSaveDetails = async () => {
        try {
            setIsSaving(true);
            await apiClient.updateConversation(conversation.id, { name: editName, iconUrl: editIconUrl });
            message.success('Group details updated');
            setIsEditing(false);
            onUpdate?.();
        } catch (err: any) {
            message.error(err.message || 'Failed to update details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await apiClient.updateConversationMemberRole(conversation.id, userId, newRole);
            message.success('Role updated');
            onUpdate?.();
        } catch (err: any) {
            message.error(err.message || 'Failed to update role');
        }
    };

    return (
        <Modal
            title="Group Info"
            open={open}
            onCancel={onClose}
            footer={null}
            width={500}
            className="group-info-modal"
        >
            <div className="flex flex-col items-center py-6">
                {isEditing ? (
                    <div className="w-full px-8">
                        <Form layout="vertical">
                            <Form.Item label="Group Icon URL">
                                <Input value={editIconUrl} onChange={e => setEditIconUrl(e.target.value)} placeholder="https://..." />
                            </Form.Item>
                            <Form.Item label="Group Name">
                                <Input value={editName} onChange={e => setEditName(e.target.value)} />
                            </Form.Item>
                            <div className="flex gap-2 justify-end">
                                <Button icon={<CloseOutlined />} onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={handleSaveDetails}>Save</Button>
                            </div>
                        </Form>
                    </div>
                ) : (
                    <>
                        <Avatar size={80} src={conversation.iconUrl} className={!conversation.iconUrl ? "bg-blue-600 text-2xl mb-4" : "mb-4"}>
                            {!conversation.iconUrl && (conversation.name || 'G')[0].toUpperCase()}
                        </Avatar>
                        <div className="flex items-center justify-center gap-2 w-full pl-8">
                            <Title level={4} className="!mb-1 text-center">{conversation.name || 'Group Chat'}</Title>
                            {canManage && <Button type="text" icon={<EditOutlined />} onClick={() => setIsEditing(true)} />}
                        </div>
                        <Text type="secondary" className="block text-center w-full pr-8">
                            Created {dayjs(conversation.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                        </Text>
                    </>
                )}
            </div>

            <Divider className="my-2" />

            <div className="px-2">
                <div className="flex justify-between items-center mb-4 mt-2">
                    <Text strong className="text-gray-700 dark:text-gray-300">
                        Members ({conversation.members.length})
                    </Text>
                </div>

                <List
                    dataSource={conversation.members}
                    renderItem={(member) => (
                        <List.Item className="border-b-0 px-0 py-2">
                            <List.Item.Meta
                                avatar={<Avatar src={member.user.avatarUrl} size={40} />}
                                title={
                                    <Space>
                                        <span className="font-medium">{member.user.displayName || member.user.name}</span>
                                        {member.userId === conversation.createdById && <Tag color="blue">Owner</Tag>}
                                        {member.userId !== conversation.createdById && member.role === 'ADMIN' && <Tag color="cyan">Admin</Tag>}
                                        {member.role === 'READ_ONLY' && <Tag color="orange">Read-Only</Tag>}
                                    </Space>
                                }
                                description={<span className="text-xs">{member.user.email}</span>}
                            />
                            {canManage && member.userId !== conversation.createdById && member.userId !== currentUserId && (
                                <Space>
                                    <Select
                                        size="small"
                                        value={member.role || 'MEMBER'}
                                        onChange={(val) => handleRoleChange(member.userId, val)}
                                        options={[
                                            { label: 'Admin', value: 'ADMIN' },
                                            { label: 'Member', value: 'MEMBER' },
                                            { label: 'Read-Only', value: 'READ_ONLY' },
                                        ]}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        onClick={async () => {
                                            try {
                                                await apiClient.removeConversationMember(conversation.id, member.userId);
                                                message.success('Member removed');
                                                onUpdate?.();
                                                onClose();
                                            } catch (err: any) {
                                                message.error(err.message || 'Failed to remove member');
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </Space>
                            )}
                        </List.Item>
                    )}
                    style={{ maxHeight: '300px', overflow: 'auto' }}
                />
            </div>
        </Modal>
    );
}
