import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).user?.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const unreadOnly = req.query.unreadOnly === 'true';

        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly && { read: false })
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, read: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = (req as any).user?.userId;

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res) => {
    try {
        const userId = (req as any).user?.userId;

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

/**
 * POST /api/notifications/:id/accept-invite
 * Accept a project invitation
 */
router.post('/:id/accept-invite', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = (req as any).user?.userId;

        // Get notification
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            include: { invitation: { include: { project: true, inviter: true } } }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (!notification.invitation) {
            return res.status(410).json({ error: 'Invitation has been deleted' });
        }

        if (notification.invitation.status !== 'PENDING') {
            return res.status(409).json({ error: 'This invitation has already been responded to' });
        }

        const projectId = notification.invitation.projectId;
        const inviterId = notification.invitation.inviterId;

        // Accept invitation and add as member in transaction
        await prisma.$transaction(async (tx) => {
            // Update invitation status
            await tx.projectInvitation.update({
                where: { id: notification.invitation!.id },
                data: { status: 'ACCEPTED' }
            });

            // Add user as project member
            await tx.projectMember.create({
                data: {
                    projectId,
                    userId
                }
            });

            // Mark invitee's notification as read
            await tx.notification.update({
                where: { id: notificationId },
                data: { read: true }
            });

            // Create notification for inviter
            const inviteeData = await tx.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true }
            });

            await tx.notification.create({
                data: {
                    userId: inviterId,
                    type: 'INVITE_ACCEPTED',
                    title: 'Invitation Accepted',
                    message: `${inviteeData?.name || inviteeData?.email} accepted your invitation to "${notification.invitation!.project.name}"`
                }
            });
        });

        res.json({ success: true, projectId });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

/**
 * POST /api/notifications/:id/decline-invite
 * Decline a project invitation
 */
router.post('/:id/decline-invite', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = (req as any).user?.userId;

        // Get notification
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            include: { invitation: { include: { project: true, inviter: true } } }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (!notification.invitation) {
            return res.status(410).json({ error: 'Invitation has been deleted' });
        }

        if (notification.invitation.status !== 'PENDING') {
            return res.status(409).json({ error: 'This invitation has already been responded to' });
        }

        const inviterId = notification.invitation.inviterId;

        // Decline invitation in transaction
        await prisma.$transaction(async (tx) => {
            // Update invitation status
            await tx.projectInvitation.update({
                where: { id: notification.invitation!.id },
                data: { status: 'DECLINED' }
            });

            // Mark invitee's notification as read
            await tx.notification.update({
                where: { id: notificationId },
                data: { read: true }
            });

            // Create notification for inviter
            const inviteeData = await tx.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true }
            });

            await tx.notification.create({
                data: {
                    userId: inviterId,
                    type: 'INVITE_DECLINED',
                    title: 'Invitation Declined',
                    message: `${inviteeData?.name || inviteeData?.email} declined your invitation to "${notification.invitation!.project.name}"`
                }
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error declining invitation:', error);
        res.status(500).json({ error: 'Failed to decline invitation' });
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = (req as any).user?.userId;

        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Delete the notification
        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default router;
