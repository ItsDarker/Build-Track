import { Router, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { prisma } from '../config/prisma';

const router = Router();

// Protect all routes
router.use(authenticate);

/**
 * GET /api/lookups?moduleSlug=work-orders
 * Returns all active lookups for a specific module, grouped by category/field name.
 */
router.get('/', async (req: AuthRequest, res) => {
    try {
        const { moduleSlug } = req.query as { moduleSlug?: string };

        const where: any = { isActive: true };
        if (moduleSlug) {
            where.moduleSlug = moduleSlug;
        }

        const lookups = await prisma.lookup.findMany({
            where,
            orderBy: [{ category: 'asc' }, { order: 'asc' }, { label: 'asc' }]
        });

        // Group by category for easy frontend use
        const grouped = lookups.reduce((acc: Record<string, any[]>, curr: any) => {
            if (!acc[curr.category]) acc[curr.category] = [];
            acc[curr.category].push({
                id: curr.id,
                value: curr.value,
                label: curr.label || curr.value,
                order: curr.order
            });
            return acc;
        }, {});

        res.json({ lookups: grouped, moduleSlug: moduleSlug || null });
    } catch (error) {
        console.error('Error fetching lookups:', error);
        res.status(500).json({ error: 'Failed to fetch lookups' });
    }
});

/**
 * GET /api/lookups/all?moduleSlug=work-orders
 * Admin: Returns a flat list including inactive items for management UI.
 */
router.get('/all', requirePermission('update', 'settings'), async (req: AuthRequest, res) => {
    try {
        const { moduleSlug } = req.query as { moduleSlug?: string };

        const lookups = await prisma.lookup.findMany({
            where: moduleSlug ? { moduleSlug } : {},
            orderBy: [{ category: 'asc' }, { order: 'asc' }]
        });

        res.json({ lookups });
    } catch (error) {
        console.error('Error fetching all lookups:', error);
        res.status(500).json({ error: 'Failed to fetch lookups' });
    }
});

/**
 * POST /api/lookups
 * Admin: Creates a new lookup option for a specific module + field.
 */
router.post('/', requirePermission('update', 'settings'), async (req: AuthRequest, res) => {
    try {
        const { moduleSlug, category, value, label, order, isActive } = req.body;
        if (!moduleSlug || !category || !value) {
            return res.status(400).json({ error: 'moduleSlug, category and value are required' });
        }

        const lookup = await prisma.lookup.create({
            data: {
                moduleSlug,
                category,
                value,
                label: label || value,
                order: order ?? 0,
                isActive: isActive ?? true
            }
        });
        res.status(201).json({ lookup });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'This option already exists for this module and field' });
        }
        console.error('Error creating lookup:', error);
        res.status(500).json({ error: 'Failed to create lookup' });
    }
});

/**
 * PUT /api/lookups/:id
 * Admin: Updates a lookup option.
 */
router.put('/:id', requirePermission('update', 'settings'), async (req: AuthRequest, res) => {
    try {
        const { category, value, label, order, isActive } = req.body;
        const lookup = await prisma.lookup.update({
            where: { id: req.params.id },
            data: { category, value, label, order, isActive }
        });
        res.json({ lookup });
    } catch (error) {
        console.error('Error updating lookup:', error);
        res.status(500).json({ error: 'Failed to update lookup' });
    }
});

/**
 * DELETE /api/lookups/:id
 * Admin: Deletes a lookup option.
 */
router.delete('/:id', requirePermission('update', 'settings'), async (req: AuthRequest, res) => {
    try {
        await prisma.lookup.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting lookup:', error);
        res.status(500).json({ error: 'Failed to delete lookup' });
    }
});

export default router;
