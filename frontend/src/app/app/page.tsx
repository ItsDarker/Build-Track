"use client";

// Auth is now handled in layout.tsx
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui-kit/ProjectCard";
import { QuickStats } from "@/components/ui-kit/QuickStats";
import { Tooltip as AntdTooltip } from "antd";

// Mock project data
const mockProjects = [
  {
    id: "1",
    title: "Grand Tower Skyscraper (Phase 2)",
    progress: 65,
    dueDate: "Dec 15, 2026",
  },
  {
    id: "2",
    title: "Urban Housing Development",
    progress: 30,
    dueDate: "Aug 1, 2027",
  },
  {
    id: "3",
    title: "New Riverside Complex",
    progress: 45,
    dueDate: "Mar 20, 2027",
  },
  {
    id: "4",
    title: "Urban Renovation Project",
    progress: 30,
    dueDate: "Aug 30, 2027",
  },
  {
    id: "5",
    title: "Bridge Renovation Project",
    progress: 90,
    dueDate: "Apr 30, 2026",
  },
  {
    id: "6",
    title: "New Harbor Hotel",
    progress: 15,
    dueDate: "Nov 1, 2027",
  },
];

// Mock stats data
const mockStats = [
  { label: "Total Active Tasks", value: 185, color: "orange" },
  { label: "Overdue Issues", value: 12, color: "orange" },
  { label: "Team Members", value: 47, color: "orange" },
];

export default function AppPage() {
  // No need for auth check here, layout handles it

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <AntdTooltip title="MVP: This feature is disabled">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            disabled
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </AntdTooltip>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {mockProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            progress={project.progress}
            dueDate={project.dueDate}
          />
        ))}
      </div>

      {/* Quick Stats */}
      <QuickStats stats={mockStats} />
    </>
  );
}

