import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Get token from cookie
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}
