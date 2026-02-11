"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const teamService_1 = require("../services/teamService");
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const inviteSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['PM', 'SUBCONTRACTOR', 'CLIENT']), // Roles that can be invited
});
/**
 * GET /api/teams/members
 * List all team members
 */
router.get('/members', async (req, res) => {
    try {
        const members = await teamService_1.teamService.listMembers();
        res.json({ members });
    }
    catch (error) {
        console.error('Error listing team members:', error);
        res.status(500).json({ error: 'Failed to list team members' });
    }
});
/**
 * POST /api/teams/invite
 * Invite a new member (ADMIN and PM only)
 */
router.post('/invite', (0, rbac_1.requireRole)(['ADMIN', 'PM']), async (req, res) => {
    try {
        const { email, role } = inviteSchema.parse(req.body);
        const invitation = await teamService_1.teamService.createInvitation(email, role);
        // In a real app, send email here
        console.log(`[INVITATION] Token: ${invitation.token} for ${email}`);
        res.json({ success: true, invitation });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/assignable', (0, rbac_1.requireRole)(['ADMIN', 'PM']), async (req, res) => {
    try {
        const role = req.query.role;
        const roles = role ? role.split(',') : ['ADMIN', 'PM', 'SUBCONTRACTOR'];
        const users = await prisma_1.prisma.user.findMany({
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
    }
    catch (error) {
        console.error('Error getting assignable users:', error);
        res.status(500).json({ error: 'Failed to get assignable users' });
    }
});
/**
 * DELETE /api/teams/members/:id
 * Remove a team member (ADMIN only)
 */
router.delete('/members/:id', (0, rbac_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        await teamService_1.teamService.removeMember(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error removing team member:', error);
        res.status(400).json({ error: error.message || 'Failed to remove member' });
    }
});
exports.default = router;
