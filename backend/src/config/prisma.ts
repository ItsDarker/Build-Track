import { PrismaClient } from "@prisma/client";

// Prevent creating many Prisma instances during tsx watch/hot reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["query", "error", "warn"], // optional when debugging
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
