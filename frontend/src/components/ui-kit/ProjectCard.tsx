"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";

interface ProjectCardProps {
  title: string;
  progress: number;
  dueDate: string;
  imageUrl?: string;
}

export function ProjectCard({ title, progress, dueDate, imageUrl }: ProjectCardProps) {
  const [imgError, setImgError] = useState(false);

  // Generate a gradient based on the title for placeholder
  const gradientColors = [
    "from-blue-500 to-blue-600",
    "from-orange-500 to-orange-600",
    "from-green-500 to-green-600",
    "from-purple-500 to-purple-600",
    "from-cyan-500 to-cyan-600",
  ];
  const gradientIndex = title.length % gradientColors.length;
  const gradient = gradientColors[gradientIndex];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-md">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative h-32 w-full">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <svg
                className="w-12 h-12 text-white/50"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 21h18M9 21V8l-6 3v10M21 21V8l-6-3v16M12 21V3l9 4.5M12 3L3 7.5" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 text-lg mb-3 line-clamp-2">
            {title}
          </h3>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-orange-500 min-w-[3rem]">
              {progress}%
            </span>
          </div>

          {/* Due Date */}
          <p className="text-sm text-gray-500">{dueDate}</p>
        </div>
      </CardContent>
    </Card>
  );
}
