import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { presenceService } from '../services/presenceService';
import { prisma } from '../config/prisma';

const router = Router();

/**
 * Middleware to enrich user with role
 */
const enrichUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || !user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, isBlocked: true },
    });

    if (!dbUser || dbUser.isBlocked) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (err) {
    console.error('User enrichment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.use(authenticate);
router.use(enrichUser);

/**
 * GET /presence/me
 * Get current user's presence
 */
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const presence = await presenceService.getPresence(userId);
    res.json({ presence });
  } catch (error) {
    console.error('Error fetching user presence:', error);
    res.status(500).json({ error: 'Failed to fetch presence' });
  }
});

/**
 * GET /presence/:userId
 * Get presence for a specific user
 */
router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const presence = await presenceService.getPresence(userId);
    res.json({ presence });
  } catch (error) {
    console.error('Error fetching user presence:', error);
    res.status(500).json({ error: 'Failed to fetch presence' });
  }
});

/**
 * POST /presence/batch
 * Get presence for multiple users
 */
router.post('/batch', async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    const presences = await presenceService.getPresences(userIds);

    // Return as object map for easy lookup
    const presenceMap = presences.reduce((acc: any, p: any) => {
      acc[p.userId] = {
        status: p.status,
        lastSeenAt: p.lastSeenAt,
      };
      return acc;
    }, {});

    res.json({ data: presenceMap });
  } catch (error) {
    console.error('Error fetching presences:', error);
    res.status(500).json({ error: 'Failed to fetch presences' });
  }
});

/**
 * PUT /presence/status
 * Update current user's status
 */
router.put('/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.body;

    if (!['online', 'away', 'offline', 'in-call'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const presence = await presenceService.setStatus(userId, status);
    res.json({ presence });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * GET /presence/conversation/:conversationId/members
 * Get presence for all members of a conversation
 */
router.get('/conversation/:conversationId/members', async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user is a member
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const presences = await presenceService.getConversationMembersPresence(conversationId);
    res.json({ presences });
  } catch (error) {
    console.error('Error fetching conversation member presence:', error);
    res.status(500).json({ error: 'Failed to fetch member presence' });
  }
});

/**
 * GET /presence/active
 * Get all active users (online or in-call)
 */
router.get('/list/active', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const activeUsers = await presenceService.getActiveUsers(limit);
    res.json({ activeUsers });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

export default router;

