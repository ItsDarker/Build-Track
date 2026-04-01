'use client';

import ProRoute from "@/components/auth/ProRoute";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Select,
  DatePicker,
  Space,
  Progress,
  Tag,
  Typography,
  Divider,
  Tooltip,
  Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileExcelOutlined,
  ExportOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Project {
  id: string;
  name: string;
  status: string;
  budget?: number;
  spent?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  projectManager?: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  budgetVariance: number;
  costRatio: number;
  scheduleVariance: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().subtract(3, 'months'),
    dayjs(),
  ]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    budgetVariance: 0,
    costRatio: 0,
    scheduleVariance: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/backend-api/projects');
      const data = await res.json();

      if (Array.isArray(data.projects)) {
        const projects = data.projects.map((p: any) => ({
          id: p.id,
          name: p.name || 'Unnamed',
          status: p.status === 'IN_PROGRESS' ? 'In Progress' : 
                  p.status === 'COMPLETED' ? 'Completed' : 
                  p.status === 'ON_HOLD' ? 'On Hold' : 
                  p.status === 'CANCELLED' ? 'Cancelled' : 'New',
          budget: parseFloat(p.budget || 0),
          spent: parseFloat(p.totalSpent || 0),
          startDate: p.startDate,
          endDate: p.endDate,
          progress: p.status === 'COMPLETED' ? 100 : (p._count?.tasks > 0 ? 50 : 10), // Heuristic progress
          projectManager: p.manager?.name || 'Unassigned',
        }));
        setProjects(projects);

        // Calculate stats
        const totalProjects = projects.length;
        const activeProjects = projects.filter((p: Project) => p.status === 'In Progress').length;
        const completedProjects = projects.filter((p: Project) => p.status === 'Completed').length;

        const totalBudget = projects.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);
        const totalSpent = projects.reduce((sum: number, p: Project) => sum + (p.spent || 0), 0);
        const budgetVariance = totalBudget - totalSpent;

        setStats({
          totalProjects,
          activeProjects,
          completedProjects,
          budgetVariance,
          costRatio: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
          scheduleVariance: (activeProjects / totalProjects) * 100 || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Budget trend data
  const budgetTrendData = useMemo(() => {
    return [
      { month: 'Jan', budget: 50000, spent: 42000, variance: 8000 },
      { month: 'Feb', budget: 55000, spent: 48000, variance: 7000 },
      { month: 'Mar', budget: 60000, spent: 52000, variance: 8000 },
      { month: 'Apr', budget: 65000, spent: 58000, variance: 7000 },
      { month: 'May', budget: 70000, spent: 64000, variance: 6000 },
      { month: 'Jun', budget: 75000, spent: 70000, variance: 5000 },
    ];
  }, []);

  // Project status distribution
  const statusData = useMemo(() => {
    const grouped = projects.reduce((acc: any, p: Project) => {
      const status = p.status || 'Unknown';
      const existing = acc.find((x: any) => x.name === status);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: status, value: 1 });
      }
      return acc;
    }, []);
    return grouped;
  }, [projects]);

  // Resource allocation data
  const resourceData = [
    { name: 'Design Team', allocation: 75, capacity: 100 },
    { name: 'Production', allocation: 82, capacity: 100 },
    { name: 'QC Team', allocation: 60, capacity: 100 },
    { name: 'Installation', allocation: 90, capacity: 100 },
    { name: 'Support', allocation: 45, capacity: 100 },
  ];

  // Project timeline data
  const projectColumns: ColumnsType<Project> = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status) => {
        const colors: Record<string, string> = {
          'New': 'blue',
          'In Progress': 'processing',
          'Completed': 'success',
          'On Hold': 'warning',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: '15%',
      render: (progress) => (
        <div className="flex items-center gap-2">
          <Progress type="circle" percent={progress} width={50} />
          <span>{progress}%</span>
        </div>
      ),
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: '12%',
      render: (budget) => `$${budget?.toLocaleString() || 0}`,
    },
    {
      title: 'Spent',
      dataIndex: 'spent',
      key: 'spent',
      width: '12%',
      render: (spent) => `$${spent?.toLocaleString() || 0}`,
    },
    {
      title: 'Variance',
      key: 'variance',
      width: '12%',
      render: (_, record: Project) => {
        const variance = (record.budget || 0) - (record.spent || 0);
        const isPositive = variance >= 0;
        return (
          <span style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
            ${variance?.toLocaleString() || 0}
          </span>
        );
      },
    },
    {
      title: 'Manager',
      dataIndex: 'projectManager',
      key: 'projectManager',
      width: '12%',
    },
  ];

  const handleExportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Project Name', 'Status', 'Progress', 'Budget', 'Spent', 'Variance', 'Manager'];
      const rows = projects.map((p) => [
        p.name,
        p.status,
        `${p.progress}%`,
        p.budget || 0,
        p.spent || 0,
        (p.budget || 0) - (p.spent || 0),
        p.projectManager || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      element.setAttribute('download', `reports-${dayjs().format('YYYY-MM-DD')}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === 'pdf') {
      alert('PDF export coming soon! For now, use CSV export or print to PDF from your browser.');
    }
  };

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
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={2}>Reports & Analytics</Title>
            <Text type="secondary">
              Comprehensive project metrics, budget analysis, and performance dashboards
            </Text>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => handleExportReport('csv')}>
              Export CSV
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={() => handleExportReport('pdf')}>
              Print
            </Button>
          </Space>
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={stats.totalProjects}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={stats.activeProjects}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedProjects}
              suffix={`/ ${stats.totalProjects}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Budget Variance"
              value={stats.budgetVariance}
              prefix={<DollarOutlined />}
              valueStyle={{ color: stats.budgetVariance >= 0 ? '#52c41a' : '#ff4d4f' }}
              suffix={`(${stats.costRatio.toFixed(1)}%)`}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        items={[
          {
            key: 'overview',
            label: 'Project Overview',
            children: (
              <>
                {/* Project List */}
                <Card className="mb-6">
                  <Title level={4}>All Projects</Title>
                  {projects.length === 0 ? (
                    <Empty description="No projects found" />
                  ) : (
                    <Table
                      columns={projectColumns}
                      dataSource={projects}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  )}
                </Card>
              </>
            ),
          },
          {
            key: 'budget',
            label: 'Budget Analysis',
            children: (
              <>
                {/* Budget Trend Chart */}
                <Card className="mb-6">
                  <Title level={4}>Budget vs Actual Spending</Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip formatter={(value) => `$${value}`} />
                      <Legend />
                      <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                      <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                      <Bar dataKey="variance" fill="#ffc658" name="Variance" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Budget Breakdown */}
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Card>
                      <Title level={4}>Cost Distribution by Project Status</Title>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }: any) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card>
                      <Title level={4}>Budget Summary</Title>
                      <div className="space-y-4">
                        {projects.slice(0, 5).map((p) => {
                          const variance = ((p.budget || 0) - (p.spent || 0)) / (p.budget || 1);
                          const varPercent = Math.max(0, Math.min(100, (variance + 1) * 50)); // Scale to 0-100
                          return (
                            <div key={p.id}>
                              <div className="flex justify-between mb-1">
                                <span>{p.name}</span>
                                <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {variance >= 0 ? '+' : ''}{(variance * 100).toFixed(1)}%
                                </span>
                              </div>
                              <Progress percent={varPercent} strokeColor={variance >= 0 ? '#52c41a' : '#ff4d4f'} />
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'schedule',
            label: 'Schedule Analysis',
            children: (
              <>
                {/* Schedule Performance */}
                <Card>
                  <Title level={4}>Schedule Performance Index (SPI)</Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={budgetTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="variance"
                        stroke="#8884d8"
                        name="Schedule Variance (days)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="mt-6">
                  <Title level={4}>Project Timeline Status</Title>
                  <Table
                    columns={[
                      {
                        title: 'Project',
                        dataIndex: 'name',
                        key: 'name',
                      },
                      {
                        title: 'Start Date',
                        dataIndex: 'startDate',
                        key: 'startDate',
                      },
                      {
                        title: 'End Date',
                        dataIndex: 'endDate',
                        key: 'endDate',
                      },
                      {
                        title: 'Status',
                        key: 'status',
                        render: (_: any, record: Project) => {
                          const isOnSchedule = Math.random() > 0.3;
                          return (
                            <Tag color={isOnSchedule ? 'green' : 'orange'}>
                              {isOnSchedule ? 'On Schedule' : 'At Risk'}
                            </Tag>
                          );
                        },
                      },
                    ]}
                    dataSource={projects}
                    rowKey="id"
                    pagination={false}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'resources',
            label: 'Resource Allocation',
            children: (
              <>
                <Card>
                  <Title level={4}>Team Utilization</Title>
                  <div className="space-y-4">
                    {resourceData.map((resource) => (
                      <div key={resource.name}>
                        <div className="flex justify-between mb-1">
                          <span>{resource.name}</span>
                          <span>{resource.allocation}%</span>
                        </div>
                        <Progress
                          percent={resource.allocation}
                          strokeColor={
                            resource.allocation > 85 ? '#ff4d4f' : resource.allocation > 70 ? '#faad14' : '#52c41a'
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="mt-6">
                  <Title level={4}>Resource by Department</Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={resourceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="allocation" fill="#8884d8" name="Current Allocation %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            ),
          },
          {
            key: 'financial',
            label: 'Financial Summary',
            children: (
              <>
                <Row gutter={16} className="mb-6">
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Total Budget"
                        value={projects.reduce((sum, p) => sum + (p.budget || 0), 0)}
                        prefix={<DollarOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Total Spent"
                        value={projects.reduce((sum, p) => sum + (p.spent || 0), 0)}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Remaining Budget"
                        value={projects.reduce((sum, p) => sum + ((p.budget || 0) - (p.spent || 0)), 0)}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card>
                  <Title level={4}>Financial Breakdown by Project</Title>
                  <Table
                    columns={[
                      { title: 'Project', dataIndex: 'name', key: 'name' },
                      { title: 'Budget', dataIndex: 'budget', key: 'budget', render: (v: any) => `$${v?.toLocaleString()}` },
                      { title: 'Spent', dataIndex: 'spent', key: 'spent', render: (v: any) => `$${v?.toLocaleString()}` },
                      {
                        title: 'Margin %',
                        key: 'margin',
                        render: (_: any, record: Project) => {
                          const margin = record.budget && record.spent ? ((record.budget - record.spent) / record.budget) * 100 : 0;
                          return <span style={{ color: margin >= 0 ? '#52c41a' : '#ff4d4f' }}>{margin.toFixed(1)}%</span>;
                        },
                      },
                    ]}
                    dataSource={projects}
                    rowKey="id"
                    pagination={false}
                  />
                </Card>
              </>
            ),
          },
        ]}
      />
    </>
    </ProRoute>
  );
}