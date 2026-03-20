"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllModules } from "@/config/buildtrack.config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  ClipboardList,
  FolderKanban,
  CalendarDays,
  TrendingUp,
  Users,
} from "lucide-react";
import { useUser } from "@/lib/context/UserContext";
import { canAccessModule, MODULE_ACCESS, REVERSE_ROLE_MAP } from "@/config/rbac";
import { apiClient } from "@/lib/api/client";

export default function DashboardPage() {
  const { role } = useUser();
  const modules = getAllModules().filter((mod) =>
    canAccessModule(role?.name, mod.slug)
  );

  const [statsData, setStatsData] = useState({
    activeProjects: 0,
    openWorkOrders: 0,
    activeTasks: 0,
    overdueIssues: 0,
  });

  useEffect(() => {
    apiClient.getDashboardStats().then((res: any) => {
      if (res?.data?.stats) {
        const s = res.data.stats;
        setStatsData({
          activeProjects: s.activeProjects ?? 0,
          openWorkOrders: s.openWorkOrders ?? 0,
          activeTasks: s.activeTasks ?? 0,
          overdueIssues: s.overdueIssues ?? 0,
        });
      }
    });
  }, []);

  // BT0002: Metric tiles reflect actual counts from backend
  // BT0003: Each tile links to its corresponding module
  const stats = [
    { label: "Active Projects",  value: statsData.activeProjects,  color: "text-purple-500", bg: "bg-purple-50", href: "/app/projects" },
    { label: "Open Work Orders", value: statsData.openWorkOrders,  color: "text-blue-500",   bg: "bg-blue-50",   href: "/app/tasks/work-orders" },
    { label: "Active Tasks",     value: statsData.activeTasks,     color: "text-orange-500", bg: "bg-orange-50", href: "/app/tasks" },
    { label: "Overdue Issues",   value: statsData.overdueIssues,   color: "text-red-500",    bg: "bg-red-50",    href: "/app/tasks" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here&apos;s your BuildTrack overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <TrendingUp className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/app/tasks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-semibold text-slate-900">My Tasks</p>
                <p className="text-sm text-gray-500">Leads, Work Orders, Deliveries</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/projects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-semibold text-slate-900">My Projects</p>
                <p className="text-sm text-gray-500">Manage active projects</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/calendar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-semibold text-slate-900">My Calendar</p>
                <p className="text-sm text-gray-500">Scheduled items &amp; deadlines</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/app/team">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200 bg-purple-50/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              <div>
                <p className="font-semibold text-slate-900">Team Profile</p>
                <p className="text-sm text-gray-500">Manage members &amp; roles</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Workflow Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Workflow Modules
          </h2>
          <Link
            href="/app/modules"
            className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {modules.slice(0, 8).map((mod, idx) => (
            <Link key={mod.slug} href={`/app/modules/${mod.slug}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer h-full">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 leading-tight">
                      {mod.name}
                    </p>
                    <span className="text-xs text-gray-300 font-mono">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { role: "Admin", level: "R/W" },
                      ...Object.entries(MODULE_ACCESS[mod.slug] ?? {}).map(
                        ([dbRole, level]) => ({
                          role: REVERSE_ROLE_MAP[dbRole] ?? dbRole,
                          level,
                        })
                      ),
                    ]
                      .slice(0, 3)
                      .map((entry) => (
                        <Badge
                          key={entry.role}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {entry.role}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
