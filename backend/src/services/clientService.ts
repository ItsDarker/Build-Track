import { prisma } from '../config/prisma';
import { z } from 'zod';

export const createClientSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientService = {
    async listClients() {
        return prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });
    },

    async getClient(id: string) {
        return prisma.client.findUnique({
            where: { id },
            include: {
                projects: true,
            },
        });
    },

    async createClient(data: z.infer<typeof createClientSchema>) {
        // Check if email exists if provided
        if (data.email) {
            const existing = await prisma.client.findFirst({
                where: { email: data.email },
            });
            if (existing) {
                throw new Error('Client with this email already exists');
            }
        }

        return prisma.client.create({
            data,
        });
    },

    async updateClient(id: string, data: z.infer<typeof updateClientSchema>) {
        return prisma.client.update({
            where: { id },
            data,
        });
    },

    async deleteClient(id: string) {
        return prisma.client.delete({
            where: { id },
        });
    },
};
