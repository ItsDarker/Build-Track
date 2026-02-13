import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { teamService } from '../services/teamService';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['PM', 'SUBCONTRACTOR', 'CLIENT']), // Roles that can be invited
});

/**
 * GET /api/teams/members
 * List all team members
 */
router.get('/members', async (req, res) => {
    try {
        const members = await teamService.listMembers();
        res.json({ members });
    } catch (error) {
        console.error('Error listing team members:', error);
        res.status(500).json({ error: 'Failed to list team members' });
    }
});

/**
 * POST /api/teams/invite
 * Invite a new member (ADMIN and PM only)
 */
router.post('/invite', requireRole(['ADMIN', 'PM']), async (req, res) => {
    try {
        const { email, role } = inviteSchema.parse(req.body);
        const invitation = await teamService.createInvitation(email, role);

        // In a real app, send email here
        console.log(`[INVITATION] Token: ${invitation.token} for ${email}`);

        res.json({ success: true, invitation });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error creating invitation:', error);
        res.status(500).json({ error: 'Failed to create invitation' });
    }
});

/**
 * GET /api/teams/assignable
 * Get users that can be assigned to projects or tasks (ADMIN and PM only)
 */
router.get('/assignable', requireRole(['ADMIN', 'PM']), async (req, res) => {
    try {
        const role = req.query.role as string;
        const roles = role ? role.split(',') : ['ADMIN', 'PM', 'SUBCONTRACTOR'];

        const users = await prisma.user.findMany({
            where: {
                role: { in: roles },
                isBlocked: false
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });
        res.json({ users });
    } catch (error) {
        console.error('Error getting assignable users:', error);
        res.status(500).json({ error: 'Failed to get assignable users' });
    }
});

/**
 * DELETE /api/teams/members/:id
 * Remove a team member (ADMIN only)
 */
router.delete('/members/:id', requireRole(['ADMIN']), async (req, res) => {
    try {
        await teamService.removeMember(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error removing team member:', error);
        res.status(400).json({ error: error.message || 'Failed to remove member' });
    }
});

export default router;
