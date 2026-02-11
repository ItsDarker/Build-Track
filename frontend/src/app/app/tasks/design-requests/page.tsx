"use client";

import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";

export default function DesignRequestsPage() {
  const module = getModuleBySlug("design-configurator");
  if (!module) return <div>Module not found</div>;
  return <ModulePage module={module} />;
}
