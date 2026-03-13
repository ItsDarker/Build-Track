import { Router, Response, NextFunction } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { requirePermission, RBACRequest } from "../middleware/rbac";
import { prisma } from "../config/prisma";

const router = Router();

/**
 * Maps module slugs to permission resource names used in the seed.
 * This bridges the gap between URL slugs and the resource names
 * stored in the permissions table.
 */
const SLUG_TO_RESOURCE: Record<string, string> = {
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

      const records = await prisma.moduleRecord.findMany({
        where: { moduleSlug: slug },
        orderBy: { createdAt: "desc" },
      });

      res.json({ records });
    } catch (err) {
      console.error("List module records error:", err);
      res.status(500).json({ error: "Failed to list records" });
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
      };

      const leadStatus = (data as any)?.['Lead Status (New, Contacted, Qualified, Closed)'];
      const taskStatus = (data as any)?.['Task Status (New, In Progress, Completed)'];
      const isCompleted = leadStatus === 'Closed' || taskStatus === 'Completed';
      const chain = CHAIN[slug];

      if (isCompleted && chain) {
        const recordData = data as any;
        const projectId = recordData._projectId;
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

          // Create next module record
          await prisma.moduleRecord.create({
            data: {
              moduleSlug: chain.nextSlug,
              data: {
                _projectId: projectId,
                _projectCode: recordData._projectCode || '',
                _projectName: recordData._projectName || '',
                _taskId: nextTask.id,
                'Task Status (New, In Progress, Completed)': 'New',
              },
              createdById: assigneeId,
              updatedById: assigneeId,
            },
          });
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
