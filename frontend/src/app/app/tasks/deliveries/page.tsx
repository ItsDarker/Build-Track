"use client";

import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";

export default function DeliveriesPage() {
  const module = getModuleBySlug("delivery-installation");
  if (!module) return <div>Module not found</div>;
  return <ModulePage module={module} />;
}
