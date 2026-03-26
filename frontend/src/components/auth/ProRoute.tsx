"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/UserContext";
import { Loader2 } from "lucide-react";

interface ProRouteProps {
  children: React.ReactNode;
}

export default function ProRoute({ children }: ProRouteProps) {
  const router = useRouter();
  const user = useUser();
  const isPro = !user.plan || user.plan === "PRO";

  useEffect(() => {
    if (!isPro) {
      router.replace("/app?auth_err=upgrade_required");
    }
  }, [isPro, router]);

  if (!isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return <>{children}</>;
}
