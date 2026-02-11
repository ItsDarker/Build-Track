"use client";

import Link from "next/link";
import { getAllModules } from "@/config/buildtrack.config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function ModulesIndexPage() {
  const modules = getAllModules();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Modules</h1>
        <p className="text-gray-500 mt-1">
          BuildTrack workflow modules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, idx) => (
          <Link key={mod.slug} href={`/app/modules/${mod.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{mod.name}</CardTitle>
                  <span className="text-xs text-gray-400 font-mono">
                    #{idx + 1}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {mod.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 whitespace-pre-line">
                    {mod.description}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-1 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400 mr-0.5" />
                  {["Admin", ...mod.accessRoles].map((role) => (
                    <Badge
                      key={role}
                      variant={role === "Admin" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-end text-xs text-gray-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
