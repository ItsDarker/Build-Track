import { PrismaClient } from "@prisma/client";
import { config } from "../config/env";

declare global {
  // Prevent multiple instances in dev (hot reload)
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (config.nodeEnv !== "production") {
  global.prisma = prisma;
}
