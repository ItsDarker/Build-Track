"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/UserContext";
import { Loader2 } from "lucide-react";

interface BasicRouteProps {
  children: React.ReactNode;
}

export default function BasicRoute({ children }: BasicRouteProps) {
  const router = useRouter();
  const user = useUser();
  const isBasic = user.plan === "BASIC";

  useEffect(() => {
    if (!isBasic) {
      router.replace("/app/projects");
    }
  }, [isBasic, router]);

  if (!isBasic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return <>{children}</>;
}
