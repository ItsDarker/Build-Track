"use client";

import { ModulePage } from "@/components/modules/ModulePage";
import { getModuleBySlug } from "@/config/buildtrack.config";

export default function SupportWarrantyPage() {
  const module = getModuleBySlug("support-warranty");
  if (!module) return <div>Module not found</div>;
  return <ModulePage module={module} />;
}
