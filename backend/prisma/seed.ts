import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'SUPER_ADMIN', displayName: 'Super Admin', isSystem: true },
  { name: 'ORG_ADMIN', displayName: 'Organization Admin', isSystem: false },
  { name: 'PROJECT_MANAGER', displayName: 'Project Manager', isSystem: false },
  { name: 'SALES_MANAGER', displayName: 'Sales / CRM Manager', isSystem: false },
  { name: 'PROJECT_COORDINATOR', displayName: 'Project Coordinator', isSystem: false },
  { name: 'PROCUREMENT_MANAGER', displayName: 'Procurement Manager', isSystem: false },
  { name: 'PRODUCTION_MANAGER', displayName: 'Production Manager', isSystem: false },
  { name: 'QC_MANAGER', displayName: 'QC Manager', isSystem: false },
  { name: 'LOGISTICS_MANAGER', displayName: 'Logistics Manager', isSystem: false },
  { name: 'FINANCE_MANAGER', displayName: 'Finance Manager', isSystem: false },
  { name: 'CLIENT', displayName: 'Client', isSystem: false },
  { name: 'VENDOR', displayName: 'Vendor', isSystem: false },
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'approve'] as const;
const RESOURCES = [
  'crm',
  'quoting',
  'work_orders',
  'project',
  'finance',
  'qc',
  'inventory',
  'production',
  'users',
  'settings',
  'scheduling',
  'delivery'
] as const;

// Helper to expand permissions
const p = (resource: string, actions: string[]) => actions.map(action => ({ resource, action }));

// Permission Matrix based on documentation
const ROLE_PERMISSIONS: Record<string, { resource: string, action: string }[]> = {
  SUPER_ADMIN: [
    ...p('crm', ['read', 'create', 'update', 'delete']),
    ...p('quoting', ['read', 'create', 'update', 'approve']),
    ...p('work_orders', ['read', 'create', 'update', 'delete', 'approve']),
    ...p('project', ['read', 'create', 'update', 'delete']),
    ...p('finance', ['read', 'create', 'update', 'approve']),
    ...p('qc', ['read', 'create', 'update', 'approve']),
    ...p('inventory', ['read', 'create', 'update']),
    ...p('production', ['read', 'create', 'update', 'approve']),
    ...p('users', ['read', 'create', 'update', 'delete']),
    ...p('settings', ['read', 'update']),
    ...p('scheduling', ['read', 'create', 'update']),
    ...p('delivery', ['read', 'create', 'update']),
  ],
  ORG_ADMIN: [
    ...p('crm', ['read', 'create', 'update', 'delete']),
    ...p('quoting', ['read', 'create', 'update', 'approve']),
    ...p('work_orders', ['read', 'create', 'update', 'delete', 'approve']),
    ...p('project', ['read', 'create', 'update', 'delete']),
    ...p('finance', ['read', 'create', 'update', 'approve']),
    ...p('qc', ['read', 'create', 'update', 'approve']),
    ...p('inventory', ['read', 'create', 'update']),
    ...p('production', ['read', 'create', 'update', 'approve']),
    ...p('users', ['read', 'create', 'update', 'delete']),
    ...p('settings', ['read', 'update']),
    ...p('scheduling', ['read', 'create', 'update']),
    ...p('delivery', ['read', 'create', 'update']),
  ],
  PROJECT_MANAGER: [
    ...p('crm', ['read']),
    ...p('quoting', ['read']),
    ...p('project', ['read', 'create', 'update']),
    ...p('work_orders', ['read', 'create', 'update']),
    ...p('scheduling', ['read', 'create', 'update']),
    ...p('qc', ['read']),
    ...p('finance', ['read']),
  ],
  SALES_MANAGER: [
    ...p('crm', ['read', 'create', 'update']),
    ...p('quoting', ['read', 'create', 'update']),
  ],
  PROJECT_COORDINATOR: [
    ...p('project', ['read', 'update']), // Requirements gathering
    ...p('work_orders', ['read', 'create', 'update']),
    ...p('inventory', ['read']),
  ],
  PROCUREMENT_MANAGER: [
    ...p('inventory', ['read', 'create', 'update']),
    ...p('project', ['read']),
  ],
  PRODUCTION_MANAGER: [
    ...p('work_orders', ['read', 'update']),
    ...p('production', ['read', 'create', 'update']),
    ...p('scheduling', ['read', 'create', 'update']),
  ],
  QC_MANAGER: [
    ...p('work_orders', ['read']),
    ...p('qc', ['read', 'create', 'update', 'approve']),
  ],
  LOGISTICS_MANAGER: [
    ...p('delivery', ['read', 'create', 'update']),
    ...p('work_orders', ['read']),
    ...p('project', ['read']),
  ],
  FINANCE_MANAGER: [
    ...p('finance', ['read', 'create', 'update', 'approve']),
    ...p('project', ['read']),
  ],
  CLIENT: [
    ...p('project', ['read']),
    ...p('work_orders', ['read']), // Status only
    ...p('delivery', ['read']),
    ...p('finance', ['read']), // Invoices only
  ],
  VENDOR: [
    // Limited scope, usually just their POs
    ...p('inventory', ['read', 'update']),
  ],
};

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles
  const roleMap: Record<string, string> = {};
  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {},
      create: roleDef,
    });
    roleMap[roleDef.name] = role.id;
    console.log(`Role ensured: ${roleDef.name}`);
  }

  // 2. Create Permissions and Assign to Roles
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;

    for (const perm of permissions) {
      // Ensure Permission exists
      const permission = await prisma.permission.upsert({
        where: {
          action_resource: {
            action: perm.action,
            resource: perm.resource,
          },
        },
        update: {},
        create: {
          action: perm.action,
          resource: perm.resource,
          description: `${perm.action} access to ${perm.resource}`,
        },
      });

      // Link Role to Permission
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: roleId,
          permissionId: permission.id,
        },
      });
    }
    console.log(`Permissions assigned for: ${roleName}`);
  }

  // 3. Create Users for each Role
  const passwordHash = await bcrypt.hash('BuildTrack2026', 10);

  // Admin User
  await prisma.user.upsert({
    where: { email: 'admin@buildtrack.com' },
    update: {
      roleId: roleMap['SUPER_ADMIN'],
    },
    create: {
      email: 'admin@buildtrack.com',
      name: 'Super Admin',
      passwordHash,
      roleId: roleMap['SUPER_ADMIN'],
      emailVerified: new Date(),
    },
  });

  // Demo Users for other roles
  const demoUsers = [
    { email: 'pm@buildtrack.com', name: 'Project Manager', role: 'PROJECT_MANAGER' },
    { email: 'qc@buildtrack.com', name: 'QC User', role: 'QC_MANAGER' },
    { email: 'finance@buildtrack.com', name: 'Finance User', role: 'FINANCE_MANAGER' },
    { email: 'client@buildtrack.com', name: 'Client User', role: 'CLIENT' },
    { email: 'sales@buildtrack.com', name: 'Sales User', role: 'SALES_MANAGER' },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        roleId: roleMap[u.role],
      },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        roleId: roleMap[u.role],
        emailVerified: new Date(),
      },
    });
    console.log(`Demo user created: ${u.email}`);
  }

  // 4. Site Content (Preserved)
  const existingContent = await prisma.siteContent.findUnique({
    where: { page: 'home' },
  });

  if (!existingContent) {
    const defaultHomepageContent = {
      sections: [
        {
          id: 'hero',
          type: 'hero',
          order: 0,
          visible: true,
          content: {
            title: 'One Reliable Place for Construction Tracking',
            titleAccent: 'Construction Tracking',
            subtitle: 'Clarity and accountability for every project, every step of the way. Built for builders who mean business.',
            buttonText: 'Get Started Free',
            buttonLink: '/signup',
            backgroundImage: '/brand/hero-bg.jpg',
            previewImage: '/brand/app-preview.png',
          },
        },
        // ... (rest of the JSON is large, just seeding minimal default for now to keep script clean)
      ],
    };

    await prisma.siteContent.create({
      data: {
        page: 'home',
        sections: JSON.stringify(defaultHomepageContent.sections),
      },
    });
    console.log('Created default homepage content');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
