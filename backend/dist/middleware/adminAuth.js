"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const prisma_1 = require("../config/prisma");
/**
 * Middleware to verify admin access
 * Must be used after the authenticate middleware
 */
const requireAdmin = async (req, res, next) => {
    try {
        // req.user should be set by authenticate middleware
        const user = req.user;
        if (!user || !user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Get user from database to check role
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.userId },
            select: { id: true, email: true, role: true, isBlocked: true },
        });
        if (!dbUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (dbUser.isBlocked) {
            return res.status(403).json({ error: 'Account is blocked' });
        }
        if (dbUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        // Attach admin info to request
        req.admin = {
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
        };
        next();
    }
    catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireAdmin = requireAdmin;
