import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { callSessionService } from '../services/callSessionService';
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
 * GET /calls/active
 * Get all active calls for current user
 */
router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activeCalls = await callSessionService.getActiveCallsForUser(userId);
    res.json({ activeCalls });
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({ error: 'Failed to fetch active calls' });
  }
});

/**
 * GET /calls/:callSessionId
 * Get call session details
 */
router.get('/:callSessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { callSessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const callSession = await callSessionService.getCallSession(callSessionId);

    // Verify user is a participant
    const isParticipant = callSession.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ callSession });
  } catch (error) {
    console.error('Error fetching call session:', error);
    res.status(500).json({ error: 'Failed to fetch call session' });
  }
});

/**
 * GET /calls/conversation/:conversationId/history
 * Get call history for a conversation
 */
router.get('/conversation/:conversationId/history', async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user is a member of conversation
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

    const callHistory = await callSessionService.getCallHistory(conversationId);
    res.json({ callHistory });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

/**
 * POST /calls/:callSessionId/end
 * End a call session (HTTP endpoint for redundancy)
 */
router.post('/:callSessionId/end', async (req: AuthRequest, res: Response) => {
  try {
    const { callSessionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const callSession = await callSessionService.getCallSession(callSessionId);

    // Verify user is a participant
    const isParticipant = callSession.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove participant
    await callSessionService.removeParticipant(callSessionId, userId);

    // Check if call should be ended
    const updatedCall = await callSessionService.getCallSession(callSessionId);
    if (updatedCall.participants.length === 0) {
      await callSessionService.endCallSession(callSessionId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

export default router;

