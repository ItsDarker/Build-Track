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
 * GET /conversations
 * List all conversations for current user
 */
router.get('/', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const conversations = await messagingService.getConversationsForUser(userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * POST /conversations
 * Create a new conversation (one-to-one or group)
 * Group creation requires PROJECT_MANAGER role or higher
 */
router.post('/', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, description, isGroup, memberIds } = req.body;

    // Validate input
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'At least one member required' });
    }

    if (isGroup) {
      // Check permission for group creation — only PM and admins
      const ALLOWED_GROUP_CREATOR_ROLES = ['PROJECT_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'];
      const canCreateGroup = ALLOWED_GROUP_CREATOR_ROLES.includes((req as any).enrichedUser.roleName);

      if (!canCreateGroup) {
        return res.status(403).json({
          error: 'Permission denied: only Project Managers and admins can create groups',
        });
      }

      // Validate group name
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Group name is required' });
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'Group name must be less than 100 characters' });
      }
    } else {
      // One-to-one: exactly 2 members (including requester)
      if (memberIds.length !== 2 || !memberIds.includes(userId)) {
        return res.status(400).json({ error: 'One-to-one chat requires exactly 2 members' });
      }

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          members: {
            every: {
              userId: {
                in: memberIds,
              },
            },
          },
          deletedAt: null,
        },
      });

      if (existingConversation) {
        return res.json({ conversation: existingConversation, isExisting: true });
      }
    }

    // Ensure creator is included in members
    if (!memberIds.includes(userId)) {
      memberIds.push(userId);
    }

    // Validate all members exist
    const users = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true },
    });

    if (users.length !== memberIds.length) {
      return res.status(400).json({ error: 'One or more members do not exist' });
    }

    const conversation = await messagingService.createConversation({
      name,
      description,
      isGroup,
      createdById: userId,
      memberIds: Array.from(new Set(memberIds)), // Remove duplicates
    });

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /conversations/:id
 * Get conversation details including members and shared key
 */
router.get('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const conversation = await messagingService.getConversation(id, userId);
    res.json({ conversation });
  } catch (error) {
    if ((error as any).message?.includes('not found')) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if ((error as any).message?.includes('Access denied')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * PUT /conversations/:id
 * Update conversation (name, description) — creator only
 */
router.put('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check authorization (creator or admin)
    if (conversation.createdById !== userId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only creator can update conversation' });
    }

    // Validate input
    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Group name must be less than 100 characters' });
    }

    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be less than 500 characters' });
    }

    const updated = await messagingService.updateConversation(id, {
      name: name || undefined,
      description: description || undefined,
    });

    res.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * DELETE /conversations/:id
 * Soft delete conversation — creator only
 */
router.delete('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check authorization (creator or admin)
    if (conversation.createdById !== userId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only creator can delete conversation' });
    }

    await messagingService.deleteConversation(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * GET /conversations/:id/members
 * List conversation members
 */
router.get('/:id/members', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
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

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check user is member
    const isMember = conversation.members.some((m) => m.userId === userId);
    if (!isMember && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ members: conversation.members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * POST /conversations/:id/members
 * Add members to group — creator or admin only
 */
router.post('/:id/members', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'At least one user ID required' });
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check authorization
    if (conversation.createdById !== userId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only creator can add members' });
    }

    // For now, adding members requires key re-wrapping which is complex
    // This is a limitation noted in the plan
    res.status(501).json({
      error: 'Adding members requires administrator support for key re-wrapping',
    });
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

/**
 * DELETE /conversations/:id/members/:userId
 * Remove a member from group — creator or admin only
 */
router.delete('/:id/members/:userId', async (req: RBACRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id, userId } = req.params;

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check authorization
    if (conversation.createdById !== currentUserId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only creator can remove members' });
    }

    await messagingService.removeConversationMember(id, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * POST /conversations/:id/leave
 * Current user leaves conversation
 */
router.post('/:id/leave', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Verify user is member
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    if (!isMember) {
      return res.status(404).json({ error: 'User is not member of this conversation' });
    }

    await messagingService.leaveConversation(id, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving conversation:', error);
    res.status(500).json({ error: 'Failed to leave conversation' });
  }
});

/**
 * PUT /conversations/:id
 * Update group details (name, icon) — creator or admin only
 */
router.put('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { name, iconUrl } = req.body;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Ensure it's a group
    if (!conversation.isGroup) {
      return res.status(400).json({ error: 'Cannot update details of a 1:1 conversation' });
    }

    // Role check
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } }
    });
    const isGlobalAdmin = (req as any).enrichedUser.isAdmin;
    const isGroupOwner = conversation.createdById === userId;
    const isGroupAdmin = member?.role === 'ADMIN';

    if (!isGlobalAdmin && !isGroupOwner && !isGroupAdmin) {
      return res.status(403).json({ error: 'Only group admins can update group details' });
    }

    const updated = await messagingService.updateConversation(id, { name, iconUrl });
    res.json({ conversation: updated });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * PATCH /conversations/:id/members/:userId
 * Update member role — creator or admin only
 */
router.patch('/:id/members/:userId', async (req: RBACRequest, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id, userId } = req.params;
    const { role } = req.body;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Role check
    const currentMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: currentUserId } }
    });
    const isGlobalAdmin = (req as any).enrichedUser.isAdmin;
    const isGroupOwner = conversation.createdById === currentUserId;
    const isGroupAdmin = currentMember?.role === 'ADMIN';

    if (!isGlobalAdmin && !isGroupOwner && !isGroupAdmin) {
      return res.status(403).json({ error: 'Only group admins can update roles' });
    }

    // Prevent changing the creator's role
    if (userId === conversation.createdById && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot downgrade the group creator' });
    }

    const updated = await messagingService.updateConversationMemberRole(id, userId, role);
    res.json({ member: updated });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

export default router;
