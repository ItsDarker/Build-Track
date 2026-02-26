"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Table, Modal, Button as AntButton, Tag, Empty, Tooltip, App } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicFormRenderer } from "./DynamicFormRenderer";
import type { FormMode } from "./DynamicFormRenderer";
import type { ModuleConfig } from "@/config/buildtrack.config";
import { ShieldCheck } from "lucide-react";
import { downloadExcel } from "@/lib/downloadExcel";
import { useUser } from "@/lib/context/UserContext";
import {
  canWriteModule,
  MODULE_ACCESS,
  REVERSE_ROLE_MAP,
} from "@/config/rbac";

interface ModulePageProps {
  module: ModuleConfig;
}

/** Strip parenthetical hints from a field label for display */
function cleanLabel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function isSectionLabel(label: string): boolean {
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

const AUDIT_FIELDS = ["Created at", "Created by", "Update at", "Updated by"];

function isAuditField(label: string): boolean {
  return AUDIT_FIELDS.includes(label);
}

/**
 * Detects required fields based on naming patterns and section context.
 * Fields before "Optional:" section and with certain keywords are marked required.
 */
function detectRequiredFields(fields: string[]): Set<string> {
  const required = new Set<string>();
  const lower = (s: string) => s.toLowerCase().trim();

  let isInOptionalSection = false;

  for (const field of fields) {
    const fieldLower = lower(field);

    // Track when we enter optional section
    if (
      fieldLower === "optional:" ||
      fieldLower === "optional" ||
      fieldLower.includes("(optional)")
    ) {
      isInOptionalSection = true;
      continue;
    }

    // Skip section headers and audit fields
    if (
      fieldLower.endsWith("(table):") ||
      fieldLower === "mvp fields" ||
      fieldLower === "inventory (stock)" ||
      fieldLower === "receiving" ||
      AUDIT_FIELDS.includes(field)
    ) {
      continue;
    }

    // Fields before Optional section are generally required
    if (!isInOptionalSection) {
      // Skip obvious optional fields even if before Optional section
      if (!fieldLower.includes("photo") && !fieldLower.includes("attachment")) {
        required.add(field);
      }
    }
  }

  return required;
}

/** Generate mock records with a stable _id */
function generateMockRecords(mod: ModuleConfig): Record<string, string>[] {
  const fields = mod.fields.filter(
    (f) => !isSectionLabel(f) && !isAuditField(f)
  );

  const count = 5;
  const records: Record<string, string>[] = [];

  for (let i = 0; i < count; i++) {
    const record: Record<string, string> = {
      _id: `${mod.slug}-${1000 + i}`,
    };
    fields.forEach((field) => {
      record[field] = getMockValue(field, i, mod);
    });
    // Audit fields with proper datetime values
    const createdDate = new Date(Date.now() - (count - i) * 2 * 86400000);
    record["Created at"] = createdDate.toISOString().slice(0, 16);
    record["Created by"] = ["Admin", "John D.", "Sarah K.", "Mike R.", "Lisa T."][i % 5];
    const updatedDate = new Date(createdDate.getTime() + 86400000);
    record["Update at"] = updatedDate.toISOString().slice(0, 16);
    record["Updated by"] = ["Admin", "Sarah K.", "Mike R.", "John D.", "Admin"][i % 5];
    records.push(record);
  }

  return records;
}

function getMockValue(field: string, index: number, mod: ModuleConfig): string {
  const lower = field.toLowerCase();

  // Skip file fields — they don't get text mock values
  if (
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
  )
    return "";

  if (lower.includes("status")) {
    const match = field.match(/\(([^)]+)\)/);
    if (match) {
      const opts = match[1].split(",").map((s) => s.trim());
      return opts[index % opts.length];
    }
    return ["New", "In Progress", "Completed"][index % 3];
  }
  if (lower.includes("id") && !lower.includes("video")) {
    const prefix = mod.name
      .split(/[\s\/]+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    return `${prefix}-${1000 + index}`;
  }
  if (lower.includes("date"))
    return new Date(Date.now() + index * 86400000).toLocaleDateString();
  if (lower.includes("name") || lower.includes("customer"))
    return ["Acme Corp", "BuildRight Inc", "Home Pro Ltd", "Urban Design Co", "GreenBuild LLC"][
      index % 5
    ];
  if (lower.includes("priority")) return ["Low", "Medium", "High"][index % 3];
  if (lower.includes("email")) return `contact${index}@example.com`;
  if (lower.includes("phone")) return `555-010${index}`;
  if (lower.includes("address") || lower.includes("site"))
    return `${100 + index} Main St, Toronto, ON`;
  if (
    lower.includes("amount") ||
    lower.includes("cost") ||
    lower.includes("price") ||
    lower.includes("total") ||
    lower.includes("subtotal") ||
    lower.includes("balance") ||
    lower.includes("tax") ||
    lower.includes("discount")
  )
    return `$${(1000 + index * 500).toLocaleString()}`;
  if (lower.includes("qty") || lower.includes("quantity") || lower.includes("count"))
    return String(10 + index * 5);
  if (
    lower.includes("notes") ||
    lower.includes("description") ||
    lower.includes("comments") ||
    lower.includes("summary") ||
    lower.includes("instructions")
  )
    return `Sample notes for record ${index + 1}`;
  return `Value ${index + 1}`;
}

export function ModulePage({ module }: ModulePageProps) {
  const { modal } = App.useApp();
  const { role } = useUser();
  const hasWriteAccess = canWriteModule(role.name, module.slug);
  const [records, setRecords] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<FormMode>("create");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formFiles, setFormFiles] = useState<Record<string, File[]>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set());

 useEffect(() => {
  let cancelled = false;

  (async () => {
    try {
      setLoading(true);
      const res = await fetch(`/backend-api/modules/${module.slug}/records`, {
        credentials: "include"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mapped = (data.records ?? []).map((r: any) => ({
        _id: r.id,
        ...(r.data ?? {}),
        "Created at": r.createdAt ? String(r.createdAt).slice(0, 16) : "",
        "Update at": r.updatedAt ? String(r.updatedAt).slice(0, 16) : "",
        "Created by": r.createdById ?? "",
        "Updated by": r.updatedById ?? "",
      }));

      if (!cancelled) setRecords(mapped);
    } catch (e) {
      console.error("Failed to load module records:", e);
      if (!cancelled) setRecords([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [module.slug]);
 

  // Key fields for table columns (first 5 non-section, non-audit fields)
  const tableFields = useMemo(() => {
    return module.fields
      .filter((f) => !isSectionLabel(f) && !isAuditField(f))
      .slice(0, 5);
  }, [module]);

  const columns = useMemo(() => {
    const cols: Array<{
      title: string;
      dataIndex: string;
      key: string;
      ellipsis?: boolean;
      width?: number;
      render?: (text: any, record: Record<string, string>) => React.ReactNode;
    }> = tableFields.map((field) => {
      const label = cleanLabel(field);
      return {
        title: label.length > 25 ? label.slice(0, 23) + "..." : label,
        dataIndex: field,
        key: field,
        ellipsis: true,
        render: (text: any) => {
          if (!text) return "-";
          const lower = field.toLowerCase();
          if (lower.includes("status")) {
            const color =
              text.toLowerCase().includes("complete") ||
                text.toLowerCase().includes("approved") ||
                text.toLowerCase().includes("pass")
                ? "green"
                : text.toLowerCase().includes("progress") ||
                  text.toLowerCase().includes("sent") ||
                  text.toLowerCase().includes("scheduled")
                  ? "blue"
                  : text.toLowerCase().includes("reject") ||
                    text.toLowerCase().includes("fail") ||
                    text.toLowerCase().includes("overdue")
                    ? "red"
                    : "orange";
            return <Tag color={color}>{text}</Tag>;
          }
          if (lower.includes("priority")) {
            const color =
              text === "High" ? "red" : text === "Medium" ? "orange" : "blue";
            return <Tag color={color}>{text}</Tag>;
          }
          return text;
        },
      };
    });

    cols.push({
      title: "Actions",
      dataIndex: "__actions",
      key: "__actions",
      width: 120,
      render: (_: any, record: Record<string, string>) => (
        <div className="flex items-center gap-1">
          <Tooltip title="View">
            <AntButton
              icon={<EyeOutlined />}
              size="small"
              onClick={() => openModal("view", record)}
            />
          </Tooltip>
          {hasWriteAccess && (
            <Tooltip title="Edit">
              <AntButton
                icon={<EditOutlined />}
                size="small"
                onClick={() => openModal("edit", record)}
              />
            </Tooltip>
          )}
          {hasWriteAccess && (
            <Tooltip title="Delete">
              <AntButton
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(record._id)}
                danger
              />
            </Tooltip>
          )}
        </div>
      ),
    });

    return cols;
  }, [tableFields]);

  const openModal = (mode: FormMode, record?: Record<string, string>) => {
    setModalMode(mode);
    if (record) {
      setActiveRecordId(record._id);
      setFormValues({ ...record });
    } else {
      setActiveRecordId(null);
      setFormValues({});
    }
    setFormFiles({});
    setFieldErrors({});
    setRequiredFields(detectRequiredFields(module.fields));
    setModalOpen(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  /**
   * Handles validation errors from the backend.
   * Parses field-specific errors and shows a detailed error message.
   */
  const handleValidationError = (errorData: any) => {
    const fieldErrs: Record<string, string> = {};
    let mainErrorMsg = errorData.error || "Validation failed";

    // If backend returns field-specific errors, parse them
    if (errorData.fieldErrors && Array.isArray(errorData.fieldErrors)) {
      errorData.fieldErrors.forEach((err: any) => {
        if (err.field && err.message) {
          fieldErrs[err.field] = err.message;
        }
      });
      setFieldErrors(fieldErrs);
    }

    // Build a detailed error message
    const errorList = Object.entries(fieldErrs)
      .map(([field, msg]) => {
        const cleanedLabel = field
          .replace(/\s*\([^)]*\)\s*/g, "")
          .trim();
        return `• ${cleanedLabel}: ${msg}`;
      })
      .join("\n");

    const fullErrorMessage = errorList
      ? `${mainErrorMsg}\n\n${errorList}`
      : mainErrorMsg;

    modal.error({
      title: "Validation Error",
      content: (
        <div className="whitespace-pre-wrap text-sm">
          {fullErrorMessage}
        </div>
      ),
    });
  };

  /**
   * Validates form before submission.
   * Returns true if valid, false otherwise.
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Check required fields
    for (const field of requiredFields) {
      const value = formValues[field];
      if (!value || value.trim() === "") {
        const cleanedLabel = field
          .replace(/\s*\([^)]*\)\s*/g, "")
          .trim();
        errors[field] = `${cleanedLabel} is required`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (field: string, files: File[]) => {
    setFormFiles((prev) => ({ ...prev, [field]: files }));
  };

  const handleCreate = async () => {
    // Validate form before submission
    if (!validateForm()) {
      modal.error({
        title: "Validation Error",
        content: "Please fill in all required fields (marked with *).",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/backend-api/modules/${module.slug}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errorData = await res.json();
        handleValidationError(errorData);
        return;
      }

      const { record } = await res.json();

      const mapped: Record<string, any> = {
        _id: record.id,
        ...(record.data ?? {}),
        "Created at": String(record.createdAt).slice(0, 16),
        "Update at": String(record.updatedAt).slice(0, 16),
        "Created by": record.createdById ?? "",
        "Updated by": record.updatedById ?? "",
      };

      setRecords((prev) => [mapped, ...prev]);
      setFormValues({});
      setFormFiles({});
      setModalOpen(false);
    } catch (e) {
      console.error("Create failed:", e);
      modal.error({
        title: "Create Failed",
        content: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!activeRecordId) return;

    // Validate form before submission
    if (!validateForm()) {
      modal.error({
        title: "Validation Error",
        content: "Please fill in all required fields (marked with *).",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/backend-api/modules/${module.slug}/records/${activeRecordId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formValues),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        handleValidationError(errorData);
        return;
      }

      const { record } = await res.json();

      const mapped: Record<string, any> = {
        _id: record.id,
        ...(record.data ?? {}),
        "Created at": String(record.createdAt).slice(0, 16),
        "Update at": String(record.updatedAt).slice(0, 16),
        "Created by": record.createdById ?? "",
        "Updated by": record.updatedById ?? "",
      };

      setRecords((prev) =>
        prev.map((r) => (r._id === activeRecordId ? mapped : r))
      );
      setFormValues({});
      setFormFiles({});
      setModalOpen(false);
    } catch (e) {
      console.error("Update failed:", e);
      modal.error({
        title: "Update Failed",
        content: String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete Record",
      content: "Are you sure you want to delete this record? This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true, loading },
      onOk: async () => {
  try {
    setLoading(true);

    const res = await fetch(
      `/backend-api/modules/${module.slug}/records/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);

    setRecords((prev) => prev.filter((r) => r._id !== id));
  } catch (e) {
    console.error("Delete failed:", e);
    modal.error({ title: "Delete failed", content: String(e) });
    throw e; // optional but recommended (keeps confirm open on failure)
  } finally {
    setLoading(false);
  }
},

    });
  };


  const handleDownloadExcel = () => {
    // Build export data from all non-section fields
    const exportFields = module.fields.filter(
      (f) => !isSectionLabel(f)
    );
    const columns = exportFields.map((f) => ({
      header: cleanLabel(f),
      key: f,
    }));
    downloadExcel(records, columns, module.slug);
  };

  const modalTitle =
    modalMode === "create"
      ? `Create New ${module.name}`
      : modalMode === "edit"
        ? `Edit ${module.name}`
        : `${module.name} — Record Details`;

  const accessBadges = [
    { roleName: "Admin", level: "R/W" as const },
    ...Object.entries(MODULE_ACCESS[module.slug] ?? {}).map(
      ([dbRole, level]) => ({
        roleName: REVERSE_ROLE_MAP[dbRole] ?? dbRole,
        level,
      })
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{module.name}</h1>
          {module.description && (
            <p className="text-gray-500 mt-1 text-sm whitespace-pre-line">
              {module.description}
            </p>
          )}
          {/* Role access badges */}
          <div className="flex items-center flex-wrap gap-1.5 mt-3">
            <ShieldCheck className="w-4 h-4 text-gray-400 mr-0.5" />
            {accessBadges.map((entry) => (
              <Badge
                key={entry.roleName}
                variant={entry.roleName === "Admin" ? "default" : "secondary"}
                className="text-xs"
              >
                {entry.roleName}
                {entry.level === "R" ? " (view)" : ""}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadExcel}
          >
            <DownloadOutlined />
            Download Excel
          </Button>
          {hasWriteAccess && (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
              onClick={() => openModal("create")}
            >
              <PlusOutlined />
              Create New
            </Button>
          )}
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white rounded-lg border">
        {records.length === 0 ? (
          <div className="p-12">
            <Empty description="No records yet. Click 'Create New' to add one." />
          </div>
        ) : (
          <Table
            loading={loading}
            columns={columns}
            dataSource={records}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
            size="small"
          />
        )}
      </div>

      {/* Create / Edit / View Modal */}
      <Modal
        title={modalTitle}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={680}
        centered
        destroyOnHidden
        footer={
          modalMode !== "view" ? (
            <div className="flex justify-end gap-2">
              <AntButton onClick={() => setModalOpen(false)}>
                Cancel
              </AntButton>
              <AntButton
                type="primary"
                danger={false}
                loading={loading}
                onClick={modalMode === "create" ? handleCreate : handleEdit}
              >
                {modalMode === "create" ? "Create" : "Save Changes"}
              </AntButton>
            </div>
          ) : null
        }
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <DynamicFormRenderer
            fields={module.fields}
            values={formValues}
            onChange={handleFormChange}
            mode={modalMode}
            files={formFiles}
            onFileChange={handleFileChange}
            errors={fieldErrors}
            requiredFields={requiredFields}
          />
        </div>
      </Modal>
    </div>
  );
}
