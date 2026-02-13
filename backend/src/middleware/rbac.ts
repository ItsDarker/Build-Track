import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export interface RBACRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role?: string;
    };
}

/**
 * Middleware to require specific roles
 * Usage: requireRole(['ADMIN', 'PM'])
 */
export const requireRole = (allowedRoles: string[]) => {
    return async (req: RBACRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user || !user.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Get user from database to check role
            const dbUser = await prisma.user.findUnique({
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
        } catch (error) {
            console.error('RBAC error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to require PM role
 */
export const requirePM = () => requireRole(['ADMIN', 'PM']);

/**
 * Middleware to check if user owns or is assigned to a project
 */
export const requireProjectAccess = async (
    req: RBACRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        const projectId = req.params.id || req.body.projectId || req.query.projectId;

        if (!user || !user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { role: true },
        });

        // Admins have access to all projects
        if (dbUser?.role === 'ADMIN') {
            return next();
        }

        // PMs can only access their own projects
        if (dbUser?.role === 'PM') {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId as string,
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
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId as string,
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
    } catch (error) {
        console.error('Project access check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to check if user has access to a task
 */
export const requireTaskAccess = async (
    req: RBACRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user;
        const taskId = req.params.id || req.body.taskId;

        if (!user || !user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { role: true },
        });

        // Admins have access to all tasks
        if (dbUser?.role === 'ADMIN') {
            return next();
        }

        const task = await prisma.task.findUnique({
            where: { id: taskId as string },
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
    } catch (error) {
        console.error('Task access check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
