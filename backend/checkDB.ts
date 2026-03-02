import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ include: { role: true } });
    const clients = await prisma.client.findMany();
    fs.writeFileSync('db_out.json', JSON.stringify({
        users: users.map(u => ({ email: u.email, name: u.name, role: u.role?.name })),
        clients: clients.length
    }, null, 2));
}

main().finally(() => prisma.$disconnect());
