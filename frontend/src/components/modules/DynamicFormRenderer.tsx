"use client";

import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";

export type FormMode = "create" | "edit" | "view";

interface DynamicFormRendererProps {
  fields: string[];
  values: Record<string, string>;
  onChange: (fieldLabel: string, value: string) => void;
  /** "create" hides audit fields, "edit" shows them read-only, "view" shows all read-only */
  mode?: FormMode;
  /** File attachments keyed by field label */
  files?: Record<string, File[]>;
  onFileChange?: (fieldLabel: string, files: File[]) => void;
}

const AUDIT_FIELDS = ["Created at", "Created by", "Update at", "Updated by"];

function isSectionHeader(label: string): boolean {
  const lower = label.toLowerCase().trim();
  return (
    lower === "optional:" ||
    lower === "optional" ||
    lower === "mvp fields" ||
    lower === "inventory (stock)" ||
    lower === "receiving" ||
    label.endsWith("(table):")
  );
}

function isAuditField(label: string): boolean {
  return AUDIT_FIELDS.includes(label);
}

function isFileField(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes("attachment") ||
    lower.includes("photo") ||
    lower.includes("file") ||
    lower.includes("upload") ||
    lower.includes("proof") ||
    lower.includes("image") ||
    lower.includes("document") ||
    lower.includes("pdf snapshot") ||
    lower.includes("site photos") ||
    lower.includes("renderings") ||
    lower.includes("drawings") ||
    lower.includes("spec sheet")
  );
}

function isTimestampField(label: string): boolean {
  return label === "Created at" || label === "Update at";
}

function isAuthorField(label: string): boolean {
  return label === "Created by" || label === "Updated by";
}

function extractOptions(label: string): string[] | null {
  const match = label.match(/\(([^)]+)\)/);
  if (!match) return null;
  const inner = match[1];
  const parts = inner.split(",").map((s) => s.trim());
  if (parts.length >= 2) return parts;
  return null;
}

function getFieldType(
  label: string
): "select" | "date" | "status" | "textarea" | "file" | "datetime" | "input" {
  if (isFileField(label)) return "file";
  if (isTimestampField(label)) return "datetime";
  const lower = label.toLowerCase();
  if (lower.includes("dropdown") || lower.includes("multi-select")) return "select";
  if (lower.includes("status")) return "status";
  if (
    lower.includes("date") &&
    !lower.includes("update") &&
    !lower.includes("created")
  )
    return "date";
  if (
    lower.includes("notes") ||
    lower.includes("description") ||
    lower.includes("summary") ||
    lower.includes("instructions") ||
    lower.includes("comments") ||
    lower.includes("lessons learned") ||
    lower.includes("constraints") ||
    lower.includes("preferences")
  )
    return "textarea";
  return "input";
}

function cleanLabel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

export function DynamicFormRenderer({
  fields,
  values,
  onChange,
  mode = "create",
  files = {},
  onFileChange,
}: DynamicFormRendererProps) {
  const isViewMode = mode === "view";

  return (
    <div className="space-y-4">
      {fields.map((field, idx) => {
        if (isSectionHeader(field)) {
          return (
            <div
              key={`section-${idx}`}
              className="pt-4 pb-1 border-t border-gray-200 mt-2"
            >
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {field.replace(/:$/, "")}
              </h4>
            </div>
          );
        }

        // In create mode, skip audit fields entirely
        if (mode === "create" && isAuditField(field)) return null;

        const fieldType = getFieldType(field);
        const options = extractOptions(field);
        const value = values[field] || "";
        const label = cleanLabel(field);
        const disabled = isViewMode || isAuditField(field);
        const fieldFiles = files[field] || [];

        return (
          <div key={field} className="space-y-1.5">
            <Label
              htmlFor={`field-${idx}`}
              className={`text-sm font-medium ${disabled ? "text-gray-400" : ""}`}
            >
              {label}
              {isAuditField(field) && (
                <span className="ml-1.5 text-xs text-gray-400 font-normal">
                  (auto)
                </span>
              )}
            </Label>
            {fieldType === "file" ? (
              <FileUploadField
                id={`field-${idx}`}
                files={fieldFiles}
                disabled={isViewMode}
                onFilesChange={(f) => onFileChange?.(field, f)}
                textValue={value}
              />
            ) : (
              renderField(
                field,
                label,
                fieldType,
                options,
                value,
                idx,
                onChange,
                disabled
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

function FileUploadField({
  id,
  files,
  disabled,
  onFilesChange,
  textValue,
}: {
  id: string;
  files: File[];
  disabled: boolean;
  onFilesChange?: (files: File[]) => void;
  textValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (disabled) {
    return (
      <div className="text-sm text-gray-500 py-2">
        {files.length > 0
          ? files.map((f) => f.name).join(", ")
          : textValue || "No files attached"}
      </div>
    );
  }

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = [...files, ...Array.from(e.target.files)];
    onFilesChange?.(newFiles);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    onFilesChange?.(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        className="hidden"
        onChange={handleAdd}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 w-full rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Click to upload files (any format)
      </button>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm"
            >
              <span className="truncate mr-2">
                {f.name}{" "}
                <span className="text-xs text-gray-400">
                  ({(f.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderField(
  field: string,
  label: string,
  type: string,
  options: string[] | null,
  value: string,
  idx: number,
  onChange: (field: string, value: string) => void,
  disabled: boolean
) {
  if (disabled && type !== "datetime") {
    // Read-only display for disabled non-datetime fields
    return (
      <Input
        id={`field-${idx}`}
        value={value}
        disabled
        className="bg-gray-50 text-gray-500"
      />
    );
  }

  switch (type) {
    case "select":
    case "status": {
      const opts = options || ["Option 1", "Option 2", "Option 3"];
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(v: string) => onChange(field, v)}
            disabled={disabled}
          >
            <SelectTrigger id={`field-${idx}`}>
              <SelectValue placeholder={`Select ${label}...`} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {type === "status" && value && (
            <Badge
              variant={
                value.toLowerCase().includes("complete") ||
                value.toLowerCase().includes("approved") ||
                value.toLowerCase().includes("pass") ||
                value.toLowerCase().includes("paid")
                  ? "success"
                  : value.toLowerCase().includes("reject") ||
                    value.toLowerCase().includes("fail") ||
                    value.toLowerCase().includes("overdue") ||
                    value.toLowerCase().includes("cancel")
                  ? "destructive"
                  : value.toLowerCase().includes("progress") ||
                    value.toLowerCase().includes("sent") ||
                    value.toLowerCase().includes("scheduled")
                  ? "info"
                  : "warning"
              }
            >
              {value}
            </Badge>
          )}
        </div>
      );
    }

    case "datetime":
      return (
        <Input
          id={`field-${idx}`}
          type="datetime-local"
          value={value}
          disabled={disabled}
          className={disabled ? "bg-gray-50 text-gray-500" : ""}
          onChange={(e) => onChange(field, e.target.value)}
        />
      );

    case "date":
      return (
        <Input
          id={`field-${idx}`}
          type="date"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
        />
      );

    case "textarea":
      return (
        <Textarea
          id={`field-${idx}`}
          rows={3}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      );

    default:
      return (
        <Input
          id={`field-${idx}`}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      );
  }
}
