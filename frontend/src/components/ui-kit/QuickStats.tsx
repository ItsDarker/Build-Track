"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatItem {
  label: string;
  value: number;
  color?: string;
}

interface QuickStatsProps {
  stats: StatItem[];
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <StatCircle key={stat.label} {...stat} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCircle({ label, value, color = "orange" }: StatItem) {
  const colorClasses = {
    orange: "text-orange-500 border-orange-500",
    blue: "text-blue-500 border-blue-500",
    green: "text-green-500 border-green-500",
    red: "text-red-500 border-red-500",
  };

  const borderColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.orange;

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress Ring */}
      <div className="relative w-28 h-28 mb-3">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 48}`}
            strokeDashoffset={`${2 * Math.PI * 48 * 0.25}`}
            strokeLinecap="round"
            className={borderColor.split(" ")[0]}
          />
        </svg>
        {/* Value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${borderColor.split(" ")[0]}`}>
            {value}
          </span>
        </div>
      </div>
      {/* Label */}
      <span className="text-sm text-gray-600 text-center">{label}</span>
    </div>
  );
}
