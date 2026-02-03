"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-slate-900 text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
