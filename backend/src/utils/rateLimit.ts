import { config } from '../config/env';

// In-memory rate limiter for development
// TODO: Replace with Redis-based limiter for production

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
}

export function rateLimit(
  identifier: string,
  endpoint: string,
  customConfig?: RateLimitConfig
): RateLimitResult {
  const maxRequests = customConfig?.max ?? config.rateLimit.max;
  const windowMs = customConfig?.windowMs ?? config.rateLimit.windowMs;

  const key = `${identifier}:${endpoint}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const resetInMinutes = Math.ceil((entry.resetAt - now) / 60000);
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      message: `Too many attempts. Please try again in ${resetInMinutes} minute${resetInMinutes !== 1 ? 's' : ''}.`,
    };
  }

  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Migration note for production:
// Use Redis with ioredis for production:
// const count = await redis.incr(key);
// if (count === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
// return count <= maxRequests;
