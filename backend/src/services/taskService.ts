import { prisma } from '../config/prisma';
import { z } from 'zod';

export const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    projectId: z.string().min(1),
    assigneeId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskService = {
    async listTasks(params: { projectId: string }) {
        return prisma.task.findMany({
            where: { projectId: params.projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    },

    async createTask(data: z.infer<typeof createTaskSchema>) {
        return prisma.task.create({
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
        });
    },

    async updateTask(id: string, data: z.infer<typeof updateTaskSchema>) {
        return prisma.task.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
            },
        });
    },

    async deleteTask(id: string) {
        return prisma.task.delete({
            where: { id },
        });
    },
};
