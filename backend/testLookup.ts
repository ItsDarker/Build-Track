import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const lookups = await prisma.lookup.findMany();
    console.log("Lookups count:", lookups.length);
}

main().finally(() => prisma.$disconnect());
