import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { SLUG_TO_RESOURCE } from '../config/moduleFields';

export interface RBACRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role?: {
            name: string;
            displayName: string;
        };
        permissions?: string[]; // Array of "action:resource" strings for quick check
    };
}

/**
 * Middleware to require a specific permission
 * Usage: requirePermission('read', 'work_orders')
 */
export const requirePermission = (action: string, resource: string) => {
    return async (req: RBACRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user || !user.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Get user with role and permissions
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: {
                    id: true,
                    email: true,
                    isBlocked: true,
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                },
            });

            if (!dbUser) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (dbUser.isBlocked) {
                return res.status(403).json({ error: 'Account is blocked' });
            }

            if (!dbUser.role) {
                return res.status(403).json({ error: 'User has no role assigned' });
            }

            // Super Admin / legacy Admin bypass — full access
            const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORG_ADMIN'];
            if (ADMIN_ROLES.includes(dbUser.role.name)) {
                req.user = {
                    userId: user.userId,
                    email: user.email,
                    role: { name: dbUser.role.name, displayName: dbUser.role.displayName },
                    permissions: ['*:*']
                };
                return next();
            }

            // Check specific permission
            const hasPermission = dbUser.role.permissions.some(rp =>
                rp.permission.resource === resource &&
                rp.permission.action === action
            );

            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: `${action}:${resource}`,
                    role: dbUser.role.displayName
                });
            }

            // Attach details for downstream
            const permissionStrings = dbUser.role.permissions.map(p => `${p.permission.action}:${p.permission.resource}`);

            req.user = {
                userId: user.userId,
                email: user.email,
                role: { name: dbUser.role.name, displayName: dbUser.role.displayName },
                permissions: permissionStrings
            };

            next();
        } catch (error) {
            console.error('RBAC error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to check project access (Dynamic)
 */
export const requireProjectAccess = async (
    req: RBACRequest,
    res: Response,
    next: NextFunction
) => {
    // This needs to be smarter now. checks if user can read ANY project, 
    // AND if they have specific access to THIS project.
    // For MVP/Transition, let's keep it simple:
    // 1. Check if they have 'read:project' permission globally.
    // 2. If 'read:project' is granted, check ownership/assignment logic.

    // ... logic to be refined. For now, we will verify basic 'read:project' permissions
    // and let the service layer handle the specific ownership checks (row-level security).
    // Or we reuse the logic below but updated.

    // For now, let's call requirePermission('read', 'project') manually inside the next step?
    // No, middleware chains.

    // Let's implement a quick hybrid.
    try {
        const user = req.user;
        const bodyProjectId = req.body.projectId || 
                           req.body._projectId || 
                           (req.body.data && (req.body.data.projectId || req.body.data._projectId || req.body.data['Linked Project ID']));
        const queryProjectId = req.query.projectId || req.query._projectId;
        
        // Only use params.id as projectId if it's NOT a modules route
        // (because in modules routes, :id is usually the record ID)
        const isModulesRoute = req.baseUrl.includes('/api/modules') || (req.params.slug && SLUG_TO_RESOURCE[req.params.slug]); // fallback if baseUrl is partial
        const paramsProjectId = isModulesRoute ? null : req.params.id;

        let projectId = (bodyProjectId || queryProjectId || paramsProjectId) as string;

        if (!user || !user.userId) return res.status(401).json({ error: 'Authentication required' });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            include: {
                role: {
                    include: { permissions: { include: { permission: true } } }
                }
            }
        });

        if (!dbUser || !dbUser.role) return res.status(403).json({ error: 'Access denied' });

        const roleName = dbUser.role.name;

        // 1. Check if they have 'read:project' permission globally.
        const canReadProjects = dbUser.role.permissions.some(p => p.permission.resource === 'project' && p.permission.action === 'read');
        if (!canReadProjects) {
            return res.status(403).json({ error: 'Insufficient permissions to view projects' });
        }

        // 2. Row-Level Security:
        // Admins and Finance managers can view all projects
        if (roleName === 'SUPER_ADMIN' || roleName === 'ORG_ADMIN' || roleName === 'FINANCE_MANAGER') {
            return next();
        }

        // 3. For list routes (no specific projectId), we let the service/router filter the results.
        if (!projectId) {
            return next();
        }

        // 4. For specific project access (GET /:id, POST /record, etc.):
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                members: { where: { userId: user.userId } }
            }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // User must be the Manager, the Assigned person, or an accepted Member
        const isManager = project.managerId === user.userId;
        const isAssigned = project.assignedToId === user.userId;
        const isMember = project.members && project.members.length > 0;

        if (isManager || isAssigned || isMember) {
            return next();
        }

        return res.status(403).json({ error: 'Access denied to this project' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Middleware to check task access
 * For now, just alias to requirePermission('read', 'work_orders')
 * In future, check if user is assigned to the project of the task
 */
export const requireTaskAccess = requirePermission('read', 'work_orders');

// ... other middlewares can be similarly updated or deprecated
