import { prisma } from '../lib/prisma';

export const dashboardService = {
    /**
     * Get personalized stats for a user
     */
    async getDashboardStats(userId: string, role: string) {
        const now = new Date();

        // Admin roles see everything
        const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'FINANCE_MANAGER'].includes(role);

        // 1. Total Active Tasks
        let taskCount = 0;
        const PM_ROLES = ['PROJECT_MANAGER', 'PROJECT_COORDINATOR'];
        if (isAdmin) {
            taskCount = await prisma.task.count({
                where: { status: { not: 'DONE' } }
            });
        } else if (PM_ROLES.includes(role)) {
            taskCount = await prisma.task.count({
                where: {
                    project: { managerId: userId },
                    status: { not: 'DONE' }
                }
            });
        } else if (role === 'CLIENT') {
            // Client sees tasks for their invited projects
            taskCount = await prisma.task.count({
                where: {
                    project: { members: { some: { userId } } },
                    status: { not: 'DONE' }
                }
            });
        } else {
            // Sales, QC, Production, Logistics, etc. see only assigned tasks
            taskCount = await prisma.task.count({
                where: {
                    assigneeId: userId,
                    status: { not: 'DONE' }
                }
            });
        }

        // 2. Overdue Issues
        let overdueCount = 0;
        const overdueQuery: any = {
            dueDate: { lt: now },
            status: { not: 'DONE' }
        };

        if (PM_ROLES.includes(role)) {
            overdueQuery.project = { managerId: userId };
        } else if (role === 'CLIENT') {
            overdueQuery.project = { members: { some: { userId } } };
        } else if (!isAdmin) {
            overdueQuery.assigneeId = userId;
        }

        overdueCount = await prisma.task.count({ where: overdueQuery });

        // 3. Team Members count (Filtered for privacy)
        let teamCount = 0;
        if (isAdmin || PM_ROLES.includes(role)) {
            teamCount = await prisma.user.count({
                where: {
                    role: { is: { name: { in: ['SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER', 'PROJECT_COORDINATOR', 'PRODUCTION_MANAGER', 'LOGISTICS_MANAGER'] } } },
                    isBlocked: false
                }
            });
        } else if (role === 'CLIENT') {
            // Clients only see the PM of their project
            const projects = await prisma.project.findMany({
                where: { members: { some: { userId } } },
                select: { managerId: true }
            });
            const managerIds = projects.map(p => p.managerId).filter(Boolean) as string[];
            teamCount = [...new Set(managerIds)].length;
        }

        // 4. Active Projects (not completed/cancelled)
        const projectWhere: any = {
            status: { notIn: ['COMPLETED', 'CANCELLED'] }
        };
        if (isAdmin) {
            // No filter
        } else if (PM_ROLES.includes(role)) {
            projectWhere.managerId = userId;
        } else if (role === 'CLIENT') {
            projectWhere.members = { some: { userId } };
        } else {
            // Sales / QC / Production / Logistics / Vendor see only projects they're a member of
            projectWhere.members = { some: { userId } };
        }
        const activeProjects = await prisma.project.count({ where: projectWhere });

        // 5. Open Work Orders (Filtered)
        const woWhere: any = { moduleSlug: 'work-orders' };
        if (!isAdmin) {
            const userProjects = (await prisma.project.findMany({
                where: {
                    OR: [
                        { managerId: userId },
                        { members: { some: { userId } } }
                    ]
                },
                select: { id: true, code: true, name: true }
            }));
            const userProjectIds = userProjects.map(p => p.id);
            const userProjectCodes = userProjects.map(p => p.code).filter(Boolean) as string[];
            const userProjectNames = userProjects.map(p => p.name).filter(Boolean) as string[];
            const allIdentifiers = [...new Set([...userProjectIds, ...userProjectCodes, ...userProjectNames])];

            woWhere.OR = allIdentifiers.flatMap(val => [
                { data: { path: ['projectId'], equals: val } },
                { data: { path: ['_projectId'], equals: val } },
                { data: { path: ['_projectCode'], equals: val } },
                { data: { path: ['Project Code'], equals: val } },
                { data: { path: ['Linked Project ID'], equals: val } },
                { data: { path: ['Project Name / Reference'], equals: val } },
                { data: { path: ['Project Reference'], equals: val } },
                { data: { path: ['Linked Project Name'], equals: val } },
                { data: { path: ['Project Name'], equals: val } },
                { data: { path: ['Project ID'], equals: val } }
            ]);
        }
        const openWorkOrders = await prisma.moduleRecord.count({ where: woWhere });

        return {
            activeTasks: taskCount,
            overdueIssues: overdueCount,
            teamMembers: teamCount,
            activeProjects,
            openWorkOrders,
        };
    }
};
