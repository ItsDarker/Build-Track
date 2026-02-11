"use client";

import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";

export default function LeadsPage() {
  const module = getModuleBySlug("crm-leads");
  if (!module) return <div>Module not found</div>;
  return <ModulePage module={module} />;
}
