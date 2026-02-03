"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface DashboardLayoutProps {
  user: User;
  children: ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user.name || user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900 h-16">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-white p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M4 21V10.5M20 21V10.5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">BuildTrack</span>
            </Link>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-white font-medium text-sm">{displayName}</p>
              <p className="text-gray-400 text-xs">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
