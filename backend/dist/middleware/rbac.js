"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTaskAccess = exports.requireProjectAccess = exports.requirePM = exports.requireRole = void 0;
const prisma_1 = require("../config/prisma");
/**
 * Middleware to require specific roles
 * Usage: requireRole(['ADMIN', 'PM'])
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
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
            if (!allowedRoles.includes(dbUser.role)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: allowedRoles,
                    current: dbUser.role
                });
            }
            // Attach role to request for downstream use
            req.user = {
                userId: user.userId,
                email: user.email,
                role: dbUser.role,
            };
            next();
        }
        catch (error) {
            console.error('RBAC error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};
exports.requireRole = requireRole;
/**
 * Middleware to require PM role
 */
const requirePM = () => (0, exports.requireRole)(['ADMIN', 'PM']);
exports.requirePM = requirePM;
/**
 * Middleware to check if user owns or is assigned to a project
 */
const requireProjectAccess = async (req, res, next) => {
    try {
        const user = req.user;
        const projectId = req.params.id || req.body.projectId || req.query.projectId;
        if (!user || !user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.userId },
            select: { role: true },
        });
        // Admins have access to all projects
        if (dbUser?.role === 'ADMIN') {
            return next();
        }
        // PMs can only access their own projects
        if (dbUser?.role === 'PM') {
            const project = await prisma_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    managerId: user.userId,
                },
            });
            if (!project) {
                return res.status(403).json({ error: 'You do not have access to this project' });
            }
            return next();
        }
        // Clients can only view their projects (read-only)
        if (dbUser?.role === 'CLIENT') {
            const project = await prisma_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    client: {
                    // Assuming we'll add a userId field to Client model later
                    // For now, just deny write operations
                    },
                },
            });
            if (req.method !== 'GET') {
                return res.status(403).json({ error: 'Clients have read-only access' });
            }
            return next();
        }
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    catch (error) {
        console.error('Project access check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireProjectAccess = requireProjectAccess;
/**
 * Middleware to check if user has access to a task
 */
const requireTaskAccess = async (req, res, next) => {
    try {
        const user = req.user;
        const taskId = req.params.id || req.body.taskId;
        if (!user || !user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const dbUser = await prisma_1.prisma.user.findUnique({
            where: { id: user.userId },
            select: { role: true },
        });
        // Admins have access to all tasks
        if (dbUser?.role === 'ADMIN') {
            return next();
        }
        const task = await prisma_1.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    select: { managerId: true },
                },
            },
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // PMs can access tasks in their projects
        if (dbUser?.role === 'PM') {
            if (task.project.managerId !== user.userId) {
                return res.status(403).json({ error: 'You do not have access to this task' });
            }
            return next();
        }
        // Subcontractors can only access tasks assigned to them
        if (dbUser?.role === 'SUBCONTRACTOR') {
            if (task.assigneeId !== user.userId) {
                return res.status(403).json({ error: 'You can only access tasks assigned to you' });
            }
            // Subcontractors can only update status, not delete or reassign
            if (req.method === 'DELETE') {
                return res.status(403).json({ error: 'Subcontractors cannot delete tasks' });
            }
            return next();
        }
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    catch (error) {
        console.error('Task access check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireTaskAccess = requireTaskAccess;
