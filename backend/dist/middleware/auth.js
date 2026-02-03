"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    try {
        // Get token from cookie
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Verify token
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function optionalAuth(req, res, next) {
    try {
        const token = req.cookies.accessToken;
        if (token) {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            req.user = payload;
        }
    }
    catch (error) {
        // Silently ignore invalid tokens for optional auth
    }
    next();
}
