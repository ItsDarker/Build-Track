import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.lookup.findMany({ where: { moduleSlug: 'crm-leads' }, orderBy: { category: 'asc' } })
    .then(r => { console.log(JSON.stringify(r, null, 2)); return p.$disconnect(); });
