"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { apiClient } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await apiClient.logout();
    router.push("/");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-gray-300 hover:text-white hover:bg-white/10"
    >
      <LogOut className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
