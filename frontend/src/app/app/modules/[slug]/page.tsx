"use client";

import { useParams } from "next/navigation";
import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";

export default function DynamicModulePage() {
  const params = useParams();
  const slug = params.slug as string;
  const module = getModuleBySlug(slug);

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

  return <ModulePage module={module} />;
}
