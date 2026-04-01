import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
    budget: z.number().optional().default(0),
    totalSpent: z.number().optional().default(0),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    clientId: z.string().optional(),
    managerId: z.string().optional(),
    assignedToId: z.string().optional(),
    cancellationReason: z.string().optional(),
    completionNote: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectService = {
    async listProjects(params?: { status?: string; clientId?: string; managerId?: string; user?: { id: string; role: string } }) {
        const where: any = {};
        if (params?.status) where.status = params.status;
        if (params?.clientId) where.clientId = params.clientId;
        if (params?.managerId) where.managerId = params.managerId;

        if (params?.user) {
            const { role, id } = params.user;
            if (!['SUPER_ADMIN', 'ORG_ADMIN', 'FINANCE_MANAGER'].includes(role)) {
                where.OR = [
                    { managerId: id },
                    { members: { some: { userId: id } } }
                ];
            }
        }

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

    async assignProject(id: string, assignedToId: string) {
        return prisma.project.update({
            where: { id },
            data: { assignedToId },
        });
    },

    async startProject(id: string, taskTitle: string, assigneeId: string) {
        await prisma.project.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
        });

        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true, name: true, code: true, clientId: true, client: { select: { name: true } } },
        });

        const task = await prisma.task.create({
            data: {
                title: taskTitle,
                status: 'TODO',
                priority: 'MEDIUM',
                projectId: id,
                assigneeId: assigneeId,
            },
        });

        // Auto-create Project Requirements module record linked to this project and task
        await prisma.moduleRecord.create({
            data: {
                moduleSlug: 'project-requirements',
                data: JSON.stringify({
                    _projectId: id,
                    _projectCode: project?.code || '',
                    _projectName: project?.name || '',
                    _clientId: project?.clientId || '',
                    _taskId: task.id,
                    'Requirement Record ID': `REQ-${Date.now().toString().slice(-6)}`,
                    'Task Status (New, In Progress, Completed)': 'New',
                    'Linked Project ID': id,
                    'Linked Project Name': project?.name || '',
                    'Linked Client Name': project?.client?.name || '',
                }),
                createdById: assigneeId,
                updatedById: assigneeId,
            },
        });

        return task;
    },
    

    async cancelProject(id: string, cancellationReason: string) {
        return prisma.project.update({
            where: { id },
            data: { status: 'CANCELLED', cancellationReason },
        });
    },

    async closeProject(id: string, completionNote?: string) {
        return prisma.project.update({
            where: { id },
            data: { status: 'COMPLETED', completionNote },
        });
    },

    async restoreProject(id: string) {
        return prisma.project.update({
            where: { id },
            data: { status: 'PLANNING', cancellationReason: null },
        });
    },
};
