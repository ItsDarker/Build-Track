"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Modal, Spin, Empty, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { getModuleBySlug, getAllModules } from "@/config/buildtrack.config";
import { useUser } from "@/lib/context/UserContext";
import { canAccessModule } from "@/config/rbac";

interface Module {
  name: string;
  slug: string;
  description?: string;
  fields?: any[];
  displayName?: string;
  color?: string;
}

interface ModuleRecord {
  id: string;
  moduleSlug: string;
  data: any;
}

const MODULE_COLORS: Record<string, string> = {
  "crm-leads": "bg-blue-50 border-blue-200",
  "design-configurator": "bg-purple-50 border-purple-200",
  "quoting-contracts": "bg-green-50 border-green-200",
  "approval-workflow": "bg-yellow-50 border-yellow-200",
  "production-scheduling": "bg-orange-50 border-orange-200",
  "delivery-installation": "bg-red-50 border-red-200",
  "work-orders": "bg-cyan-50 border-cyan-200",
};

export default function BasicTasksPage() {
  const user = useUser();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ModuleRecord | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(false);

  useEffect(() => {
    // Get all modules that user can access
    const allModules = getAllModules().filter((mod) =>
      canAccessModule(user.role.name, mod.slug)
    );

    // Include work-orders separately
    const workOrdersModule = getModuleBySlug("work-orders");
    if (workOrdersModule && canAccessModule(user.role.name, "work-orders")) {
      allModules.push(workOrdersModule);
    }

    setModules(allModules);
    setLoading(false);
  }, [user.role.name]);

  const handleModuleClick = async (module: Module) => {
    setSelectedModule(module);
    setRecordLoading(true);
    setEditingRecord(null);
    setFormModalOpen(false);

    try {
      const res = await apiClient.get(`/modules/${module.slug}/records`);
      if (res.data) {
        setRecords((res.data as any).records || []);
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
      message.error(`Failed to load ${module.name} records`);
    } finally {
      setRecordLoading(false);
    }

    setModalOpen(true);
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setFormModalOpen(true);
  };

  const handleEditRecord = (record: ModuleRecord) => {
    setEditingRecord(record);
    setFormModalOpen(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    Modal.confirm({
      title: "Delete Record",
      content: "Are you sure you want to delete this record?",
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          if (!selectedModule) return;
          await apiClient.delete(`/modules/${selectedModule.slug}/records/${recordId}`);
          message.success("Record deleted successfully");
          await handleModuleClick(selectedModule);
        } catch (error) {
          console.error("Failed to delete record:", error);
          message.error("Failed to delete record");
        }
      },
    });
  };

  const handleSaveRecord = async (formData: any) => {
    try {
      if (!selectedModule) return;

      if (editingRecord) {
        await apiClient.put(
          `/modules/${selectedModule.slug}/records/${editingRecord.id}`,
          { data: formData }
        );
        message.success("Record updated successfully");
      } else {
        await apiClient.post(`/modules/${selectedModule.slug}/records`, {
          data: formData,
        });
        message.success("Record created successfully");
      }

      setFormModalOpen(false);
      await handleModuleClick(selectedModule);
    } catch (error) {
      console.error("Failed to save record:", error);
      message.error("Failed to save record");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-2">
          Manage tasks across all workflow modules
        </p>
      </div>

      {modules.length === 0 ? (
        <Card>
          <Empty description="No modules available for your role" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {modules.map((module) => (
            <Col xs={24} sm={12} md={8} lg={6} key={module.slug}>
              <Card
                hoverable
                className={`h-full cursor-pointer border-2 transition-all ${
                  MODULE_COLORS[module.slug] || "bg-gray-50 border-gray-200"
                }`}
                onClick={() => handleModuleClick(module)}
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {module.displayName || module.name}
                  </h3>
                  {module.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {module.description}
                    </p>
                  )}
                  <Button type="primary" block>
                    View Tasks
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Module Records Modal */}
      <Modal
        title={selectedModule ? `${selectedModule.displayName || selectedModule.name} Tasks` : ""}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={1200}
        footer={null}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {recordLoading ? (
          <div className="flex items-center justify-center h-96">
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRecord}
              className="mb-4"
            >
              Add Record
            </Button>

            {records.length === 0 ? (
              <Empty description="No records found" />
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card key={record.id} className="bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(record.data || {})
                            .filter(([key]) => !key.startsWith("_"))
                            .map(([key, value]) => (
                              <div key={key}>
                                <p className="text-xs font-semibold text-gray-600 uppercase">
                                  {key}
                                </p>
                                <p className="text-sm text-gray-900">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value || "—")}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditRecord(record)}
                        />
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteRecord(record.id)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Form functionality for adding/editing will be implemented via the records modal */}
    </div>
  );
}
