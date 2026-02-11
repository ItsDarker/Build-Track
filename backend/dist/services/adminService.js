"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const prisma_1 = require("../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AdminService {
    /**
     * Get dashboard statistics
     */
    async getStats() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, blockedUsers, verifiedUsers, adminUsers, recentSignups,] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.count({ where: { isBlocked: true } }),
            prisma_1.prisma.user.count({ where: { emailVerified: { not: null } } }),
            prisma_1.prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma_1.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        ]);
        return {
            totalUsers,
            verifiedUsers,
            unverifiedUsers: totalUsers - verifiedUsers,
            blockedUsers,
            adminUsers,
            recentSignups,
        };
    }
    /**
     * List users with pagination and filtering
     */
    async listUsers(params) {
        const { page = 1, limit = 20, search, role, status } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { name: { contains: search } },
            ];
        }
        if (role) {
            where.role = role;
        }
        if (status === 'blocked') {
            where.isBlocked = true;
        }
        else if (status === 'unverified') {
            where.emailVerified = null;
        }
        else if (status === 'active') {
            where.isBlocked = false;
            where.emailVerified = { not: null };
        }
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    emailVerified: true,
                    phone: true,
                    company: true,
                    jobTitle: true,
                    isBlocked: true,
                    blockedAt: true,
                    blockedReason: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { loginAttempts: true },
                    },
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return {
            users: users.map(u => ({
                ...u,
                loginAttempts: u._count.loginAttempts,
                _count: undefined,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get all users for export
     */
    async getAllUsers() {
        return prisma_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                phone: true,
                company: true,
                jobTitle: true,
                isBlocked: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    /**
     * Get single user by ID
     */
    async getUser(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                phone: true,
                company: true,
                jobTitle: true,
                bio: true,
                isBlocked: true,
                blockedAt: true,
                blockedReason: true,
                createdAt: true,
                updatedAt: true,
                loginAttempts: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        ip: true,
                        success: true,
                        createdAt: true,
                    },
                },
            },
        });
        return user;
    }
    /**
     * Create a new user
     */
    async createUser(data) {
        const { email, name, password, role = 'USER', emailVerified = false, phone, company, jobTitle, bio } = data;
        // Check if email already exists
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('Email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role,
                emailVerified: emailVerified ? new Date() : null,
                phone,
                company,
                jobTitle,
                bio,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                phone: true,
                company: true,
                jobTitle: true,
                createdAt: true,
            },
        });
        // Create notification for new user
        await this.createNotification({
            type: 'new_user',
            title: 'New User Created',
            message: `User ${email} was created by admin`,
            data: { userId: user.id, email },
        });
        return user;
    }
    /**
     * Update user
     */
    async updateUser(userId, data) {
        // Check if email is being changed and if it already exists
        if (data.email) {
            const existing = await prisma_1.prisma.user.findFirst({
                where: { email: data.email, id: { not: userId } },
            });
            if (existing) {
                throw new Error('Email already exists');
            }
        }
        const updateData = { ...data };
        if (data.emailVerified !== undefined) {
            updateData.emailVerified = data.emailVerified ? new Date() : null;
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                phone: true,
                company: true,
                jobTitle: true,
                bio: true,
                isBlocked: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return user;
    }
    /**
     * Reset user password
     */
    async resetPassword(userId, password) {
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        return { success: true };
    }
    /**
     * Delete user
     */
    async deleteUser(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Prevent deleting the last admin
        if (user.role === 'ADMIN') {
            const adminCount = await prisma_1.prisma.user.count({ where: { role: 'ADMIN' } });
            if (adminCount <= 1) {
                throw new Error('Cannot delete the last admin user');
            }
        }
        await prisma_1.prisma.user.delete({ where: { id: userId } });
        return { success: true };
    }
    /**
     * Block user
     */
    async blockUser(userId, reason, adminId) {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                isBlocked: true,
                blockedAt: new Date(),
                blockedReason: reason || 'Blocked by admin',
            },
            select: {
                id: true,
                email: true,
                name: true,
                isBlocked: true,
                blockedAt: true,
                blockedReason: true,
            },
        });
        // Create notification
        await this.createNotification({
            type: 'user_blocked',
            title: 'User Blocked',
            message: `User ${user.email} was blocked. Reason: ${reason || 'No reason provided'}`,
            data: { userId: user.id, email: user.email, reason, blockedBy: adminId },
        });
        return user;
    }
    /**
     * Unblock user
     */
    async unblockUser(userId) {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                isBlocked: false,
                blockedAt: null,
                blockedReason: null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                isBlocked: true,
            },
        });
        // Create notification
        await this.createNotification({
            type: 'user_unblocked',
            title: 'User Unblocked',
            message: `User ${user.email} was unblocked`,
            data: { userId: user.id, email: user.email },
        });
        return user;
    }
    /**
     * Get login attempts
     */
    async getLoginAttempts(params) {
        const { page = 1, limit = 50, email, success } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (email)
            where.email = { contains: email };
        if (success !== undefined)
            where.success = success;
        const [attempts, total] = await Promise.all([
            prisma_1.prisma.loginAttempt.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma_1.prisma.loginAttempt.count({ where }),
        ]);
        return {
            attempts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get notifications
     */
    async getNotifications(params) {
        const { unreadOnly = false, limit = 50 } = params;
        const where = {};
        if (unreadOnly)
            where.read = false;
        const notifications = await prisma_1.prisma.adminNotification.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        const unreadCount = await prisma_1.prisma.adminNotification.count({
            where: { read: false },
        });
        return {
            notifications: notifications.map(n => ({
                ...n,
                data: n.data ? JSON.parse(n.data) : null,
            })),
            unreadCount,
        };
    }
    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
        return prisma_1.prisma.adminNotification.update({
            where: { id: notificationId },
            data: { read: true },
        });
    }
    /**
     * Mark all notifications as read
     */
    async markAllNotificationsRead() {
        return prisma_1.prisma.adminNotification.updateMany({
            where: { read: false },
            data: { read: true },
        });
    }
    /**
     * Deletes all admin notifications.
     */
    async clearAllNotifications() {
        return prisma_1.prisma.adminNotification.deleteMany({});
    }
    /**
     * Create notification
     */
    async createNotification(data) {
        return prisma_1.prisma.adminNotification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data ? JSON.stringify(data.data) : null,
            },
        });
    }
}
exports.adminService = new AdminService();
