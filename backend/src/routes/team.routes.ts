import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { teamService } from '../services/teamService';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

router.use(authenticate);

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.string().optional().default('SUBCONTRACTOR'), // Role is optional, defaults to SUBCONTRACTOR
});

// ── BT0006: Team entity CRUD ──────────────────────────────────────────────────

/**
 * GET /api/teams
 * List all team definitions
 */
router.get('/', async (req, res) => {
    try {
        const teams = await teamService.listTeams();
        res.json({ teams });
    } catch (error) {
        console.error('Error listing teams:', error);
        res.status(500).json({ error: 'Failed to list teams' });
    }
});

/**
 * POST /api/teams
 * Create a new team definition (ADMIN only)
 */
router.post('/', requirePermission('create', 'users'), async (req, res) => {
    try {
        const { name, teamType, status } = req.body;
        if (!name) return res.status(400).json({ error: 'Team name is required' });
        const team = await teamService.createTeam({ name, teamType, status });
        res.status(201).json({ team });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

/**
 * PUT /api/teams/:id
 * Update a team definition (ADMIN only)
 */
router.put('/:id', requirePermission('create', 'users'), async (req, res) => {
    try {
        const { name, teamType, status } = req.body;
        const team = await teamService.updateTeam(req.params.id, { name, teamType, status });
        res.json({ team });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

/**
 * DELETE /api/teams/:id
 * Delete a team definition (ADMIN only)
 */
router.delete('/:id', requirePermission('delete', 'users'), async (req, res) => {
    try {
        await teamService.deleteTeam(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────

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
 * Invite a new member (any authenticated user)
 */
router.post('/invite', async (req, res) => {
    try {
        const { email, role } = inviteSchema.parse(req.body);
        const inviterId = (req as any).user?.userId;

        // Get inviter details
        const inviter = await prisma.user.findUnique({
            where: { id: inviterId },
            select: { name: true, email: true }
        });

        // Check if user with this email exists
        const inviteeUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });

        // Check for existing PENDING or ACCEPTED invitations
        if (inviteeUser) {
            const existingInvite = await prisma.invitation.findFirst({
                where: {
                    email: email,
                    status: { in: ['PENDING', 'ACCEPTED'] }
                }
            });

            if (existingInvite) {
                return res.status(409).json({ error: `User already has a ${existingInvite.status} invitation` });
            }
        }

        // Create the invitation record with userId if user exists
        const invitation = await prisma.invitation.create({
            data: {
                email,
                role,
                token: crypto.randomBytes(32).toString('hex'),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                userId: inviteeUser?.id,
                status: 'PENDING'
            }
        });

        if (inviteeUser) {
            // Create notification for existing user
            await prisma.notification.create({
                data: {
                    userId: inviteeUser.id,
                    type: 'TEAM_INVITE',
                    title: 'Team Invitation',
                    message: `${inviter?.name || inviter?.email || 'Admin'} invited you to join the team as ${role}`,
                    data: JSON.stringify({
                        email,
                        role,
                        inviterName: inviter?.name || inviter?.email,
                        inviterEmail: inviter?.email,
                        invitationToken: invitation.token,
                        invitationId: invitation.id
                    })
                }
            });
        }

        // In a real app, send email here
        console.log(`[INVITATION] Token: ${invitation.token} for ${email}`);

        res.json({ success: true, invitation, message: inviteeUser ? 'Invitation sent and notification created' : 'Invitation created (user not found in system)' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error creating invitation:', error);
        res.status(500).json({ error: 'Failed to create invitation' });
    }
});

/**
 * POST /api/teams/accept-invite
 * Accept a team invitation
 */
router.post('/accept-invite/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const userId = (req as any).user?.userId;

        // Get notification and linked invitation
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        let invitationRole: string | null = null;

        if (notification.invitationId) {
            const invitation = await prisma.invitation.findUnique({
                where: { id: notification.invitationId }
            });

            if (invitation && invitation.status === 'PENDING') {
                invitationRole = invitation.role;
                // Update invitation status to ACCEPTED
                await prisma.invitation.update({
                    where: { id: invitation.id },
                    data: { status: 'ACCEPTED' }
                });
            }
        }

        // If there's a role, update the user's role
        if (invitationRole) {
            // Get or create the role
            let role = await prisma.role.findFirst({
                where: { name: invitationRole }
            });

            // If role doesn't exist, create it (fallback)
            if (!role) {
                role = await prisma.role.create({
                    data: {
                        name: invitationRole,
                        displayName: invitationRole.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    }
                });
            }

            // Update user with the new role
            await prisma.user.update({
                where: { id: userId },
                data: { roleId: role.id }
            });
        }

        // Delete the notification
        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ success: true, message: 'Invitation accepted and role updated' });
    } catch (error: any) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

/**
 * POST /api/teams/decline-invite
 * Decline a team invitation
 */
router.post('/decline-invite/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const userId = (req as any).user?.userId;

        // Get notification and linked invitation
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.invitationId) {
            const invitation = await prisma.invitation.findUnique({
                where: { id: notification.invitationId }
            });

            if (invitation && invitation.status === 'PENDING') {
                // Update invitation status to DECLINED
                await prisma.invitation.update({
                    where: { id: invitation.id },
                    data: { status: 'DECLINED' }
                });
            }
        }

        // Delete the notification
        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ success: true, message: 'Invitation declined' });
    } catch (error: any) {
        console.error('Error declining invitation:', error);
        res.status(500).json({ error: 'Failed to decline invitation' });
    }
});

/**
 * GET /api/teams/invitations
 * Get all invitations sent by current user
 */
router.get('/invitations', async (req, res) => {
    try {
        const userId = (req as any).user?.userId;

        const invitations = await prisma.invitation.findMany({
            where: {
                // Get invitations created by this user (we need to check against user who sent it)
                // Since we don't have senderId, we'll return all invitations and filter by role/permissions
                // For now, let's return all pending invitations the user sent (we'll use a query flag)
            },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                expiresAt: true,
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ invitations });
    } catch (error: any) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

/**
 * POST /api/teams/invitations/:id/resend
 * Resend an invitation
 */
router.post('/invitations/:id/resend', async (req, res) => {
    try {
        const invitationId = req.params.id;

        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        if (invitation.status !== 'PENDING') {
            return res.status(409).json({ error: 'Can only resend pending invitations' });
        }

        if (invitation.user) {
            // Resend notification to user
            await prisma.notification.deleteMany({
                where: {
                    userId: invitation.user.id,
                    type: 'TEAM_INVITE',
                    data: { contains: invitationId }
                }
            });

            const inviter = await prisma.user.findUnique({
                where: { id: (req as any).user?.userId },
                select: { name: true, email: true }
            });

            await prisma.notification.create({
                data: {
                    userId: invitation.user.id,
                    type: 'TEAM_INVITE',
                    title: 'Team Invitation (Resent)',
                    message: `${inviter?.name || inviter?.email || 'Admin'} resent an invitation for you to join the team as ${invitation.role}`,
                    data: JSON.stringify({
                        email: invitation.email,
                        role: invitation.role,
                        inviterName: inviter?.name || inviter?.email,
                        inviterEmail: inviter?.email,
                        invitationToken: invitation.token,
                        invitationId: invitation.id
                    })
                }
            });
        }

        res.json({ success: true, message: 'Invitation resent' });
    } catch (error: any) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ error: 'Failed to resend invitation' });
    }
});

/**
 * DELETE /api/teams/invitations/:id
 * Revoke an invitation
 */
router.delete('/invitations/:id', async (req, res) => {
    try {
        const invitationId = req.params.id;

        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Delete linked notification if exists
        if (invitation.userId) {
            await prisma.notification.deleteMany({
                where: {
                    userId: invitation.userId,
                    type: 'TEAM_INVITE',
                    data: { contains: invitationId }
                }
            });
        }

        // Delete the invitation
        await prisma.invitation.delete({
            where: { id: invitationId }
        });

        res.json({ success: true, message: 'Invitation revoked' });
    } catch (error: any) {
        console.error('Error revoking invitation:', error);
        res.status(500).json({ error: 'Failed to revoke invitation' });
    }
});

/**
 * GET /api/teams/search-users
 * Search for users by email prefix (for project invitations)
 */
router.get('/search-users', async (req, res) => {
    try {
        const emailPrefix = (req.query.email as string || '').toLowerCase();
        const projectId = req.query.projectId as string;

        if (emailPrefix.length < 2) {
            return res.json({ users: [] });
        }

        // Get already invited users (PENDING or ACCEPTED)
        const existingInvitations = await prisma.projectInvitation.findMany({
            where: {
                projectId,
                status: { in: ['PENDING', 'ACCEPTED'] }
            },
            select: { inviteeId: true }
        });
        const invitedUserIds = existingInvitations.map(i => i.inviteeId);

        // Get existing project members
        const existingMembers = await prisma.projectMember.findMany({
            where: { projectId },
            select: { userId: true }
        });
        const memberUserIds = existingMembers.map(m => m.userId);

        // Combine excluded IDs
        const excludedIds = [...invitedUserIds, ...memberUserIds];

        // Search users by email prefix
        const users = await prisma.user.findMany({
            where: {
                email: { startsWith: emailPrefix, mode: 'insensitive' },
                isBlocked: false,
                id: { notIn: excludedIds }
            },
            select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                role: { select: { name: true, displayName: true } }
            },
            orderBy: { email: 'asc' },
            take: 10
        });

        res.json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

/**
 * GET /api/teams/assignable
 * Get users that can be assigned to projects or tasks
 */
router.get('/assignable', async (req, res) => {
    try {
        const role = req.query.role as string;
        const roles = role ? role.split(',') : ['SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER', 'PROJECT_COORDINATOR'];

        const users = await prisma.user.findMany({
            where: {
                role: { name: { in: roles } },
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
router.delete('/members/:id', requirePermission('delete', 'users'), async (req, res) => {
    try {
        await teamService.removeMember(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error removing team member:', error);
        res.status(400).json({ error: error.message || 'Failed to remove member' });
    }
});

export default router;
