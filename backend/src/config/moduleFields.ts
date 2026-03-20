/**
 * Centralized field names for BuildTrack modules.
 * This ensures that the backend auto-chain logic uses the same strings 
 * as the frontend buildtrack.config.json.
 */
export const FIELD_KEYS = {
  // Common Fields
  TASK_STATUS: 'Task Status (New, In Progress, Completed)',
  
  // Lead / CRM
  LEAD_STATUS: 'Lead Status (New, Contacted, Qualified, Closed)',
  
  // Requirements
  REQUIREMENT_ID: 'Requirement Record ID',
  
  // Design
  DESIGN_STATUS: 'Design Status (Draft, Sent for Review, Revision Requested, Approved, Archived)',
  
  // Project Info (Internal Keys)
  PROJECT_ID: '_projectId',
  PROJECT_CODE: '_projectCode',
  PROJECT_NAME: '_projectName',
  TASK_ID: '_taskId',
};

/**
 * Maps status values to their "Completed" counterparts for auto-chaining logic.
 */
export const COMPLETION_STATUSES: Record<string, string[]> = {
  'crm-leads': ['Closed'],
  'project-requirements': ['Completed'],
  'design-configurator': ['Approved'],
};

/**
 * Maps module slugs to permission resource names used in the seed.
 */
export const SLUG_TO_RESOURCE: Record<string, string> = {
  "crm-leads": "crm",
  "quoting-contracts": "quoting",
  "project-requirements": "project",
  "design-configurator": "project",
  "approval-workflow": "project",
  "job-confirmation": "work_orders",
  "work-orders": "work_orders",
  "support-warranty": "work_orders",
  "bom-materials-planning": "inventory",
  "procurement": "inventory",
  "production-scheduling": "scheduling",
  "manufacturing": "production",
  "quality-control": "qc",
  "packaging": "production",
  "delivery-installation": "delivery",
  "billing-invoicing": "finance",
  "closure": "finance",
};
