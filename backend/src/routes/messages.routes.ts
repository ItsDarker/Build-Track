import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RBACRequest } from '../middleware/rbac';
import { prisma } from '../config/prisma';
import { messagingService } from '../services/messagingService';

const router = Router();

/**
 * Middleware to enrich user with role and permissions
 */
const enrichUser = async (req: RBACRequest, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        isBlocked: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!dbUser || dbUser.isBlocked) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!dbUser.role) {
      return res.status(403).json({ error: 'User has no role assigned' });
    }

    const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'];
    const isAdmin = ADMIN_ROLES.includes(dbUser.role.name);

    (req as any).enrichedUser = {
      userId: user.userId,
      email: dbUser.email,
      roleName: dbUser.role.name,
      isAdmin,
      permissions: dbUser.role.permissions.map((p) => `${p.permission.action}:${p.permission.resource}`),
    };

    next();
  } catch (err) {
    console.error('User enrichment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply auth and user enrichment to all routes
router.use(authenticate);
router.use(enrichUser);

/**
 * GET /messages/conversation/:conversationId
 * Get messages in a conversation (with pagination)
 */
router.get('/conversation/:conversationId', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { conversationId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await messagingService.getMessages(
      conversationId,
      userId,
      limitNum,
      offsetNum
    );

    res.json(result);
  } catch (error) {
    if ((error as any).message?.includes('Access denied')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /messages
 * Send a new message
 * Body: { conversationId, encryptedContent, encryptionIv, authTag, messageType?, attachmentIds? }
 */
router.post('/', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { conversationId, encryptedContent, encryptionIv, authTag, messageType } = req.body;

    // Validate input
    if (!conversationId || !encryptedContent || !encryptionIv || !authTag) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check user is member of conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'User is not member of this conversation' });
    }

    // Validate message length (encrypted content is hex string)
    if (encryptedContent.length > 8000) {
      return res.status(400).json({ error: 'Message is too long' });
    }

    const message = await messagingService.sendMessage({
      conversationId,
      senderId: userId,
      encryptedContent,
      encryptionIv,
      authTag,
      messageType: messageType || 'text',
    });

    // Return encrypted message (client will decrypt with their key)
    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * GET /messages/:id
 * Get a specific message
 */
router.get('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        conversation: true,
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check user is member of conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId,
        },
      },
    });

    if (!isMember && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ message });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

/**
 * PUT /messages/:id
 * Edit a message (sender only)
 * Body: { encryptedContent, encryptionIv, authTag }
 */
router.put('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { encryptedContent, encryptionIv, authTag } = req.body;

    if (!encryptedContent || !encryptionIv || !authTag) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get message
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check authorization (sender or admin)
    if (message.senderId !== userId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only sender can edit message' });
    }

    const updated = await messagingService.editMessage(id, encryptedContent, encryptionIv, authTag);

    res.json({ message: updated });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

/**
 * DELETE /messages/:id
 * Soft delete a message (sender or admin)
 */
router.delete('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Get message
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check authorization (sender or admin)
    if (message.senderId !== userId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only sender can delete message' });
    }

    await messagingService.deleteMessage(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * PUT /messages/conversation/:conversationId/mark-read
 * Mark messages as read up to a timestamp
 */
router.put('/conversation/:conversationId/mark-read', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { conversationId } = req.params;

    // Verify user is member
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

    await messagingService.markMessagesAsRead(conversationId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
