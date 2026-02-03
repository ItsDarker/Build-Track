"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/ui-kit/DashboardLayout";
import { ProjectCard } from "@/components/ui-kit/ProjectCard";
import { QuickStats } from "@/components/ui-kit/QuickStats";
import { apiClient } from "@/lib/api/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified?: string;
}

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const result = await apiClient.getCurrentUser();

      if (result.error || !result.data) {
        router.push("/login");
        return;
      }

      const userData = (result.data as { user: User }).user;

      if (!userData.emailVerified) {
        router.push("/login?unverified=1");
        return;
      }

      setUser(userData);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider>
      <DashboardLayout user={user}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  disabled
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>MVP: This feature is disabled</p>
              </TooltipContent>
            </Tooltip>
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
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
