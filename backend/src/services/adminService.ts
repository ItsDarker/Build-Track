import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  blockedUsers: number;
  adminUsers: number;
  recentSignups: number;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'blocked' | 'unverified';
}

export interface CreateUserData {
  email: string;
  name?: string;
  password: string;
  role?: string;
  emailVerified?: boolean;
  phone?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  emailVerified?: boolean;
}

class AdminService {

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      blockedUsers,
      verifiedUsers,
      adminUsers,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
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
  async listUsers(params: UserListParams) {
    const { page = 1, limit = 20, search, role, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

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
    } else if (status === 'unverified') {
      where.emailVerified = null;
    } else if (status === 'active') {
      where.isBlocked = false;
      where.emailVerified = { not: null };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
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
    return prisma.user.findMany({
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
  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
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
  async createUser(data: CreateUserData) {
    const { email, name, password, role = 'USER', emailVerified = false, phone, company, jobTitle, bio } = data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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
  async updateUser(userId: string, data: UpdateUserData) {
    // Check if email is being changed and if it already exists
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } },
      });
      if (existing) {
        throw new Error('Email already exists');
      }
    }

    const updateData: any = { ...data };
    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified ? new Date() : null;
    }

    const user = await prisma.user.update({
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
  async resetPassword(userId: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  }
  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deleting the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }

  /**
   * Block user
   */
  async blockUser(userId: string, reason?: string, adminId?: string) {
    const user = await prisma.user.update({
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
  async unblockUser(userId: string) {
    const user = await prisma.user.update({
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
  async getLoginAttempts(params: { page?: number; limit?: number; email?: string; success?: boolean }) {
    const { page = 1, limit = 50, email, success } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (email) where.email = { contains: email };
    if (success !== undefined) where.success = success;

    const [attempts, total] = await Promise.all([
      prisma.loginAttempt.findMany({
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
      prisma.loginAttempt.count({ where }),
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
  async getNotifications(params: { unreadOnly?: boolean; limit?: number }) {
    const { unreadOnly = false, limit = 50 } = params;

    const where: any = {};
    if (unreadOnly) where.read = false;

    const notifications = await prisma.adminNotification.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.adminNotification.count({
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
  async markNotificationRead(notificationId: string) {
    return prisma.adminNotification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead() {
    return prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true },
    });
  }

  /**
   * Deletes all admin notifications.
   */
  async clearAllNotifications() {
    return prisma.adminNotification.deleteMany({});
  }

  /**
   * Create notification
   */
  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    return prisma.adminNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
      },
    });
  }
}

export const adminService = new AdminService();
