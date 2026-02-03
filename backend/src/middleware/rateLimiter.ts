import { Request, Response, NextFunction } from 'express';
import { rateLimit, RateLimitConfig } from '../utils/rateLimit';

export function rateLimiter(endpoint: string, customConfig?: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const result = rateLimit(identifier, endpoint, customConfig);

    if (!result.success) {
      return res.status(429).json({
        error: result.message,
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', customConfig?.max || 5);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    next();
  };
}
