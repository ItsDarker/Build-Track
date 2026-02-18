"use client";

import { useParams } from "next/navigation";
import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";
import { useUser } from "@/lib/context/UserContext";
import { canAccessModule } from "@/config/rbac";
import { ShieldAlert } from "lucide-react";

export default function DynamicModulePage() {
  const params = useParams();
  const slug = params.slug as string;
  const module = getModuleBySlug(slug);
  const { role } = useUser();

  if (!module) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900">Module Not Found</h1>
        <p className="text-gray-500 mt-2">
          No module found for slug: &quot;{slug}&quot;
        </p>
      </div>
    );
  }

  if (!canAccessModule(role.name, module.slug)) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-gray-500 mt-2">
          Your role ({role.displayName}) does not have permission to access{" "}
          {module.name}.
        </p>
      </div>
    );
  }

  return <ModulePage module={module} />;
}
