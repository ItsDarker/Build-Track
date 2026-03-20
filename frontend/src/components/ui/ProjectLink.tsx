import React from "react";
import Link from "next/link";
import { FolderOpenOutlined } from "@ant-design/icons";

interface ProjectLinkProps {
  projectId: string;
  projectCode?: string;
  projectName?: string;
}

export function ProjectLink({ projectId, projectCode, projectName }: ProjectLinkProps) {
  if (!projectId) return null;

  return (
    <Link 
        href={`/app/projects?id=${projectId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        onClick={(e: React.MouseEvent) => {
            // If we are currently handling a modal click, let it redirect natively or handle via context
            // Just let the native link click happen
        }}
    >
      <FolderOpenOutlined className="text-blue-500" />
      {projectCode || projectName || projectId}
    </Link>
  );
}
