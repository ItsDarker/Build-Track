import { prisma } from '../lib/prisma';

export const dashboardService = {
    /**
     * Get personalized stats for a user
     */
    async getDashboardStats(userId: string, role: string) {
        const now = new Date();

        // 1. Total Active Tasks
        let taskCount = 0;
        if (role === 'ADMIN') {
            taskCount = await prisma.task.count({
                where: { status: { not: 'DONE' } }
            });
        } else if (role === 'PM') {
            taskCount = await prisma.task.count({
                where: {
                    project: { managerId: userId },
                    status: { not: 'DONE' }
                }
            });
        } else {
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

        if (role === 'PM') {
            overdueQuery.project = { managerId: userId };
        } else if (role !== 'ADMIN') {
            overdueQuery.assigneeId = userId;
        }

        overdueCount = await prisma.task.count({ where: overdueQuery });

        // 3. Team Members count (Visible to everyone for now)
        const teamCount = await prisma.user.count({
            where: {
                role: { is: { name: { in: ['ADMIN', 'PM', 'SUBCONTRACTOR'] } } },
                isBlocked: false
            }
        });

        // 4. Active Projects (not completed/cancelled)
        const projectWhere: any = {
            status: { notIn: ['COMPLETED', 'CANCELLED'] }
        };
        if (role === 'PM') {
            projectWhere.managerId = userId;
        }
        const activeProjects = await prisma.project.count({ where: projectWhere });

        // 5. Open Work Orders (ModuleRecord with slug 'work-orders')
        const openWorkOrders = await prisma.moduleRecord.count({
            where: { moduleSlug: 'work-orders' }
        });

        return {
            activeTasks: taskCount,
            overdueIssues: overdueCount,
            teamMembers: teamCount,
            activeProjects,
            openWorkOrders,
        };
    }
};
