/**
 * RBAC — Single source of truth for role-based access control.
 *
 * Maps config display-name roles to DB system-name roles,
 * encodes the authoritative access-control matrix from the
 * BuildTrack User Roles Documentation, and exposes helpers
 * used by both sidebar filtering and module-page guards.
 */

// ---------------------------------------------------------------------------
// Role name mappings
// ---------------------------------------------------------------------------

/** Config display-name → DB system-name */
export const ROLE_MAP: Record<string, string> = {
  Admin: "SUPER_ADMIN",
  "Project Manager": "PROJECT_MANAGER",
  Sales: "SALES_MANAGER",
  // Old aliases (backward-compat)
  Client: "CLIENT",
  "Design Team": "PROJECT_COORDINATOR",
  "Production Team": "PRODUCTION_MANAGER",
  "Quality Control": "QC_MANAGER",
  Finance: "FINANCE_MANAGER",
  Procurement: "PROCUREMENT_MANAGER",
  Logistics: "LOGISTICS_MANAGER",
  Support: "VENDOR",
  // New canonical display names (BT0008 spec) — override inversion
  Customer: "CLIENT",
  Designer: "PROJECT_COORDINATOR",
  Planner: "PLANNER",
  Mfg: "PRODUCTION_MANAGER",
  QC: "QC_MANAGER",
};

/** DB system-name → config display-name */
export const REVERSE_ROLE_MAP: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(ROLE_MAP).map(([display, system]) => [system, display])
  ),
  ORG_ADMIN: "Admin", // both admin roles map to "Admin" display name
};

// ---------------------------------------------------------------------------
// Access levels
// ---------------------------------------------------------------------------

export type AccessLevel = "R" | "R/W";

/** Privileged roles that bypass all module-level checks → always R/W. */
export const ADMIN_ROLES = ["SUPER_ADMIN", "ORG_ADMIN"] as const;

// ---------------------------------------------------------------------------
// Module access matrix  (from BuildTrack User Roles Documentation.docx)
// ---------------------------------------------------------------------------
// SUPER_ADMIN and ORG_ADMIN are omitted — handled by ADMIN_ROLES check.

export const MODULE_ACCESS: Record<string, Record<string, AccessLevel>> = {
  "crm-leads": {
    PROJECT_MANAGER: "R/W",
    SALES_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R",
    CLIENT: "R", // Changed from R/W to R
  },
  "project-requirements": {
    PROJECT_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R/W",
    PROCUREMENT_MANAGER: "R",
    CLIENT: "R",
  },
  "design-configurator": {
    PROJECT_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R/W",
    CLIENT: "R",
  },
  "quoting-contracts": {
    PROJECT_MANAGER: "R/W",
    SALES_MANAGER: "R/W",
    FINANCE_MANAGER: "R/W",
  },
  "approval-workflow": {
    PROJECT_MANAGER: "R/W",
    SALES_MANAGER: "R",
    PROJECT_COORDINATOR: "R/W",
    CLIENT: "R/W",
  },
  "job-confirmation": {
    PROJECT_MANAGER: "R/W",
    SALES_MANAGER: "R/W",
    FINANCE_MANAGER: "R/W",
  },
  "work-orders": {
    PROJECT_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R/W",
    PRODUCTION_MANAGER: "R/W",
    QC_MANAGER: "R/W",
    PLANNER: "R",
  },
  "support-warranty": {
    PROJECT_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R/W",
    PRODUCTION_MANAGER: "R/W",
    PLANNER: "R/W",
    QC_MANAGER: "R",
    LOGISTICS_MANAGER: "R",
    CLIENT: "R",
  },
  "bom-materials-planning": {
    PROJECT_MANAGER: "R/W",
    PROCUREMENT_MANAGER: "R/W",
    PRODUCTION_MANAGER: "R/W",
    PLANNER: "R/W",
  },
  procurement: {
    PROJECT_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R",
    PROCUREMENT_MANAGER: "R/W",
    PRODUCTION_MANAGER: "R",
  },
  "production-scheduling": {
    PROJECT_MANAGER: "R/W",
    PROJECT_COORDINATOR: "R",
    PRODUCTION_MANAGER: "R/W",
    PLANNER: "R/W",
    LOGISTICS_MANAGER: "R",
  },
  manufacturing: {
    PROJECT_MANAGER: "R/W",
    PRODUCTION_MANAGER: "R/W",
    QC_MANAGER: "R",
  },
  "quality-control": {
    PROJECT_MANAGER: "R/W",
    QC_MANAGER: "R/W",
    PRODUCTION_MANAGER: "R",
  },
  packaging: {
    PROJECT_MANAGER: "R/W",
    PROCUREMENT_MANAGER: "R",
    PRODUCTION_MANAGER: "R/W",
    LOGISTICS_MANAGER: "R",
  },
  "delivery-installation": {
    PROJECT_MANAGER: "R/W",
    LOGISTICS_MANAGER: "R/W",
    CLIENT: "R",
  },
  "billing-invoicing": {
    PROJECT_MANAGER: "R/W",
    FINANCE_MANAGER: "R/W",
    SALES_MANAGER: "R",
    CLIENT: "R/W",
  },
  closure: {
    PROJECT_MANAGER: "R/W",
    FINANCE_MANAGER: "R/W",
    LOGISTICS_MANAGER: "R/W",
    CLIENT: "R",
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Get the access level for a DB role on a module. Returns null if no access. */
export function getAccessLevel(
  dbRoleName: string,
  moduleSlug: string
): AccessLevel | null {
  if ((ADMIN_ROLES as readonly string[]).includes(dbRoleName)) return "R/W";
  return MODULE_ACCESS[moduleSlug]?.[dbRoleName] ?? null;
}

/** Can the role access the module at all (R or R/W)? */
export function canAccessModule(
  dbRoleName: string,
  moduleSlug: string
): boolean {
  return getAccessLevel(dbRoleName, moduleSlug) !== null;
}

/** Does the role have write (R/W) access to the module? */
export function canWriteModule(
  dbRoleName: string,
  moduleSlug: string
): boolean {
  return getAccessLevel(dbRoleName, moduleSlug) === "R/W";
}
