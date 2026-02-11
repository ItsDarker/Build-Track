"use client";

import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";

export default function WorkOrdersPage() {
  const module = getModuleBySlug("work-orders");
  if (!module) return <div>Module not found</div>;
  return <ModulePage module={module} />;
}
