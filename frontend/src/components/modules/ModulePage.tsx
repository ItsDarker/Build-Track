"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, Modal, Button as AntButton, Tag, Empty, Tooltip, App, Select as AntSelect } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicFormRenderer, isFileField } from "./DynamicFormRenderer";

import type { FormMode } from "./DynamicFormRenderer";
import type { ModuleConfig } from "@/config/buildtrack.config";
import { getAllModules } from "@/config/buildtrack.config";
import { ShieldCheck } from "lucide-react";
import { downloadExcel } from "@/lib/downloadExcel";
import { useUser } from "@/lib/context/UserContext";
import {
  canAccessModule,
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

/** Detects assignee-type fields based on naming patterns */
function findAssigneeFields(fields: string[]): string[] {
  const assigneeKeywords = [
    "assigned to",
    "assignee",
    "inspector",
    "operator",
    "technician",
    "driver",
    "installer",
    "crew",
    "approver",
    "planner",
    "packed by",
    "closed by",
    "prepared by",
    "owner",
    "assigned crew",
    "rework assigned to",
    "manager",
    "coordinator",
  ];

  return fields.filter((field) => {
    const lower = field.toLowerCase();
    return assigneeKeywords.some((kw) => lower.includes(kw));
  });
}

/** Detects ID fields (auto-populated, read-only) */
function findIdFields(fields: string[]): string[] {
  return fields.filter((field) => {
    const lower = field.toLowerCase();
    return lower.includes("id") && !lower.includes("video");
  });
}

/** Generates an ID value based on module name and a timestamp */
function generateId(moduleName: string, index: number = 0): string {
  const prefix = moduleName
    .split(/[\s\/]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  // Use timestamp-based suffix for uniqueness, with index offset to ensure uniqueness when multiple IDs are generated
  const timestamp = Date.now().toString().slice(-6);
  const suffix = index > 0 ? `${timestamp}${index}` : timestamp;
  return `${prefix}-${suffix}`;
}

/** Detects Status fields */
function findStatusFields(fields: string[]): string[] {
  return fields.filter((field) => {
    const lower = field.toLowerCase();
    return lower.includes("status");
  });
}

/** Extracts the default (first) status option from a status field label */
function getDefaultStatus(fieldLabel: string): string | null {
  const match = fieldLabel.match(/\(([^)]+)\)/);
  if (!match) return null;
  const inner = match[1];
  const parts = inner.split(",").map((s) => s.trim());
  return parts.length > 0 ? parts[0] : null;
}

/** Extracts all options from a field label (e.g. "Status (A, B, C)") */
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
  const router = useRouter();
  const { modal } = App.useApp();
  const { role } = useUser();
  const hasReadAccess = canAccessModule(role.name, module.slug);
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
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; name?: string; email: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [lookups, setLookups] = useState<Record<string, { id: string; value: string; label: string; order: number }[]>>({});
  const [recordAttachments, setRecordAttachments] = useState<Record<string, { id: string; filename: string; path: string; mimeType: string }[]>>({});
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);


  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Check if user has read access before fetching
        if (!hasReadAccess) {
          if (!cancelled) setRecords([]);
          return;
        }

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
  }, [module.slug, hasReadAccess]);

  // Fetch assignable users for the Assign action (optional feature)
  useEffect(() => {
    let cancelled = false;

    // Use timeout to avoid blocking page load if endpoint is slow/unavailable
    const timeoutId = setTimeout(() => {
      fetch('/backend-api/teams/assignable', { credentials: 'include' })
        .then((r) => {
          if (!r.ok) {
            // Silently fail - Assign button will just be unavailable
            return { users: [] };
          }
          return r.json();
        })
        .then((d) => {
          if (!cancelled) setAssignableUsers(d.users ?? []);
        })
        .catch((err) => {
          if (!cancelled) setAssignableUsers([]);
        });

      fetch('/backend-api/projects', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { projects: [] }))
        .then((d) => {
          if (!cancelled) setProjects(d.projects ?? []);
        })
        .catch((err) => {
          if (!cancelled) setProjects([]);
        });

      fetch('/backend-api/clients', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { clients: [] }))
        .then((d) => {
          if (!cancelled) setClients(d.clients ?? []);
        })
        .catch((err) => {
          if (!cancelled) setClients([]);
        });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Fetch module-specific lookup options (scoped per module slug)
  useEffect(() => {
    let cancelled = false;
    if (!module.slug) return;

    fetch(`/backend-api/lookups?moduleSlug=${module.slug}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { lookups: {} }))
      .then((d) => {
        if (!cancelled) setLookups(d.lookups ?? {});
      })
      .catch((err) => {
        if (!cancelled) setLookups({});
      });
    return () => { cancelled = true; };
  }, [module.slug]);

  const dynamicOptions = useMemo(() => {
    const opts: Record<string, { label: string; value: string }[]> = {};

    module.fields.forEach((field) => {
      const label = cleanLabel(field);
      const lower = label.toLowerCase();
      const options = extractOptions(field);

      // Start with hardcoded/config options if they exist
      if (options && options.length > 0) {
        opts[label] = options.map(o => ({ value: o, label: o }));
      }

      // Relational data (Projects, Clients, Users)
      if (lower.includes("project id") || lower.includes("project reference") || lower.includes("linked project")) {
        opts[label] = projects.map((p) => ({ value: p.id, label: p.name }));
      } else if (lower.includes("project name")) {
        opts[label] = projects.map((p) => ({ value: p.name, label: p.name }));
      } else if (lower.includes("customer name") || lower.includes("client name")) {
        opts[label] = clients.map((c) => ({ value: c.name, label: c.name }));
      } else if (lower.includes("customer") || lower.includes("client")) {
        opts[label] = clients.map((c) => ({ value: c.id, label: c.name }));
      } else if (findAssigneeFields([label]).length > 0) {
        opts[label] = assignableUsers.map((u) => ({ value: String(u.name || u.email), label: String(u.name || u.email) }));
      }
    });

    // Merge/Overwrite with backend lookups (Admin-configured)
    Object.keys(lookups).forEach((category) => {
      if (lookups[category] && lookups[category].length > 0) {
        opts[category] = lookups[category].map((l) => ({ value: l.value, label: l.label }));
      }
    });

    return opts;
  }, [module.fields, projects, clients, assignableUsers, lookups]);

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
  }, [tableFields, hasWriteAccess]);

  const fetchAttachments = async (recordId: string) => {
    try {
      const res = await fetch(`/backend-api/attachments/record/${recordId}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        // Group attachments by field
        // Since backend only links by recordId, we'll show all attachments in the first file field
        const fileFields = module.fields.filter(f => isFileField(f));
        const grouped: Record<string, any[]> = {};
        if (fileFields.length > 0 && data.attachments) {
          // Map attachments to include all metadata
          grouped[cleanLabel(fileFields[0])] = data.attachments.map((a: any) => ({
            id: a.id,
            filename: a.filename,
            path: a.path,
            mimeType: a.mimeType,
            size: a.size,
            createdAt: a.createdAt,
            uploadedBy: a.uploadedBy
          }));
        }
        setRecordAttachments(grouped);
      }
    } catch (e) {
      console.error("Failed to fetch attachments:", e);
    }
  };

  const uploadFiles = async (recordId: string) => {
    const fieldsWithFiles = Object.keys(formFiles).filter(k => formFiles[k].length > 0);
    if (fieldsWithFiles.length === 0) return;

    for (const field of fieldsWithFiles) {
      const formData = new FormData();
      formFiles[field].forEach(file => {
        formData.append("files", file);
      });
      formData.append("moduleRecordId", recordId);

      try {
        const res = await fetch("/backend-api/attachments/upload", {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error(`Failed to upload files for field ${field}:`, errorData);
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }

        // Upload successful
        const data = await res.json();
        console.log(`Successfully uploaded ${data.attachments.length} file(s) for field ${field}`);
      } catch (e) {
        console.error(`Failed to upload files for field ${field}:`, e);
        // Don't throw - allow save to complete even if attachment upload fails
      }
    }
  };

  const deleteAttachment = async (id: string) => {
    try {
      const res = await fetch(`/backend-api/attachments/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        // Refresh attachments
        if (activeRecordId) fetchAttachments(activeRecordId);
      }
    } catch (e) {
      console.error("Failed to delete attachment:", e);
    }
  };

  const openModal = async (mode: FormMode, record?: Record<string, string>) => {
    setModalMode(mode);
    setRecordAttachments({});
    if (record) {
      setActiveRecordId(record._id);
      setFormValues({ ...record });
      await fetchAttachments(record._id);
    } else {
      setActiveRecordId(null);
      const initialValues: Record<string, string> = {};
      // Auto-populate in create mode
      if (mode === "create") {
        // Auto-populate ID fields with index offset to ensure uniqueness
        const idFields = findIdFields(module.fields);
        idFields.forEach((field, index) => {
          initialValues[field] = generateId(module.name, index);
        });

        // Auto-populate Status fields with their default value
        const statusFields = findStatusFields(module.fields);
        statusFields.forEach((field) => {
          const defaultStatus = getDefaultStatus(field);
          if (defaultStatus) {
            initialValues[field] = defaultStatus;
          }
        });
      }
      setFormValues(initialValues);
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

  /**
   * Shared save logic for both create and edit operations.
   * Returns true on success, false on failure.
   */
  const saveRecord = async (values?: Record<string, string>): Promise<boolean> => {
    const valuesToSave = values || formValues;

    // Validate form before submission
    if (!validateForm()) {
      modal.error({
        title: "Validation Error",
        content: "Please fill in all required fields (marked with *).",
      });
      return false;
    }

    try {
      setLoading(true);
      const isEdit = modalMode === "edit";
      const url = isEdit
        ? `/backend-api/modules/${module.slug}/records/${activeRecordId}`
        : `/backend-api/modules/${module.slug}/records`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: valuesToSave }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        handleValidationError(errorData);
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const savedData = await res.json();
      const savedRecordId = savedData.record?.id || activeRecordId;

      // Handle file uploads separately
      if (savedRecordId) {
        await uploadFiles(savedRecordId);
        // Refetch attachments after upload so they display properly
        await fetchAttachments(savedRecordId);
      }

      modal.success({
        title: isEdit ? "Record Updated" : "Record Created",
        content: `Successfully ${isEdit ? "updated" : "created"} record.`,
      });

      // Close modal
      setModalOpen(false);
      setFormFiles({}); // Clear pending files from state

      // Refresh records list without page reload
      try {
        const listRes = await fetch(`/backend-api/modules/${module.slug}/records`, {
          credentials: "include"
        });
        if (listRes.ok) {
          const data = await listRes.json();
          const mapped = (data.records ?? []).map((r: any) => ({
            _id: r.id,
            ...(r.data ?? {}),
            "Created at": r.createdAt ? String(r.createdAt).slice(0, 16) : "",
            "Update at": r.updatedAt ? String(r.updatedAt).slice(0, 16) : "",
            "Created by": r.createdById ?? "",
            "Updated by": r.updatedById ?? "",
          }));
          setRecords(mapped);
        }
      } catch (e) {
        console.error("Failed to refresh records list:", e);
      }

      return true; // Indicate success
    } catch (e: any) {
      console.error("Save error:", e);
      modal.error({ title: "Save Failed", content: e.message });
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const success = await saveRecord();
    if (success) {
      setFormValues({});
      // setFormFiles is cleared in saveRecord
    }
  };

  const handleEdit = async () => {
    if (!activeRecordId) return;

    const success = await saveRecord();
    if (success) {
      setFormValues({});
      // setFormFiles is cleared in saveRecord
    }
  };

  const handleAssignUser = (userId: string) => {
    const user = assignableUsers.find((u) => u.id === userId);
    if (!user) return;
    const displayName = user.name || user.email;
    const assigneeFields = findAssigneeFields(module.fields);

    // Populate all matching fields with the selected user's display name
    assigneeFields.forEach((f) => {
      setFormValues((prev) => ({ ...prev, [f]: displayName }));
    });
    setAssignPickerOpen(false);
  };

  const handleComplete = async () => {
    // 1. Set Task Status field to "Completed"
    const statusField = module.fields.find((f) =>
      f.toLowerCase().includes("task status")
    );

    const updatedValues = { ...formValues };
    if (statusField) {
      updatedValues[statusField] = "Completed";
      setFormValues(updatedValues);
    }

    // 2. Save the record
    const savedOk = await saveRecord(updatedValues);
    if (!savedOk) return;

    // 3. Close modal
    setModalOpen(false);

    // 4. Find next module in workflow
    const allMods = getAllModules();
    const currentIndex = allMods.findIndex((m) => m.slug === module.slug);
    const nextModule = allMods[currentIndex + 1];

    // 5. Navigate to next module or show done message
    if (nextModule) {
      modal.success({
        title: "Task Completed",
        content: `Moving to next step: ${nextModule.name}`,
        onOk: () => router.push(`/app/modules/${nextModule.slug}`),
        okText: "Go to next step",
      });
    } else {
      modal.success({
        title: "Workflow Complete",
        content: "All workflow steps are done.",
      });
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

  // Check if user has access to this module
  if (!hasReadAccess) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900">{module.name}</h1>
          <p className="text-red-600 mt-4">Access Denied</p>
          <p className="text-gray-500 mt-2">You don't have permission to view this module.</p>
        </div>
      </div>
    );
  }

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
          {/* Configure Fields button visible to Admins only */}
          {(role.name === 'SUPER_ADMIN' || role.name === 'ORG_ADMIN' || role.name === 'ADMIN') && (
            <Button
              variant="outline"
              className="gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => router.push(`/admin/modules/${module.slug}/fields`)}
            >
              <SettingOutlined />
              Configure Fields
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
            <div className="flex justify-between gap-2">
              {modalMode === "edit" && assignableUsers.length > 0 && (
                <AntButton
                  icon={<UserSwitchOutlined />}
                  onClick={() => setAssignPickerOpen(true)}
                >
                  Assign
                </AntButton>
              )}
              <div className="flex gap-2">
                <AntButton onClick={() => setModalOpen(false)}>
                  Cancel
                </AntButton>
                <AntButton
                  type="primary"
                  danger={false}
                  loading={loading}
                  onClick={modalMode === "create" ? handleCreate : handleEdit}
                >
                  {modalMode === "create" ? "Create" : "Save"}
                </AntButton>
                {modalMode === "edit" && (
                  <AntButton
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={loading}
                    onClick={handleComplete}
                  >
                    Complete
                  </AntButton>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {module.fields.length > 0 ? (
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
              dynamicOptions={dynamicOptions}
              existingAttachments={recordAttachments}
              onDeleteAttachment={deleteAttachment}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Empty description="No fields defined for this module" />
          </div>
        )}
      </Modal>

      {/* Assign User Picker Modal */}
      <Modal
        title="Assign To"
        open={assignPickerOpen}
        footer={null}
        onCancel={() => setAssignPickerOpen(false)}
        width={380}
      >
        <AntSelect
          showSearch
          style={{ width: "100%" }}
          placeholder="Select a team member..."
          optionFilterProp="label"
          options={assignableUsers.map((u) => ({
            value: u.id,
            label: u.name || u.email,
          }))}
          onChange={handleAssignUser}
        />
      </Modal>
    </div>
  );
}
