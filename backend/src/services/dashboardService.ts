import { prisma } from '../config/prisma';

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
                role: { in: ['ADMIN', 'PM', 'SUBCONTRACTOR'] },
                isBlocked: false
            }
        });

        return {
            activeTasks: taskCount,
            overdueIssues: overdueCount,
            teamMembers: teamCount,
        };
    }
};
