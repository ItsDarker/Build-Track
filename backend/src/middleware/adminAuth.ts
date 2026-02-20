import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface AdminRequest extends Request {
  admin?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify admin access
 * Must be used after the authenticate middleware
 */
export const requireAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.user should be set by authenticate middleware
    const user = (req as any).user;

    if (!user || !user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user from database to check role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, role: { select: { name: true } }, isBlocked: true },
    });

    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (dbUser.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    if (dbUser.role?.name !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Attach admin info to request
    req.admin = {
      userId: dbUser.id,
      email: dbUser.email,
      role: (dbUser.role as any)?.name || '',
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
