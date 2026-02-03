"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = rateLimiter;
const rateLimit_1 = require("../utils/rateLimit");
function rateLimiter(endpoint, customConfig) {
    return (req, res, next) => {
        const identifier = req.ip || 'unknown';
        const result = (0, rateLimit_1.rateLimit)(identifier, endpoint, customConfig);
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
