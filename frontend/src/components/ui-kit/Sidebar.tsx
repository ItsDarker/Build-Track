"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/tasks", icon: CheckSquare, label: "Tasks", disabled: true },
  { href: "/app/team", icon: Users, label: "Team", disabled: true },
  { href: "/app/reports", icon: BarChart3, label: "Reports", disabled: true },
  { href: "/app/settings", icon: Settings, label: "Settings", disabled: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 transform transition-transform duration-200 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          {onClose && (
            <div className="lg:hidden flex justify-end p-4">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.disabled ? "#" : item.href}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault();
                    if (onClose) onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-gray-400 hover:text-white hover:bg-slate-700/50",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.disabled && (
                    <span className="ml-auto text-xs bg-slate-600 px-2 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
