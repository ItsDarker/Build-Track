import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * POST /api/projects/:id/invitations
 * PM sends a project invitation to a user
 */
router.post('/:id/invitations', async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = (req as any).user?.userId;

        // Verify current user is the project manager
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { managerId: true, name: true }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.managerId !== userId) {
            return res.status(403).json({ error: 'Only project manager can send invitations' });
        }

        const { inviteeId, message } = req.body;

        // Verify invitee exists
        const invitee = await prisma.user.findUnique({
            where: { id: inviteeId },
            select: { id: true, email: true, name: true }
        });

        if (!invitee) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check not inviting themselves
        if (inviteeId === userId) {
            return res.status(400).json({ error: 'Cannot invite yourself' });
        }

        // Check no existing invitation
        const existingInvite = await prisma.projectInvitation.findUnique({
            where: { projectId_inviteeId: { projectId, inviteeId } }
        });

        if (existingInvite) {
            return res.status(409).json({ error: 'User already invited to this project' });
        }

        // Check not already a member
        const existingMember = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: inviteeId } }
        });

        if (existingMember) {
            return res.status(409).json({ error: 'User is already a team member' });
        }

        // Get inviter details
        const inviter = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true }
        });

        // Create invitation and notification in transaction
        const result = await prisma.$transaction(async (tx) => {
            const invitation = await tx.projectInvitation.create({
                data: {
                    projectId,
                    inviterId: userId,
                    inviteeId,
                    message,
                    status: 'PENDING'
                },
                select: {
                    id: true,
                    status: true,
                    createdAt: true
                }
            });

            // Create notification for invitee
            const notificationData = {
                projectId,
                projectName: project.name,
                inviterId: userId,
                inviterName: inviter?.name || 'Team member',
                inviterEmail: inviter?.email || '',
                pmMessage: message
            };

            await tx.notification.create({
                data: {
                    userId: inviteeId,
                    type: 'PROJECT_INVITE',
                    title: `Invitation to project "${project.name}"`,
                    message: `${inviter?.name || 'Your team member'} invited you to join the project`,
                    data: JSON.stringify(notificationData),
                    invitationId: invitation.id
                }
            });

            return invitation;
        });

        res.status(201).json({ invitation: result, message: 'Invitation sent' });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

/**
 * GET /api/projects/:id/invitations
 * PM views all invitations sent for a project
 */
router.get('/:id/invitations', async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = (req as any).user?.userId;

        // Verify current user is the project manager
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { managerId: true }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (project.managerId !== userId) {
            return res.status(403).json({ error: 'Only project manager can view invitations' });
        }

        const invitations = await prisma.projectInvitation.findMany({
            where: { projectId },
            select: {
                id: true,
                inviteeId: true,
                status: true,
                message: true,
                createdAt: true,
                invitee: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ invitations });
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations' });
    }
});

/**
 * DELETE /api/projects/:id/invitations/:invId
 * PM deletes an invitation
 */
router.delete('/:id/invitations/:invId', async (req, res) => {
    try {
        const projectId = req.params.id;
        const invitationId = req.params.invId;
        const userId = (req as any).user?.userId;

        // Get invitation
        const invitation = await prisma.projectInvitation.findUnique({
            where: { id: invitationId }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Verify current user sent the invitation
        if (invitation.inviterId !== userId) {
            return res.status(403).json({ error: 'Only the inviter can delete this invitation' });
        }

        // Delete in transaction to ensure notification is deleted first
        await prisma.$transaction(async (tx) => {
            // Delete linked notification
            await tx.notification.deleteMany({
                where: { invitationId }
            });

            // Delete invitation
            await tx.projectInvitation.delete({
                where: { id: invitationId }
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting invitation:', error);
        res.status(500).json({ error: 'Failed to delete invitation' });
    }
});

/**
 * POST /api/projects/:id/invitations/:invId/resend
 * PM resends an invitation
 */
router.post('/:id/invitations/:invId/resend', async (req, res) => {
    try {
        const projectId = req.params.id;
        const invitationId = req.params.invId;
        const userId = (req as any).user?.userId;

        // Get invitation
        const invitation = await prisma.projectInvitation.findUnique({
            where: { id: invitationId },
            include: { project: true }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Verify current user sent the invitation
        if (invitation.inviterId !== userId) {
            return res.status(403).json({ error: 'Only the inviter can resend this invitation' });
        }

        // Check status is still PENDING
        if (invitation.status !== 'PENDING') {
            return res.status(409).json({ error: 'Can only resend pending invitations' });
        }

        // Get inviter details
        const inviter = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true }
        });

        // Upsert notification
        const notificationData = {
            projectId,
            projectName: invitation.project.name,
            inviterId: userId,
            inviterName: inviter?.name || 'Team member',
            inviterEmail: inviter?.email || '',
            pmMessage: invitation.message
        };

        await prisma.notification.upsert({
            where: { invitationId },
            create: {
                userId: invitation.inviteeId,
                type: 'PROJECT_INVITE',
                title: `Invitation to project "${invitation.project.name}"`,
                message: `${inviter?.name || 'Your team member'} invited you to join the project`,
                data: JSON.stringify(notificationData),
                invitationId,
                read: false
            },
            update: {
                read: false,
                message: `${inviter?.name || 'Your team member'} invited you to join the project`,
                data: JSON.stringify(notificationData),
                createdAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error resending invitation:', error);
        res.status(500).json({ error: 'Failed to resend invitation' });
    }
});

export default router;
