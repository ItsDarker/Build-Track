"use client";

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
} from "lucide-react";

export default function DashboardPage() {
  const modules = getAllModules();

  // Quick stats (mock data - TODO: connect to backend)
  const stats = [
    { label: "Active Leads", value: 12, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Open Work Orders", value: 8, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pending Deliveries", value: 5, color: "text-green-500", bg: "bg-green-50" },
    { label: "Active Projects", value: 3, color: "text-purple-500", bg: "bg-purple-50" },
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
          <Card key={stat.label} className="border-0 shadow-sm">
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
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    {["Admin", ...mod.accessRoles].slice(0, 3).map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {role}
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
