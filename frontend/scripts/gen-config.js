/**
 * BuildTrack Config Generator
 * Reads the Excel spec file and generates frontend config files.
 * Usage: npm run gen:config
 */
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const EXCEL_PATH = path.resolve(__dirname, "../../Docs/Buildtrack Modules.xlsx");
const CONFIG_DIR = path.resolve(__dirname, "../src/config");
const JSON_OUT = path.join(CONFIG_DIR, "buildtrack.config.json");
const TS_OUT = path.join(CONFIG_DIR, "buildtrack.config.ts");

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[&]/g, "")
    .replace(/[\/]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Map raw Excel "Who" / "MVP User" text to standardised app roles.
 * Admin always has access to every module so it is added globally later.
 */
const ROLE_KEYWORDS = {
  Admin: ["admin"],
  "Project Manager": ["project coordinator", "project manager", "pm"],
  Sales: ["sales"],
  Client: ["client", "customer"],
  "Design Team": ["design"],
  "Production Team": ["production", "manufacturing", "assembly", "warehouse"],
  Finance: ["finance"],
  Procurement: ["procurement", "inventory"],
  "Quality Control": ["quality control", "qc", "inspection"],
  Logistics: ["logistics", "installation", "delivery", "driver"],
  Support: ["support", "service"],
};

function deriveRoles(whoRaw, mvpUserRaw) {
  const combined = `${whoRaw}, ${mvpUserRaw}`.toLowerCase();
  const matched = new Set();

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        matched.add(role);
        break;
      }
    }
  }

  // Admin always has access — added at display time, not stored per-module
  matched.delete("Admin");

  return Array.from(matched).sort();
}

function parsePageTab(ws) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Top nav items from rows 0-2
  const topNav = [];
  for (let r = 0; r < 3; r++) {
    const row = data[r] || [];
    for (const cell of row) {
      if (cell && typeof cell === "string" && cell.trim()) {
        topNav.push(cell.trim());
      }
    }
  }

  // Path mapping: strip "My " prefix for cleaner URLs
  function toPath(label) {
    return slugify(label.replace(/^My\s+/i, ""));
  }

  // Sidebar items from rows 3+
  const sidebar = [];
  let currentParent = null;

  for (let r = 3; r < data.length; r++) {
    const row = data[r] || [];
    const cell = row[0];
    if (!cell || typeof cell !== "string") continue;
    const trimmed = cell.trim();
    if (trimmed.startsWith("*")) continue; // Skip notes

    if (trimmed.startsWith("+ ")) {
      const label = trimmed.replace("+ ", "");
      const item = {
        label,
        path: "/app/" + toPath(label),
        children: [],
      };
      sidebar.push(item);
      currentParent = item;
    } else if (currentParent) {
      currentParent.children.push({
        label: trimmed,
        path: "/app/" + toPath(currentParent.label) + "/" + slugify(trimmed),
      });
    }
  }

  sidebar.forEach((item) => {
    if (item.children.length === 0) delete item.children;
  });

  return { topNav, sidebar };
}

function parseModulesTab(ws) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const modules = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r] || [];
    const process = row[0];
    if (!process || process === "Start" || process === "→ End") continue;
    if (!row[1]) continue;

    modules.push({
      process: (process || "").replace("→ ", ""),
      module: row[1] || "",
      who: row[2] || "",
      mvpUser: row[3] || "",
      comments: row[4] || "",
      mvp: row[5] || "",
      screens: row[6] || "",
      keyFields: row[7] || "",
      functions: row[8] || "",
    });
  }

  return modules;
}

function parseFieldsTab(ws) {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const headers = data[0];
  const fields = {};

  for (let col = 0; col < headers.length; col++) {
    const moduleName = headers[col];
    if (!moduleName) continue;

    const moduleFields = [];
    for (let r = 1; r < data.length; r++) {
      const row = data[r] || [];
      const val = row[col];
      if (val !== null && val !== undefined && String(val).trim() !== "") {
        moduleFields.push(String(val).trim());
      }
    }
    fields[moduleName] = moduleFields;
  }

  return fields;
}

/**
 * Explicit mapping from Fields-tab column headers to Modules-tab "Module" values.
 * Needed because the two tabs use slightly different names for several modules.
 */
const FIELDS_TO_MODULE_MAP = {
  "Job Confirmation": "Order Confirmation and Work Authorization",
  "BOM / Materials Planning": "Material Planning and Availability Check",
  "Procurement": "Procurement and Supplier Fulfillment",
  "Production Scheduling": "Production Scheduling",
  "Manufacturing": "Manufacturing / Fabrication / Assembly",
  "Quality Control": "Quality Control and Inspection",
  "Packaging": "Packaging and Job Completion",
  "Billing &Invoicing": "Client Acceptance and Project Closure",
};

function findModuleInfo(name, modulesData) {
  // 1. Exact module-name match
  const exact = modulesData.find((m) => m.module === name);
  if (exact) return exact;

  // 2. Explicit map: match on process substring
  const mapped = FIELDS_TO_MODULE_MAP[name];
  if (mapped) {
    const byProcess = modulesData.find((m) =>
      m.process.toLowerCase().includes(mapped.toLowerCase().slice(0, 20))
    );
    if (byProcess) return byProcess;
  }

  // 3. Fuzzy: first word of field name inside module name
  const firstWord = name.toLowerCase().split(/[\s\/]+/)[0];
  if (firstWord.length > 2) {
    const fuzzy = modulesData.find((m) =>
      m.module.toLowerCase().includes(firstWord)
    );
    if (fuzzy) return fuzzy;
  }

  return null;
}

function buildModuleSlugMap(fields, modulesData) {
  const map = {};
  const moduleNames = Object.keys(fields);

  for (const name of moduleNames) {
    const slug = slugify(name);
    const moduleInfo = findModuleInfo(name, modulesData);

    map[slug] = {
      name,
      slug,
      description: moduleInfo?.comments || "",
      who: moduleInfo?.who || "",
      mvpUser: moduleInfo?.mvpUser || "",
      process: moduleInfo?.process || "",
      screens: moduleInfo?.screens || "",
      accessRoles: deriveRoles(moduleInfo?.who || "", moduleInfo?.mvpUser || ""),
      fields: fields[name],
    };
  }

  return map;
}

// --- Main ---
function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error("Excel file not found at:", EXCEL_PATH);
    process.exit(1);
  }

  console.log("Reading Excel:", EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);

  const navigation = parsePageTab(wb.Sheets["Page"]);
  const modulesData = parseModulesTab(wb.Sheets["Modules"]);
  const fields = parseFieldsTab(wb.Sheets["Fields"]);
  const modules = buildModuleSlugMap(fields, modulesData);

  // Collect every role referenced across all modules
  const allRolesSet = new Set(["Admin"]);
  for (const mod of Object.values(modules)) {
    mod.accessRoles.forEach((r) => allRolesSet.add(r));
  }

  const roles = {
    Admin: {
      label: "Admin",
      description: "Full system access. Manages users, settings and all modules.",
    },
    "Project Manager": {
      label: "Project Manager",
      description: "Oversees projects, coordinates teams, manages requirements and scheduling.",
    },
    Sales: {
      label: "Sales",
      description: "Manages leads, quotations, contracts and client relationships.",
    },
    Client: {
      label: "Client",
      description: "External customer. Submits inquiries, reviews designs, approves quotes.",
    },
    "Design Team": {
      label: "Design Team",
      description: "Creates layouts, selects materials and prepares design packages.",
    },
    "Production Team": {
      label: "Production Team",
      description: "Handles manufacturing, assembly, quality control and packaging.",
    },
    Finance: {
      label: "Finance",
      description: "Manages billing, invoicing, payments and financial reporting.",
    },
    Procurement: {
      label: "Procurement",
      description: "Handles material planning, purchase orders and supplier management.",
    },
    "Quality Control": {
      label: "Quality Control",
      description: "Performs inspections, manages QC checklists and defect reports.",
    },
    Logistics: {
      label: "Logistics",
      description: "Schedules deliveries, manages installation and fulfilment.",
    },
    Support: {
      label: "Support",
      description: "Handles warranty claims, service tickets and aftersales requests.",
    },
  };

  const config = {
    navigation,
    roles,
    modules,
    moduleOrder: Object.keys(modules),
  };

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(JSON_OUT, JSON.stringify(config, null, 2), "utf-8");
  console.log("Generated:", JSON_OUT);

  const tsContent = `// Auto-generated by scripts/gen-config.js — do not edit manually
// Re-run: npm run gen:config

import configData from "./buildtrack.config.json";

export interface SidebarItem {
  label: string;
  path: string;
  children?: SidebarItem[];
}

export interface NavigationConfig {
  topNav: string[];
  sidebar: SidebarItem[];
}

export interface RoleConfig {
  label: string;
  description: string;
}

export interface ModuleConfig {
  name: string;
  slug: string;
  description: string;
  who: string;
  mvpUser: string;
  process: string;
  screens: string;
  accessRoles: string[];
  fields: string[];
}

export interface BuildTrackConfig {
  navigation: NavigationConfig;
  roles: Record<string, RoleConfig>;
  modules: Record<string, ModuleConfig>;
  moduleOrder: string[];
}

export const config = configData as BuildTrackConfig;
export const navigation = config.navigation;
export const roles = config.roles;
export const modules = config.modules;
export const moduleOrder = config.moduleOrder;

export function getModuleBySlug(slug: string): ModuleConfig | undefined {
  return modules[slug];
}

export function getAllModules(): ModuleConfig[] {
  return moduleOrder.map((slug) => modules[slug]);
}
`;

  fs.writeFileSync(TS_OUT, tsContent, "utf-8");
  console.log("Generated:", TS_OUT);
  console.log("Done! Modules:", Object.keys(modules).length, "| Roles:", Object.keys(roles).length);
}

main();
