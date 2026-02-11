"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const prisma_1 = require("../config/prisma");
exports.dashboardService = {
    /**
     * Get personalized stats for a user
     */
    async getDashboardStats(userId, role) {
        const now = new Date();
        // 1. Total Active Tasks
        let taskCount = 0;
        if (role === 'ADMIN') {
            taskCount = await prisma_1.prisma.task.count({
                where: { status: { not: 'DONE' } }
            });
        }
        else if (role === 'PM') {
            taskCount = await prisma_1.prisma.task.count({
                where: {
                    project: { managerId: userId },
                    status: { not: 'DONE' }
                }
            });
        }
        else {
            taskCount = await prisma_1.prisma.task.count({
                where: {
                    assigneeId: userId,
                    status: { not: 'DONE' }
                }
            });
        }
        // 2. Overdue Issues
        let overdueCount = 0;
        const overdueQuery = {
            dueDate: { lt: now },
            status: { not: 'DONE' }
        };
        if (role === 'PM') {
            overdueQuery.project = { managerId: userId };
        }
        else if (role !== 'ADMIN') {
            overdueQuery.assigneeId = userId;
        }
        overdueCount = await prisma_1.prisma.task.count({ where: overdueQuery });
        // 3. Team Members count (Visible to everyone for now)
        const teamCount = await prisma_1.prisma.user.count({
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
