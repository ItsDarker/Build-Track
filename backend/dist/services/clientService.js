"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientService = exports.updateClientSchema = exports.createClientSchema = void 0;
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateClientSchema = exports.createClientSchema.partial();
exports.clientService = {
    async listClients() {
        return prisma_1.prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });
    },
    async getClient(id) {
        return prisma_1.prisma.client.findUnique({
            where: { id },
            include: {
                projects: true,
            },
        });
    },
    async createClient(data) {
        // Check if email exists if provided
        if (data.email) {
            const existing = await prisma_1.prisma.client.findFirst({
                where: { email: data.email },
            });
            if (existing) {
                throw new Error('Client with this email already exists');
            }
        }
        return prisma_1.prisma.client.create({
            data,
        });
    },
    async updateClient(id, data) {
        return prisma_1.prisma.client.update({
            where: { id },
            data,
        });
    },
    async deleteClient(id) {
        return prisma_1.prisma.client.delete({
            where: { id },
        });
    },
};
