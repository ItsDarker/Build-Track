/**
 * Kanban board configuration for all BuildTrack modules
 * Defines status field names, column definitions, and card display metadata
 */

export interface KanbanColumn {
  title: string;
  key: string;
  color: string;
}

export interface ModuleKanbanConfig {
  statusFieldKey: string; // cleanLabel key into record object (e.g., "Lead Status", "Quote Status")
  columns: KanbanColumn[]; // ordered column definitions
  cardTitleFieldKey: string; // field key used as card title (e.g., "Lead ID", "Quote ID")
  cardMetaFieldKeys: string[]; // fields shown as metadata on card (small text, tags)
}

// Color palette for status columns
const COLORS = {
  gray: "#6B7280", // New, Draft, Not Packed, Planned, Pending, Open
  blue: "#3B82F6", // In Progress, Sent, Contacted, Scheduled, Assigned
  amber: "#F59E0B", // On Hold, Partially Received, Delayed, Revision Requested, Overdue
  green: "#10B981", // Completed, Done, Delivered, Approved, Paid, Pass, Received, Final
  red: "#EF4444", // Rejected, Failed Attempt, Cancelled, Closed, Fail
  purple: "#8B5CF6", // Sent for Review, Staged, Out for Delivery, Revised
  teal: "#14B8A6", // Qualified, Ready, Ready for QC
  indigo: "#6366F1", // Partially Paid
};

export const MODULE_KANBAN_CONFIGS: Record<string, ModuleKanbanConfig> = {
  "crm-leads": {
    statusFieldKey: "Lead Status",
    columns: [
      { title: "New", key: "New", color: COLORS.gray },
      { title: "Contacted", key: "Contacted", color: COLORS.blue },
      { title: "Qualified", key: "Qualified", color: COLORS.teal },
      { title: "Closed", key: "Closed", color: COLORS.green },
    ],
    cardTitleFieldKey: "Project Name / Reference",
    cardMetaFieldKeys: ["Lead ID", "Customer Name"],
  },

  "project-requirements": {
    statusFieldKey: "Task Status",
    columns: [
      { title: "New", key: "New", color: COLORS.gray },
      { title: "In Progress", key: "In Progress", color: COLORS.blue },
      { title: "Completed", key: "Completed", color: COLORS.green },
    ],
    cardTitleFieldKey: "Project Name",
    cardMetaFieldKeys: ["Requirement ID", "Priority"],
  },

  "design-configurator": {
    statusFieldKey: "Design Status",
    columns: [
      { title: "Draft", key: "Draft", color: COLORS.gray },
      { title: "Sent for Review", key: "Sent for Review", color: COLORS.purple },
      { title: "Revision Requested", key: "Revision Requested", color: COLORS.amber },
      { title: "Approved", key: "Approved", color: COLORS.green },
      { title: "Archived", key: "Archived", color: COLORS.gray },
    ],
    cardTitleFieldKey: "Design Name",
    cardMetaFieldKeys: ["Design ID", "Customer Name"],
  },

  "quoting-contracts": {
    statusFieldKey: "Quote Status",
    columns: [
      { title: "Draft", key: "Draft", color: COLORS.gray },
      { title: "Sent", key: "Sent", color: COLORS.blue },
      { title: "Revised", key: "Revised", color: COLORS.indigo },
      { title: "Accepted", key: "Accepted", color: COLORS.green },
      { title: "Rejected", key: "Rejected", color: COLORS.red },
      { title: "Expired", key: "Expired", color: COLORS.red },
    ],
    cardTitleFieldKey: "Quote Name",
    cardMetaFieldKeys: ["Quote ID", "Total Amount"],
  },

  "approval-workflow": {
    statusFieldKey: "Status",
    columns: [
      { title: "Pending", key: "Pending", color: COLORS.gray },
      { title: "Approved", key: "Approved", color: COLORS.green },
      { title: "Rejected", key: "Rejected", color: COLORS.red },
    ],
    cardTitleFieldKey: "Approval Type",
    cardMetaFieldKeys: ["Approval ID", "Approver (internal user)"],
  },

  "job-confirmation": {
    statusFieldKey: "Status",
    columns: [
      { title: "Open", key: "Open", color: COLORS.gray },
      { title: "In Production", key: "In Production", color: COLORS.blue },
      { title: "Ready", key: "Ready", color: COLORS.teal },
      { title: "Delivered", key: "Delivered", color: COLORS.green },
      { title: "Closed", key: "Closed", color: COLORS.gray },
    ],
    cardTitleFieldKey: "Order ID",
    cardMetaFieldKeys: ["Accepted Quote ID", "Customer Reference"],
  },

  "work-orders": {
    statusFieldKey: "Status",
    columns: [
      { title: "Assigned", key: "Assigned", color: COLORS.blue },
      { title: "In Progress", key: "In Progress", color: COLORS.blue },
      { title: "On Hold", key: "On Hold", color: COLORS.amber },
      { title: "Ready for QC", key: "Ready for QC", color: COLORS.teal },
      { title: "Completed", key: "Completed", color: COLORS.green },
    ],
    cardTitleFieldKey: "Work Description",
    cardMetaFieldKeys: ["Work Order ID", "Assigned To"],
  },

  "support-warranty": {
    statusFieldKey: "Status",
    columns: [
      { title: "Open", key: "Open", color: COLORS.gray },
      { title: "In Progress", key: "In Progress", color: COLORS.blue },
      { title: "On Hold", key: "On Hold", color: COLORS.amber },
      { title: "Resolved", key: "Resolved", color: COLORS.green },
      { title: "Closed", key: "Closed", color: COLORS.gray },
    ],
    cardTitleFieldKey: "Issue Description",
    cardMetaFieldKeys: ["Support Ticket ID", "Priority"],
  },

  "bom-materials-planning": {
    statusFieldKey: "BOM Status",
    columns: [
      { title: "Draft", key: "Draft", color: COLORS.gray },
      { title: "Final", key: "Final", color: COLORS.green },
    ],
    cardTitleFieldKey: "Product Name",
    cardMetaFieldKeys: ["BOM ID", "Total Items"],
  },

  "procurement": {
    statusFieldKey: "PO Status",
    columns: [
      { title: "Draft", key: "Draft", color: COLORS.gray },
      { title: "Sent", key: "Sent", color: COLORS.blue },
      { title: "Partially Received", key: "Partially Received", color: COLORS.amber },
      { title: "Received", key: "Received", color: COLORS.green },
      { title: "Closed", key: "Closed", color: COLORS.gray },
    ],
    cardTitleFieldKey: "Supplier Name",
    cardMetaFieldKeys: ["PO ID", "Order Date"],
  },

  "production-scheduling": {
    statusFieldKey: "Status",
    columns: [
      { title: "Planned", key: "Planned", color: COLORS.gray },
      { title: "Scheduled", key: "Scheduled", color: COLORS.blue },
      { title: "In Progress", key: "In Progress", color: COLORS.blue },
      { title: "Done", key: "Done", color: COLORS.green },
      { title: "Delayed", key: "Delayed", color: COLORS.amber },
    ],
    cardTitleFieldKey: "Schedule Entry ID",
    cardMetaFieldKeys: ["Work Center / Station", "Planned Start"],
  },

  "manufacturing": {
    statusFieldKey: "Task Status",
    columns: [
      { title: "New", key: "New", color: COLORS.gray },
      { title: "In Progress", key: "In Progress", color: COLORS.blue },
      { title: "Completed", key: "Completed", color: COLORS.green },
    ],
    cardTitleFieldKey: "Product Name",
    cardMetaFieldKeys: ["Execution Log ID", "Assigned To"],
  },

  "quality-control": {
    statusFieldKey: "Task Status",
    columns: [
      { title: "New", key: "New", color: COLORS.gray },
      { title: "In Progress", key: "In Progress", color: COLORS.blue },
      { title: "Completed", key: "Completed", color: COLORS.green },
    ],
    cardTitleFieldKey: "Product Name",
    cardMetaFieldKeys: ["QC Record ID", "Inspection Date"],
  },

  "packaging": {
    statusFieldKey: "Packing Status",
    columns: [
      { title: "Not Packed", key: "Not Packed", color: COLORS.gray },
      { title: "Packed", key: "Packed", color: COLORS.green },
      { title: "Staged", key: "Staged", color: COLORS.purple },
    ],
    cardTitleFieldKey: "Product Name",
    cardMetaFieldKeys: ["Packing ID", "Packed Date"],
  },

  "delivery-installation": {
    statusFieldKey: "Status",
    columns: [
      { title: "Scheduled", key: "Scheduled", color: COLORS.blue },
      { title: "Out for Delivery", key: "Out for Delivery", color: COLORS.purple },
      { title: "Delivered", key: "Delivered", color: COLORS.green },
      { title: "Installed", key: "Installed", color: COLORS.green },
      { title: "Failed Attempt", key: "Failed Attempt", color: COLORS.red },
    ],
    cardTitleFieldKey: "Delivery Job ID",
    cardMetaFieldKeys: ["Assigned Driver/Installer", "Scheduled Date/Time Window"],
  },

  "billing-invoicing": {
    statusFieldKey: "Invoice Status",
    columns: [
      { title: "Draft", key: "Draft", color: COLORS.gray },
      { title: "Sent", key: "Sent", color: COLORS.blue },
      { title: "Paid", key: "Paid", color: COLORS.green },
      { title: "Partially Paid", key: "Partially Paid", color: COLORS.indigo },
      { title: "Overdue", key: "Overdue", color: COLORS.amber },
    ],
    cardTitleFieldKey: "Customer Name",
    cardMetaFieldKeys: ["Invoice ID", "Amount Due"],
  },

  "closure": {
    statusFieldKey: "Close Reason",
    columns: [
      { title: "Completed", key: "Completed", color: COLORS.green },
      { title: "Cancelled", key: "Cancelled", color: COLORS.red },
    ],
    cardTitleFieldKey: "Project Name",
    cardMetaFieldKeys: ["Closure Record ID", "Closure Date"],
  },
};

// Special mapping for Projects custom page (uses enum status)
export const PROJECT_KANBAN_CONFIG: ModuleKanbanConfig = {
  statusFieldKey: "status",
  columns: [
    { title: "Planning", key: "PLANNING", color: COLORS.gray },
    { title: "In Progress", key: "IN_PROGRESS", color: COLORS.blue },
    { title: "On Hold", key: "ON_HOLD", color: COLORS.amber },
    { title: "Completed", key: "COMPLETED", color: COLORS.green },
    { title: "Cancelled", key: "CANCELLED", color: COLORS.red },
  ],
  cardTitleFieldKey: "name",
  cardMetaFieldKeys: ["projectManager.name", "startDate"],
};
