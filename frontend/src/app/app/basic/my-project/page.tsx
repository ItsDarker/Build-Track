"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Button, Empty, Spin, Badge, Modal, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { getModuleBySlug, getAllModules } from "@/config/buildtrack.config";
import { useUser } from "@/lib/context/UserContext";
import { canAccessModule } from "@/config/rbac";

interface Project {
  id: string;
  name: string;
  status: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  data?: any;
}

interface Module {
  name: string;
  slug: string;
  description?: string;
  fields?: any[];
  displayName?: string;
}

interface ModuleRecord {
  id: string;
  moduleSlug: string;
  data: any;
}

const MODULE_COLORS: Record<string, { bg: string; border: string }> = {
  "crm-leads": { bg: "bg-blue-50", border: "border-blue-300" },
  "design-configurator": { bg: "bg-purple-50", border: "border-purple-300" },
  "quoting-contracts": { bg: "bg-green-50", border: "border-green-300" },
  "approval-workflow": { bg: "bg-yellow-50", border: "border-yellow-300" },
  "production-scheduling": { bg: "bg-orange-50", border: "border-orange-300" },
  "delivery-installation": { bg: "bg-red-50", border: "border-red-300" },
  "work-orders": { bg: "bg-cyan-50", border: "border-cyan-300" },
};

export default function BasicMyProjectPage() {
  const user = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ModuleRecord | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/projects");
        if (res.data) {
          const projects = (res.data as any).projects || [];
          if (projects.length > 0) {
            setProject(projects[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, []);

  useEffect(() => {
    if (!project) return;

    // Get all modules user can access
    const allModules = getAllModules().filter((mod) =>
      canAccessModule(user.role.name, mod.slug)
    );

    // Include work-orders
    const workOrdersModule = getModuleBySlug("work-orders");
    if (workOrdersModule && canAccessModule(user.role.name, "work-orders")) {
      allModules.push(workOrdersModule);
    }

    setModules(allModules);
  }, [project, user.role.name]);

  const handleModuleClick = async (module: Module) => {
    setSelectedModule(module);
    setRecordLoading(true);
    setEditingRecord(null);
    setFormModalOpen(false);

    try {
      const res = await apiClient.get(`/modules/${module.slug}/records`);
      if (res.data) {
        // Filter records by project
        const allRecords = (res.data as any).records || [];
        const filteredRecords = allRecords.filter(
          (record: ModuleRecord) =>
            record.data._projectId === project?.id ||
            record.data._projectCode === project?.data?._projectCode
        );
        setRecords(filteredRecords);
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
          await apiClient.delete(
            `/modules/${selectedModule.slug}/records/${recordId}`
          );
          message.success("Record deleted successfully");
          if (selectedModule) {
            await handleModuleClick(selectedModule);
          }
        } catch (error) {
          console.error("Failed to delete record:", error);
          message.error("Failed to delete record");
        }
      },
    });
  };

  const handleSaveRecord = async (formData: any) => {
    try {
      if (!selectedModule || !project) return;

      // Ensure project ID is set in the data
      const dataWithProject = {
        ...formData,
        _projectId: project.id,
        _projectCode: project.data?._projectCode,
      };

      if (editingRecord) {
        await apiClient.put(
          `/modules/${selectedModule.slug}/records/${editingRecord.id}`,
          { data: dataWithProject }
        );
        message.success("Record updated successfully");
      } else {
        await apiClient.post(`/modules/${selectedModule.slug}/records`, {
          data: dataWithProject,
        });
        message.success("Record created successfully");
      }

      setFormModalOpen(false);
      if (selectedModule) {
        await handleModuleClick(selectedModule);
      }
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

  if (!project) {
    return (
      <div className="w-full bg-white p-6">
        <Card>
          <Empty description="No projects assigned to you yet" />
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
        <p className="text-gray-600 mb-4">{project.description || "No description"}</p>

        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Status"
                value={project.status}
                valueStyle={{
                  color:
                    project.status === "COMPLETED"
                      ? "#52c41a"
                      : project.status === "ACTIVE"
                      ? "#1890ff"
                      : "#faad14",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Start Date"
                value={
                  project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : "—"
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="End Date"
                value={
                  project.endDate
                    ? new Date(project.endDate).toLocaleDateString()
                    : "—"
                }
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Modules Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Workflow</h2>
        {modules.length === 0 ? (
          <Card>
            <Empty description="No modules available" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {modules.map((module) => {
              const moduleRecords = records.filter(
                (r) => r.moduleSlug === module.slug
              );
              const colors = MODULE_COLORS[module.slug] || {
                bg: "bg-gray-50",
                border: "border-gray-300",
              };

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={module.slug}>
                  <Card
                    hoverable
                    className={`h-full cursor-pointer border-2 transition-all ${colors.bg} ${colors.border}`}
                    onClick={() => handleModuleClick(module)}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {module.displayName || module.name}
                      </h3>
                      <div className="mb-4">
                        <Badge
                          count={moduleRecords.length}
                          showZero
                          style={{
                            backgroundColor: "#1890ff",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {moduleRecords.length === 1 ? "record" : "records"}
                        </span>
                      </div>
                      <Button type="primary" block icon={<ArrowRightOutlined />}>
                        View
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Module Records Modal */}
      <Modal
        title={
          selectedModule
            ? `${selectedModule.displayName || selectedModule.name} - ${
                project.name
              }`
            : ""
        }
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
            {user.role.name === "PROJECT_MANAGER" && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRecord}
                className="mb-4"
              >
                Add Record
              </Button>
            )}

            {records.length === 0 ? (
              <Empty description="No records found for this module" />
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card key={record.id} className="bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(record.data || {})
                            .filter(
                              ([key]) =>
                                !key.startsWith("_") &&
                                key !== "_projectId" &&
                                key !== "_projectCode"
                            )
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
                      {user.role.name === "PROJECT_MANAGER" && (
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
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Form Modal for Add/Edit */}
      {/* Form functionality for adding/editing will be implemented via the records modal */}
    </div>
  );
}
