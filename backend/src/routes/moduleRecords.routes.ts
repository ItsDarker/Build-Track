import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { prisma } from "../config/prisma";

const router = Router();

/**
 * GET /api/modules/:slug/records
 */
router.get("/:slug/records", authenticate, async (req: AuthRequest, res) => {
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
});

/**
 * POST /api/modules/:slug/records
 * Accepts either:
 *  - raw object body: { fieldA: "...", fieldB: "..." }
 *  - or wrapped: { data: { ... } }
 */
router.post("/:slug/records", authenticate, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const body: any = req.body ?? {};
    const data = body.data ?? body;

    const record = await prisma.moduleRecord.create({
      data: {
        moduleSlug: slug,
        data,
        createdById: (req as any).user?.id ?? null,
        updatedById: (req as any).user?.id ?? null,
      },
    });

    res.status(201).json({ record });
  } catch (err) {
    console.error("Create module record error:", err);
    res.status(500).json({ error: "Failed to create record" });
  }
});

/**
 * PUT /api/modules/:slug/records/:id
 */
router.put("/:slug/records/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { slug, id } = req.params;
    const body: any = req.body ?? {};
    const data = body.data ?? body;

    const record = await prisma.moduleRecord.update({
      where: { id },
      data: {
        moduleSlug: slug,
        data,
        updatedById: (req as any).user?.id ?? null,
      },
    });

    res.json({ record });
  } catch (err) {
    console.error("Update module record error:", err);
    res.status(500).json({ error: "Failed to update record" });
  }
});

/**
 * DELETE /api/modules/:slug/records/:id
 */
router.delete(
  "/:slug/records/:id",
  authenticate,
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
