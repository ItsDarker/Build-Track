import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export const teamService = {
    /**
     * List all team members (all non-client users for now)
     */
    async listMembers() {
        return prisma.user.findMany({
            where: {
                role: {
                    is: { name: { in: ['ADMIN', 'PM', 'SUBCONTRACTOR'] } }
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    },

    /**
     * Create an invitation
     */
    async createInvitation(email: string, role: string) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        return prisma.invitation.create({
            data: {
                email,
                role,
                token,
                expiresAt,
            },
        });
    },

    /**
     * Remove a member
     */
    async removeMember(userId: string) {
        // Check if user is an admin - maybe prevent deleting the last admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Don't allow deleting admins from the team page (use admin settings for that)
        if ((user.role as any)?.name === 'ADMIN') {
            throw new Error('Admins cannot be removed from the team page. Use Admin settings.');
        }

        return prisma.user.delete({
            where: { id: userId }
        });
    }
};
