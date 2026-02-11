"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectService = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    code: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    startDate: zod_1.z.string().datetime().optional(), // Expecting ISO string
    endDate: zod_1.z.string().datetime().optional(),
    clientId: zod_1.z.string().optional(),
    managerId: zod_1.z.string().optional(),
});
exports.updateProjectSchema = exports.createProjectSchema.partial();
exports.projectService = {
    async listProjects(params) {
        const where = {};
        if (params?.status)
            where.status = params.status;
        if (params?.clientId)
            where.clientId = params.clientId;
        if (params?.managerId)
            where.managerId = params.managerId;
        return prisma_1.prisma.project.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            include: {
                client: true,
                manager: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { tasks: true },
                },
            },
        });
    },
    async getProject(id) {
        return prisma_1.prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                manager: {
                    select: { id: true, name: true, email: true },
                },
                tasks: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignee: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });
    },
    async createProject(data) {
        return prisma_1.prisma.project.create({
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
    },
    async updateProject(id, data) {
        return prisma_1.prisma.project.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
    },
    async deleteProject(id) {
        return prisma_1.prisma.project.delete({
            where: { id },
        });
    },
};
