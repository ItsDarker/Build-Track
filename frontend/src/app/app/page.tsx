"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui-kit/ProjectCard";
import { QuickStats } from "@/components/ui-kit/QuickStats";
import { Tooltip as AntdTooltip, Empty, Skeleton, Card } from "antd";
import { apiClient } from "@/lib/api/client";

export default function AppPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [projectsRes, statsRes] = await Promise.all([
          apiClient.getProjects(),
          apiClient.getDashboardStats(),
        ]);

        if (projectsRes.data) {
          setProjects((projectsRes.data as any).projects || []);
        }

        if (statsRes.data) {
          const s = (statsRes.data as any).stats;
          setStats([
            { label: "Active Tasks", value: s.activeTasks, color: "orange" },
            { label: "Overdue Issues", value: s.overdueIssues, color: "red" },
            { label: "Team Members", value: s.teamMembers, color: "blue" },
          ]);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton active paragraph={{ rows: 1 }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton.Button key={i} active style={{ height: 200, width: '100%' }} />)}
        </div>
        <Skeleton active />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <AntdTooltip title="Use the Projects page to manage projects">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            onClick={() => window.location.href = '/app/projects'}
          >
            <Plus className="w-4 h-4" />
            Manage Projects
          </Button>
        </AntdTooltip>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Projects Grid */}
      <h2 className="text-lg font-semibold mb-4">My Active Projects</h2>
      {projects.length === 0 ? (
        <Card className="p-8 text-center mb-8">
          <Empty description="No projects found. Creating a project to get started!" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard
              key={project.id}
              title={project.name}
              progress={project.status === 'COMPLETED' ? 100 : 0} // Future: calculate progress from tasks
              dueDate={project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No date'}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
      <QuickStats stats={stats} />
    </>
  );
}

