import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying RBAC Implementation...');

    // 1. Check Roles
    const roles = await prisma.role.findMany();
    console.log(`Found ${roles.length} roles.`);
    if (roles.length < 12) {
        console.error('❌ Error: Expected 12 roles, found', roles.length);
    } else {
        console.log('✅ Roles seeded correctly.');
    }

    // 2. Check Permissions
    const permissions = await prisma.permission.findMany();
    console.log(`Found ${permissions.length} permissions.`);
    if (permissions.length === 0) {
        console.error('❌ Error: No permissions found.');
    } else {
        console.log('✅ Permissions seeded.');
    }

    // 3. Verify QC User
    const qcUser = await prisma.user.findUnique({
        where: { email: 'qc@buildtrack.com' },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            }
        }
    });

    if (!qcUser) {
        console.error('❌ Error: QC User not found.');
        return;
    }

    console.log(`Checking QC User (${qcUser.email})...`);
    console.log(`Role: ${qcUser.role?.displayName}`);

    const hasQCAccess = qcUser.role?.permissions.some(p =>
        p.permission.resource === 'qc' && p.permission.action === 'read'
    );

    const hasFinanceAccess = qcUser.role?.permissions.some(p =>
        p.permission.resource === 'finance' && p.permission.action === 'read'
    );

    if (hasQCAccess) {
        console.log('✅ QC User has access to Quality Control.');
    } else {
        console.error('❌ Error: QC User missing Quality Control access.');
        // Debug
        console.log('Permissions:', qcUser.role?.permissions.map(p => `${p.permission.action}:${p.permission.resource}`));
    }

    if (!hasFinanceAccess) {
        console.log('✅ QC User correctly denied access to Finance.');
    } else {
        console.error('❌ Error: QC User HAS access to Finance (Should be denied).');
    }

    // 4. Verify Admin User
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@buildtrack.com' },
        include: { role: true }
    });

    if (adminUser?.role?.name === 'SUPER_ADMIN') {
        console.log('✅ Admin User is SUPER_ADMIN.');
    } else {
        console.error('❌ Error: Admin User is not SUPER_ADMIN.', adminUser?.role);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
