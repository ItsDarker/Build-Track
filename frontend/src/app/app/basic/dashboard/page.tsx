"use client";

import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Button, Table, Empty, Spin, Badge } from "antd";
import { ProjectOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";

interface Project {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  assignedToId?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  project?: { name: string };
}

interface User {
  name?: string;
  email?: string;
}

export default function BasicDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch current user
        const userRes = await apiClient.getCurrentUser();
        if (userRes.data) {
          setUser((userRes.data as any).user || null);
        }

        // Fetch projects
        const projectsRes = await apiClient.get("/projects");
        if (projectsRes.data) {
          setProjects((projectsRes.data as any).projects || []);
        }

        // Fetch tasks
        const tasksRes = await apiClient.get("/work-orders");
        if (tasksRes.data) {
          setTasks((tasksRes.data as any).records || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const activeProjects = projects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNING").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED").length;

  const projectColumns = [
    { title: "Project Name", dataIndex: "name", key: "name" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Badge
          color={status === "COMPLETED" ? "green" : status === "ACTIVE" ? "blue" : "orange"}
          text={status}
        />
      ),
    },
    { title: "Start Date", dataIndex: "startDate", key: "startDate", render: (date: any) => date ? new Date(date).toLocaleDateString() : "—" },
    { title: "End Date", dataIndex: "endDate", key: "endDate", render: (date: any) => date ? new Date(date).toLocaleDateString() : "—" },
  ];

  return (
    <div className="w-full bg-white p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name || "User"}!</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Key Statistics */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Active Projects"
                  value={activeProjects}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Completed Projects"
                  value={completedProjects}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Active Tasks"
                  value={activeTasks}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Completed Tasks"
                  value={completedTasks}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Recent Projects */}
          <Card className="mb-8" title="Your Projects" extra={<Button type="primary">View All</Button>}>
            {projects.length === 0 ? (
              <Empty description="No projects yet" />
            ) : (
              <Table
                dataSource={projects.slice(0, 5)}
                columns={projectColumns}
                pagination={false}
                size="small"
              />
            )}
          </Card>

          {/* Recent Tasks */}
          <Card title="Recent Tasks">
            {tasks.length === 0 ? (
              <Empty description="No tasks assigned" />
            ) : (
              <Table
                dataSource={tasks.slice(0, 5)}
                columns={[
                  { title: "Task", dataIndex: "title", key: "title" },
                  { title: "Project", dataIndex: ["project", "name"], key: "project" },
                  {
                    title: "Status",
                    dataIndex: "status",
                    key: "status",
                    render: (status: any) => (
                      <Badge
                        color={status === "COMPLETED" ? "green" : "blue"}
                        text={status}
                      />
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
