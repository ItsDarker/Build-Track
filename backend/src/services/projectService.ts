import { prisma } from '../config/prisma';
import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    startDate: z.string().datetime().optional(), // Expecting ISO string
    endDate: z.string().datetime().optional(),
    clientId: z.string().optional(),
    managerId: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectService = {
    async listProjects(params?: { status?: string; clientId?: string; managerId?: string }) {
        const where: any = {};
        if (params?.status) where.status = params.status;
        if (params?.clientId) where.clientId = params.clientId;
        if (params?.managerId) where.managerId = params.managerId;

        return prisma.project.findMany({
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

    async getProject(id: string) {
        return prisma.project.findUnique({
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

    async createProject(data: z.infer<typeof createProjectSchema>) {
        return prisma.project.create({
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
    },

    async updateProject(id: string, data: z.infer<typeof updateProjectSchema>) {
        return prisma.project.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
    },

    async deleteProject(id: string) {
        return prisma.project.delete({
            where: { id },
        });
    },
};
