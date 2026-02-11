"use client";

import Link from "next/link";
import { navigation } from "@/config/buildtrack.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Megaphone, Wrench, ClipboardCheck, Users2, Truck } from "lucide-react";

const taskIcons: Record<string, React.ReactNode> = {
  Leads: <Megaphone className="w-8 h-8 text-orange-500" />,
  "Design Requests": <Wrench className="w-8 h-8 text-blue-500" />,
  "Work Orders": <ClipboardCheck className="w-8 h-8 text-green-500" />,
  Inspections: <Users2 className="w-8 h-8 text-purple-500" />,
  Deliveries: <Truck className="w-8 h-8 text-teal-500" />,
};

export default function TasksIndexPage() {
  const tasksNav = navigation.sidebar.find((item) => item.label === "My Tasks");
  const children = tasksNav?.children || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">
          Select a task category to view and manage records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <Link key={child.path} href={child.path}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {taskIcons[child.label] || (
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                  )}
                  <CardTitle className="text-lg">{child.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>View all {child.label.toLowerCase()}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
