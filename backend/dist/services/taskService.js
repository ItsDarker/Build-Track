"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    dueDate: zod_1.z.string().datetime().optional(),
    projectId: zod_1.z.string().min(1),
    assigneeId: zod_1.z.string().optional(),
});
exports.updateTaskSchema = exports.createTaskSchema.partial();
exports.taskService = {
    async listTasks(params) {
        return prisma_1.prisma.task.findMany({
            where: { projectId: params.projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    },
    async createTask(data) {
        return prisma_1.prisma.task.create({
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
        });
    },
    async updateTask(id, data) {
        return prisma_1.prisma.task.update({
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
    async deleteTask(id) {
        return prisma_1.prisma.task.delete({
            where: { id },
        });
    },
};
