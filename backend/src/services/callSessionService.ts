import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateCallSessionInput {
  conversationId?: string;
  initiatorId: string;
  callType: 'video' | 'audio';
  participantIds: string[]; // participants to add (excluding initiator)
}

export interface UpdateCallParticipantInput {
  micEnabled?: boolean;
  cameraEnabled?: boolean;
  sdpOffer?: string;
  sdpAnswer?: string;
}

/**
 * Call Session Service
 * Manages call lifecycle and participant tracking
 */
export class CallSessionService {
  /**
   * Create a new call session
   */
  async createCallSession(input: CreateCallSessionInput) {
    const callSession = await prisma.callSession.create({
      data: {
        conversationId: input.conversationId,
        callType: input.callType,
        initiatorId: input.initiatorId,
        status: 'ringing',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Add participants to the call
    const participantPromises = [
      ...input.participantIds,
      input.initiatorId, // Add initiator as well
    ].map((userId) =>
      prisma.callParticipant.create({
        data: {
          callSessionId: callSession.id,
          userId,
        },
      })
    );

    await Promise.all(participantPromises);

    // Return updated call session with participants
    return this.getCallSession(callSession.id);
  }

  /**
   * Get call session details
   */
  async getCallSession(callSessionId: string) {
    const callSession = await prisma.callSession.findUnique({
      where: { id: callSessionId },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!callSession) {
      throw new Error('Call session not found');
    }

    return callSession;
  }

  /**
   * Update call status
   */
  async updateCallStatus(
    callSessionId: string,
    status: 'ringing' | 'connecting' | 'active' | 'ended'
  ) {
    const data: any = { status };

    if (status === 'active') {
      data.startedAt = new Date();
    } else if (status === 'ended') {
      data.endedAt = new Date();
    }

    return prisma.callSession.update({
      where: { id: callSessionId },
      data,
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update participant media state
   */
  async updateParticipant(
    callSessionId: string,
    userId: string,
    updates: UpdateCallParticipantInput
  ) {
    return prisma.callParticipant.update({
      where: {
        callSessionId_userId: {
          callSessionId,
          userId,
        },
      },
      data: updates,
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

  /**
   * Remove participant from call (soft delete)
   */
  async removeParticipant(callSessionId: string, userId: string) {
    return prisma.callParticipant.update({
      where: {
        callSessionId_userId: {
          callSessionId,
          userId,
        },
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  /**
   * Get all active calls for a user
   */
  async getActiveCallsForUser(userId: string) {
    const activeCalls = await prisma.callSession.findMany({
      where: {
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
        status: {
          in: ['ringing', 'connecting', 'active'],
        },
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return activeCalls;
  }

  /**
   * Get call history for a conversation
   */
  async getCallHistory(conversationId: string, limit: number = 50) {
    const calls = await prisma.callSession.findMany({
      where: { conversationId },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return calls;
  }

  /**
   * End a call session
   */
  async endCallSession(callSessionId: string) {
    // Mark all participants as left
    await prisma.callParticipant.updateMany({
      where: {
        callSessionId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });

    // Update call session status to ended
    return this.updateCallStatus(callSessionId, 'ended');
  }
}

// Export singleton instance
export const callSessionService = new CallSessionService();

