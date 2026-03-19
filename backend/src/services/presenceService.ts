import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PresenceStatus = 'online' | 'away' | 'offline' | 'in-call';

export interface UpdatePresenceInput {
  status?: PresenceStatus;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Presence Service
 * Manages user online/offline status and activity tracking
 */
export class PresenceService {
  /**
   * Initialize or update user presence
   */
  async updatePresence(userId: string, updates: UpdatePresenceInput) {
    // Try to update existing presence, or create new one
    let presence = await prisma.presenceSession.findUnique({
      where: { userId },
    });

    if (presence) {
      // Update existing
      presence = await prisma.presenceSession.update({
        where: { userId },
        data: {
          status: updates.status || presence.status,
          lastSeenAt: new Date(),
          deviceId: updates.deviceId,
          userAgent: updates.userAgent,
          ipAddress: updates.ipAddress,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } else {
      // Create new
      presence = await prisma.presenceSession.create({
        data: {
          userId,
          status: updates.status || 'online',
          deviceId: updates.deviceId,
          userAgent: updates.userAgent,
          ipAddress: updates.ipAddress,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    return presence;
  }

  /**
   * Set user status
   */
  async setStatus(userId: string, status: PresenceStatus) {
    return this.updatePresence(userId, { status });
  }

  /**
   * Get presence for a user
   */
  async getPresence(userId: string) {
    const presence = await prisma.presenceSession.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return presence;
  }

  /**
   * Get presence for multiple users
   */
  async getPresences(userIds: string[]) {
    const presences = await prisma.presenceSession.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return presences;
  }

  /**
   * Get active users (online or in-call)
   */
  async getActiveUsers(limit: number = 100) {
    const activeUsers = await prisma.presenceSession.findMany({
      where: {
        status: {
          in: ['online', 'in-call'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: limit,
    });

    return activeUsers;
  }

  /**
   * Mark user as offline (cleanup on disconnect)
   */
  async markOffline(userId: string) {
    return this.setStatus(userId, 'offline');
  }

  /**
   * Mark user as in-call
   */
  async markInCall(userId: string) {
    return this.setStatus(userId, 'in-call');
  }

  /**
   * Mark user as away
   */
  async markAway(userId: string) {
    return this.setStatus(userId, 'away');
  }

  /**
   * Get conversation members' presence statuses
   */
  async getConversationMembersPresence(conversationId: string) {
    const presences = await prisma.presenceSession.findMany({
      where: {
        user: {
          conversationMembers: {
            some: {
              conversationId,
              leftAt: null,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return presences;
  }

  /**
   * Cleanup stale presence sessions (older than threshold)
   */
  async cleanupStalePresenceSessions(thresholdMinutes: number = 30) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const result = await prisma.presenceSession.deleteMany({
      where: {
        AND: [
          {
            status: 'offline',
          },
          {
            updatedAt: {
              lt: threshold,
            },
          },
        ],
      },
    });

    return result;
  }
}

// Export singleton instance
export const presenceService = new PresenceService();

