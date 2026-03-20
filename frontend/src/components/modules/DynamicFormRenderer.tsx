"use client";

import React, { useState } from "react";
import {
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Badge,
  Space,
  Typography,
  Form,
  ConfigProvider,
  UploadFile,
  Divider as AntDivider,
  AutoComplete
} from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import {
  UploadOutlined,
  InboxOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { AttachmentViewer } from "./AttachmentViewer";

const { TextArea } = Input;
const { Text } = Typography;

export type FormMode = "create" | "edit" | "view";

interface FieldError {
  field: string;
  message: string;
}

interface DynamicFormRendererProps {
  fields: string[];
  values: Record<string, string>;
  onChange: (fieldLabel: string, value: string) => void;
  /** "create" hides audit fields, "edit" shows them read-only, "view" shows all read-only */
  mode?: FormMode;
  /** File attachments keyed by field label */
  files?: Record<string, File[]>;
  onFileChange?: (fieldLabel: string, files: File[]) => void;
  /** Field-specific validation errors */
  errors?: Record<string, string>;
  /** Required field names */
  requiredFields?: Set<string>;
  /** Dynamic Options for relational fields */
  dynamicOptions?: Record<string, { label: string; value: string }[]>;
  /** Existing attachments for view/edit mode */
  existingAttachments?: Record<string, { id: string; filename: string; path: string; mimeType: string }[]>;
  onDeleteAttachment?: (id: string) => void;
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

export function isFileField(label: string): boolean {

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

function isIdField(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes("id") && !lower.includes("video");
}

function extractOptions(label: string): string[] | null {
  const match = label.match(/\(([^)]+)\)/);
  if (!match) return null;
  let inner = match[1];
  inner = inner.replace(/^dropdown:\s*/i, "");
  inner = inner.replace(/^multi-select:\s*/i, "");
  const parts = inner.split(",").map((s) => s.trim());
  if (parts.length >= 2) return parts;
  return null;
}

function getFieldType(
  label: string
): "select" | "date" | "status" | "textarea" | "file" | "datetime" | "input" {
  if (isFileField(label)) return "file";
  if (isTimestampField(label)) return "datetime";

  const extracted = extractOptions(label);
  if (extracted && extracted.length > 0) return "select";

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
  errors = {},
  requiredFields = new Set(),
  dynamicOptions = {},
  existingAttachments = {},
  onDeleteAttachment,
}: DynamicFormRendererProps) {
  console.log(`[DynamicFormRenderer] Rendering with mode: ${mode}`);
  console.log(`[DynamicFormRenderer] Fields count: ${fields.length}, Form values count: ${Object.keys(values).length}`);
  console.log(`[DynamicFormRenderer] Values:`, values);

  const isViewMode = mode === "view";

  return (
    <div className="space-y-6">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 6,
          },
        }}
      >
        <Form layout="vertical">
          {fields.map((field, idx) => {
            if (isSectionHeader(field)) {
              return (
                <div key={`section-${idx}`} className="pt-6 pb-2">
                  <Typography.Title level={5} className="text-gray-400 uppercase tracking-widest text-[10px] m-0">
                    {field.replace(/:$/, "")}
                  </Typography.Title>
                  <Divider className="my-2" />
                </div>
              );
            }

            if (mode === "create" && isAuditField(field)) return null;

            let fieldType = getFieldType(field);
            const options = extractOptions(field);
            const value = values[field] || "";
            const label = cleanLabel(field);
            const disabled = isViewMode || isAuditField(field);
            const fieldError = errors[field];
            const isRequired = requiredFields.has(field);

            let finalOptions = options ? options.map(o => ({ value: o, label: o })) : [];

            // Dynamic options (fetched from DB) take precedence over hardcoded/static options
            const hasDynamic = dynamicOptions && dynamicOptions[label];
            if (hasDynamic && hasDynamic.length > 0) {
              fieldType = "select";
              finalOptions = dynamicOptions[label];
            }

            // Treat certain fields as AutoComplete if they have dynamic options but allow manual entry
            const isFlexRelational = hasDynamic && (isIdField(field) || label.toLowerCase().includes("project") || label.toLowerCase().includes("customer") || label.toLowerCase().includes("client"));
            if (isFlexRelational) {
               fieldType = "input"; // We'll handle AutoComplete in renderAntField
            }

            return (
              <Form.Item
                key={field}
                label={
                  <span className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                    {label}
                    {isAuditField(field) && <span className="ml-1 text-[10px] text-gray-300 font-normal">(auto)</span>}
                    {isIdField(field) && <span className="ml-1 text-[10px] text-gray-300 font-normal">(auto-gen)</span>}
                  </span>
                }
                required={isRequired && !disabled}
                help={fieldError}
                validateStatus={fieldError ? "error" : ""}
                className="mb-4"
              >
                {fieldType === "file" ? (
                  <UploadField
                    id={`field-${idx}`}
                    files={files[field] || []}
                    existing={existingAttachments[field] || []}
                    onFilesChange={(f) => onFileChange?.(field, f)}
                    onDeleteExisting={onDeleteAttachment}
                    disabled={isViewMode}
                  />
                ) : (
                  renderAntField(
                    field,
                    label,
                    fieldType,
                    finalOptions,
                    value,
                    onChange,
                    disabled
                  )
                )}
              </Form.Item>
            );
          })}
        </Form>
      </ConfigProvider>
    </div>
  );
}

const Divider = ({ className }: { className?: string }) => <div className={`h-[1px] bg-gray-100 ${className}`} />;

function getFileIcon(mimeType: string) {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) {
    return <FileImageOutlined className="text-blue-500" />;
  }
  if (mime === "application/pdf") {
    return <FilePdfOutlined className="text-red-500" />;
  }
  if (mime.startsWith("text/")) {
    return <FileTextOutlined className="text-gray-600" />;
  }
  return <FileTextOutlined className="text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function UploadField({
  id,
  files,
  existing = [],
  onFilesChange,
  onDeleteExisting,
  disabled
}: {
  id: string;
  files: File[];
  existing?: { id: string; filename: string; path: string; mimeType: string; size?: number }[];
  onFilesChange?: (f: File[]) => void;
  onDeleteExisting?: (id: string) => void;
  disabled?: boolean
}) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);

  const handleViewAttachment = (file: any) => {
    setSelectedAttachment(file);
    setViewerVisible(true);
  };

  return (
    <div className="space-y-4">
      {/* Existing Files */}
      {existing.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Attached Files ({existing.length})</Text>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {existing.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-lg flex-shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm text-blue-900 truncate font-medium"
                      title={file.filename}
                    >
                      {file.filename}
                    </p>
                    {file.size && (
                      <p className="text-xs text-blue-600">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                </div>
                <Space size="small" className="flex-shrink-0">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                    onClick={() => handleViewAttachment(file)}
                    title="View file"
                  />
                  {!disabled && (
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="hover:bg-red-50 transition-colors"
                      onClick={() => onDeleteExisting?.(file.id)}
                      title="Delete file"
                    />
                  )}
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Files Upload */}
      {!disabled && (
        <>
          {existing.length > 0 && <AntDivider className="my-3" />}
          <div>
            <Upload
              id={id}
              multiple
              beforeUpload={() => false}
              onChange={(info: UploadChangeParam<UploadFile>) => {
                const fileList = info.fileList.map(f => f.originFileObj as File).filter(Boolean);
                onFilesChange?.(fileList);
              }}
              fileList={files.map((f, i) => ({
                uid: String(i),
                name: f.name,
                status: 'done',
                originFileObj: f
              }))}
            >
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer bg-blue-50/10">
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadOutlined className="text-2xl text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Click to select files
                  </span>
                  <span className="text-xs text-gray-500">
                    or drag and drop (Images, PDFs, Documents, etc.)
                  </span>
                </div>
              </div>
            </Upload>

            {/* Pending Uploads */}
            {files.length > 0 && (
              <div className="mt-3">
                <Text className="text-xs font-semibold text-amber-600">
                  ⚠️ {files.length} file(s) pending upload - will upload on save
                </Text>
                <div className="mt-2 space-y-1">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-amber-50 border border-amber-100 rounded text-sm"
                    >
                      <span className="text-amber-900 truncate">{file.name}</span>
                      <span className="text-xs text-amber-700 ml-2 flex-shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* No Files Message */}
      {disabled && existing.length === 0 && (
        <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-lg">
          <Text type="secondary" className="text-sm">
            📎 No files attached
          </Text>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      <AttachmentViewer
        visible={viewerVisible}
        attachment={selectedAttachment}
        onClose={() => {
          setViewerVisible(false);
          setSelectedAttachment(null);
        }}
        onDelete={onDeleteExisting}
        canDelete={!disabled}
      />
    </div>
  );
}

function renderAntField(
  field: string,
  label: string,
  type: string,
  options: { label: string; value: string }[],
  value: string,
  onChange: (field: string, value: string) => void,
  disabled: boolean
) {
  if (disabled && type !== "status") {
    return <Input value={value} disabled className="bg-gray-50" />;
  }

  switch (type) {
    case "select":
    case "status":
      return (
        <div className="space-y-2">
          <Select
            showSearch
            className="w-full"
            placeholder={`Select ${label}`}
            value={value || undefined}
            onChange={(v: string) => onChange(field, v)}
            disabled={disabled && type === "select"}
            options={options}
            optionFilterProp="label"
          />
          {type === "status" && value && (
            <div className="mt-1">
              <StatusBadge status={value} />
            </div>
          )}
        </div>
      );

    case "datetime":
      return (
        <DatePicker
          showTime
          className="w-full"
          value={value ? dayjs(value) : null}
          onChange={(date) => onChange(field, date ? date.toISOString() : "")}
          disabled={disabled}
        />
      );

    case "date":
      return (
        <DatePicker
          className="w-full"
          value={value ? dayjs(value) : null}
          onChange={(date) => onChange(field, date ? date.format("YYYY-MM-DD") : "")}
          disabled={disabled}
        />
      );

    case "textarea":
      return (
        <TextArea
          rows={3}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(field, e.target.value)}
          placeholder={`Enter ${label}...`}
          disabled={disabled}
        />
      );

    default:
      if (options && options.length > 0) {
         return (
            <AutoComplete
              className="w-full"
              value={value}
              onChange={(v: string) => onChange(field, v)}
              placeholder={`Enter or select ${label}...`}
              disabled={disabled}
              options={options}
              filterOption={(inputValue: string, option: any) =>
                option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
            />
         );
      }
      return (
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(field, e.target.value)}
          placeholder={disabled ? "" : `Enter ${label}...`}
          disabled={disabled}
        />
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let color = "default";

  if (lower.includes("new") || lower.includes("open") || lower.includes("draft")) color = "blue";
  else if (lower.includes("progress") || lower.includes("contacted") || lower.includes("scheduled")) color = "orange";
  else if (lower.includes("complete") || lower.includes("pass") || lower.includes("approved") || lower.includes("qualified") || lower.includes("success")) color = "green";
  else if (lower.includes("fail") || lower.includes("reject") || lower.includes("cancel") || lower.includes("closed") || lower.includes("error")) color = "red";
  else if (lower.includes("hold") || lower.includes("pending")) color = "warning";

  return <Badge status={color as any} text={status} className="font-medium text-xs uppercase" />;
}
