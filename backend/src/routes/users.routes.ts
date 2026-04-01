import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/users/search
 * Search for users by name or email
 * Visible to all authenticated users, especially PM for creating conversations
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { query = '' } = req.query as { query?: string };
    const searchLower = query.toString().toLowerCase().trim();

    // If search is empty, return empty array
    if (searchLower.length === 0) {
      return res.json({ users: [] });
    }

    // Search users by name, displayName, email, or firstName/lastName
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            isBlocked: false, // Don't show blocked users
          },
          {
            OR: [
              {
                email: {
                  contains: searchLower,
                },
              },
              {
                name: {
                  contains: searchLower,
                },
              },
              {
                displayName: {
                  contains: searchLower,
                },
              },
              {
                firstName: {
                  contains: searchLower,
                },
              },
              {
                lastName: {
                  contains: searchLower,
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        jobTitle: true,
        role: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      take: 20, // Limit results for performance
      orderBy: {
        displayName: 'asc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

/**
 * GET /api/users
 * Get all non-blocked users
 * Used for displaying user list in conversation creation
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        jobTitle: true,
        role: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        displayName: 'asc',
      },
      take: 100, // Reasonable limit
    });

    res.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * GET /api/users/:userId
 * Get a specific user's info
 */
router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        jobTitle: true,
        isBlocked: true,
        role: {
          select: {
            name: true,
            displayName: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

