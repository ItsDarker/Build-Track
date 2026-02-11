"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamService = void 0;
const prisma_1 = require("../config/prisma");
const crypto_1 = __importDefault(require("crypto"));
exports.teamService = {
    /**
     * List all team members (all non-client users for now)
     */
    async listMembers() {
        return prisma_1.prisma.user.findMany({
            where: {
                role: {
                    in: ['ADMIN', 'PM', 'SUBCONTRACTOR']
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
    async createInvitation(email, role) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
        return prisma_1.prisma.invitation.create({
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
    async removeMember(userId) {
        // Check if user is an admin - maybe prevent deleting the last admin
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Don't allow deleting admins from the team page (use admin settings for that)
        if (user.role === 'ADMIN') {
            throw new Error('Admins cannot be removed from the team page. Use Admin settings.');
        }
        return prisma_1.prisma.user.delete({
            where: { id: userId }
        });
    }
};
