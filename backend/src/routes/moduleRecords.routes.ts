import { Router, Response, NextFunction } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { requirePermission, RBACRequest, requireProjectAccess } from "../middleware/rbac";
import { prisma } from "../config/prisma";
import { FIELD_KEYS, COMPLETION_STATUSES, SLUG_TO_RESOURCE } from "../config/moduleFields";

const router = Router();

/**
 * Maps module slugs to permission resource names used in the seed.
 * This bridges the gap between URL slugs and the resource names
 * stored in the permissions table.
 */
// SLUG_TO_RESOURCE is now imported from ../config/moduleFields

/**
 * Middleware factory: resolves module slug from params,
 * then delegates to requirePermission(action, resource).
 */
function modulePermission(action: string) {
  return (req: RBACRequest, res: Response, next: NextFunction) => {
    const slug = req.params.slug;
    const resource = SLUG_TO_RESOURCE[slug];
    if (!resource) {
      console.warn(`Unknown module slug requested: ${slug}. Available slugs:`, Object.keys(SLUG_TO_RESOURCE));
      return res.status(404).json({
        error: `Unknown module: ${slug}`,
        availableSlugs: Object.keys(SLUG_TO_RESOURCE)
      });
    }
    return requirePermission(action, resource)(req, res, next);
  };
}

/**
 * GET /api/modules/:slug/records
 */
router.get(
  "/:slug/records",
  authenticate,
  modulePermission("read"),
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;
      const user = req.user as any;
      const userId = user?.userId;
      const role = typeof user?.role === 'string' ? user.role : user?.role?.name;
      
      console.log(`[DEBUG] GET /modules/${slug}/records | User: ${userId} | Role: ${role}`);

      const where: any = { moduleSlug: slug };

      // Fetch all records for this module
      const allRecords = await prisma.moduleRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Parse data field from string to object (for SQLite compatibility)
      const parsedRecords = allRecords.map(record => ({
        ...record,
        data: typeof record.data === 'string' ? JSON.parse(record.data) : record.data
      }));

      // Row-Level Security (RLS) filtering - applied in-memory for SQLite compatibility
      let records = parsedRecords;
      const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN'];
      if (!ADMIN_ROLES.includes(role)) {
        // Find projects where the user is a member or manager
        const userProjects = await prisma.project.findMany({
          where: {
            OR: [
              { managerId: userId },
              { assignedToId: userId },
              { members: { some: { userId } } }
            ]
          },
          select: { id: true, code: true, name: true }
        });

        const projectIds = new Set(userProjects.map(p => p.id));
        const projectCodes = new Set(userProjects.map(p => p.code).filter(Boolean));
        const projectNames = new Set(userProjects.map(p => p.name).filter(Boolean));

        if (role === 'SALES_MANAGER') {
          // Sales sees records they created
          records = records.filter(r => r.createdById === userId);
        } else if (projectIds.size === 0) {
          // No project membership → no records (except what they created)
          records = records.filter(r => r.createdById === userId);
        } else {
          // Filter: records where the creator is this user, OR the record's
          // data matches one of our project IDs or codes
          records = records.filter(record => {
            // User created it
            if (record.createdById === userId) return true;

            // Check if record data references one of user's projects
            const recordData = record.data as any;
            if (!recordData) return false;

            // Check multiple possible field names for project references
            const projectFields = [
              'projectId', '_projectId', 'Project ID', 'Linked Project ID',
              'projectCode', '_projectCode', 'Project Code', 'Linked Project Code',
              'Project Name / Reference', 'Project Reference', 'Project Name', 'Linked Project Name'
            ];

            for (const field of projectFields) {
              const value = recordData[field];
              if (value) {
                if (projectIds.has(value) || projectCodes.has(value) || projectNames.has(value)) {
                  return true;
                }
              }
            }

            return false;
          });
        }
      }

      res.json({ records: parsedRecords });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("List module records error:", errorMsg);
      console.error("Full error:", err);
      res.status(500).json({ error: `Failed to list records: ${errorMsg}` });
    }
  }
);

/**
 * POST /api/modules/:slug/records
 * Accepts either:
 *  - raw object body: { fieldA: "...", fieldB: "..." }
 *  - or wrapped: { data: { ... } }
 */
router.post(
  "/:slug/records",
  authenticate,
  modulePermission("create"),
  requireProjectAccess,
  async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;
      const body: any = req.body ?? {};
      const data = body.data ?? body;

      console.log(`[${slug}] Creating record with data:`, data);

      const record = await prisma.moduleRecord.create({
        data: {
          moduleSlug: slug,
          data,
          createdById: (req as any).user?.userId ?? (req as any).user?.id ?? null,
          updatedById: (req as any).user?.userId ?? (req as any).user?.id ?? null,
        },
      });

      console.log(`[${slug}] Record created successfully with ID:`, record.id);
      res.status(201).json({ record });
    } catch (err) {
      console.error(`[Create] Error for module ${req.params.slug}:`, err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Failed to create record: ${errorMsg}` });
    }
  }
);

/**
 * PUT /api/modules/:slug/records/:id
 */
router.put(
  "/:slug/records/:id",
  authenticate,
  modulePermission("update"),
  requireProjectAccess,
  async (req: AuthRequest, res) => {
    try {
      const { slug, id } = req.params;
      const body: any = req.body ?? {};
      const data = body.data ?? body;

      console.log(`[${slug}] Updating record ${id} with data:`, JSON.stringify(data, null, 2));

      const record = await prisma.moduleRecord.update({
        where: { id },
        data: {
          moduleSlug: slug,
          data,
          updatedById: (req as any).user?.userId ?? (req as any).user?.id ?? null,
        },
      });

      console.log(`[${slug}] Record ${id} updated successfully`);
      console.log(`[${slug}] Record after update:`, JSON.stringify(record, null, 2));

      // Auto-chain: when a module record is marked complete, create next task
      const CHAIN: Record<string, { nextTitle: string; nextSlug: string }> = {
        'crm-leads': { nextTitle: 'Project Requirements', nextSlug: 'project-requirements' },
        'project-requirements': { nextTitle: 'Design Configuration', nextSlug: 'design-configurator' },
        'design-configurator': { nextTitle: 'Quoting & Contracts', nextSlug: 'quoting-contracts' },
        'quoting-contracts': { nextTitle: 'Approval Workflow', nextSlug: 'approval-workflow' },
        'approval-workflow': { nextTitle: 'Job Confirmation', nextSlug: 'job-confirmation' },
        'job-confirmation': { nextTitle: 'Work Orders', nextSlug: 'work-orders' },
        'work-orders': { nextTitle: 'BOM & Materials Planning', nextSlug: 'bom-materials-planning' },
        'bom-materials-planning': { nextTitle: 'Procurement', nextSlug: 'procurement' },
        'procurement': { nextTitle: 'Production Scheduling', nextSlug: 'production-scheduling' },
        'production-scheduling': { nextTitle: 'Manufacturing', nextSlug: 'manufacturing' },
        'manufacturing': { nextTitle: 'Quality Control', nextSlug: 'quality-control' },
        'quality-control': { nextTitle: 'Packaging', nextSlug: 'packaging' },
        'packaging': { nextTitle: 'Delivery & Installation', nextSlug: 'delivery-installation' },
        'delivery-installation': { nextTitle: 'Billing & Invoicing', nextSlug: 'billing-invoicing' },
        'billing-invoicing': { nextTitle: 'Project Closure', nextSlug: 'closure' },
      };

      const recordData = data as any;
      const leadStatus = recordData[FIELD_KEYS.LEAD_STATUS];
      const taskStatus = recordData[FIELD_KEYS.TASK_STATUS];
      
      const completionValues = COMPLETION_STATUSES[slug] || ['Completed'];
      const isCompleted = completionValues.includes(leadStatus) || completionValues.includes(taskStatus);
      
      const chain = CHAIN[slug];

      if (isCompleted && chain) {
        const projectId = recordData[FIELD_KEYS.PROJECT_ID] || recordData['Linked Project ID'] || recordData['Project Name / Reference'];
        const assigneeId = (req as any).user?.userId ?? (req as any).user?.id ?? null;

        if (projectId) {
          // Create next task
          const nextTask = await prisma.task.create({
            data: {
              title: chain.nextTitle,
              status: 'TODO',
              priority: 'MEDIUM',
              projectId,
              assigneeId,
            },
          });

          // Prepare data for next module record
          const nextData: Record<string, any> = {
            [FIELD_KEYS.PROJECT_ID]: projectId,
            [FIELD_KEYS.PROJECT_CODE]: recordData[FIELD_KEYS.PROJECT_CODE] || '',
            [FIELD_KEYS.PROJECT_NAME]: recordData[FIELD_KEYS.PROJECT_NAME] || '',
            [FIELD_KEYS.TASK_ID]: nextTask.id,
            [FIELD_KEYS.TASK_STATUS]: 'New',
          };

          // Also try to populate user-visible project fields for the next module
          // Common patterns: "Linked Project ID", "Project Name", "Linked Project Name"
          const projectFields = [
            'Linked Project ID', 'Project ID', 'Project Reference', 'Project Name / Reference',
            'Linked Project Name', 'Project Name', 'Linked Client Name', 'Customer Name'
          ];
          
          projectFields.forEach(f => {
            if (recordData[f]) {
              nextData[f] = recordData[f];
            } else if (f.includes('Project ID') || f.includes('Project Reference')) {
              nextData[f] = projectId;
            } else if (f.includes('Project Name') && recordData[FIELD_KEYS.PROJECT_NAME]) {
              nextData[f] = recordData[FIELD_KEYS.PROJECT_NAME];
            }
          });

          // Create next module record
          await prisma.moduleRecord.create({
            data: {
              moduleSlug: chain.nextSlug,
              data: JSON.stringify(nextData),
              createdById: assigneeId,
              updatedById: assigneeId,
            },
          });
          
          console.log(`[Chain] Created next record in ${chain.nextSlug} for project ${projectId}`);
        }
      }


      res.json({ record });

    } catch (err) {
      console.error(`[Update] Error for module ${req.params.slug}:`, err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Failed to update record: ${errorMsg}` });
    }
  }
);

/**
 * DELETE /api/modules/:slug/records/:id
 */
router.delete(
  "/:slug/records/:id",
  authenticate,
  modulePermission("delete"),
  requireProjectAccess,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await prisma.moduleRecord.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      console.error("Delete module record error:", err);
      res.status(500).json({ error: "Failed to delete record" });
    }
  }
);

export default router;
