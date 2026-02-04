import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = 'admin@buildtrack.com';
  const adminPassword = 'Adm!n@Build26';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@buildtrack.local' },
        { email: 'admin@buildtrack.com' },
      ],
    },
  });

  if (existingAdmin) {
    // If the admin exists with the old email, update it.
    if (existingAdmin.email === 'admin@buildtrack.local') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          email: 'admin@buildtrack.com',
          name: 'Admin',
          passwordHash,
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });
      console.log('Updated admin user email to:', 'admin@buildtrack.com');
    } else {
      console.log('Admin user already exists:', 'admin@buildtrack.com');
    }
  } else {
    // If no admin user exists, create one.
    await prisma.user.create({
      data: {
        email: 'admin@buildtrack.com',
        name: 'Admin',
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log('Created admin user:', 'admin@buildtrack.com');
  }

  // Seed default homepage content
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
        {
          id: 'features',
          type: 'features',
          order: 1,
          visible: true,
          content: {
            sectionTitle: 'Stop the Chaos. Start Building.',
            sectionSubtitle: 'Everything you need to keep your construction projects on track',
            items: [
              {
                id: 'feature-1',
                icon: 'CheckCircle2',
                title: 'Task & Issue Tracking',
                description: 'Assign tasks, track issues, and never lose sight of what needs to be done.',
                bullets: ['Project Managers', 'Contractors', 'Owner/Builders'],
              },
              {
                id: 'feature-2',
                icon: 'Users',
                title: 'Role-Based Access Control',
                description: 'Control who sees what. Assign roles with specific permissions.',
                bullets: ['Admin controls', 'Team permissions', 'Secure access'],
              },
              {
                id: 'feature-3',
                icon: 'FileText',
                title: 'Immutable Audit Trail',
                description: 'Every action is logged. Know who did what and when.',
                bullets: ['Complete history', 'Accountability', 'Compliance ready'],
              },
            ],
          },
        },
        {
          id: 'security',
          type: 'security',
          order: 2,
          visible: true,
          content: {
            sectionTitle: 'Built for Speed and Security',
            features: [
              { icon: 'Zap', title: 'Lightning Fast', description: 'Optimized for speed' },
              { icon: 'Shield', title: 'Enterprise Security', description: 'Bank-level encryption' },
              { icon: 'Lock', title: 'Data Privacy', description: 'Your data stays yours' },
            ],
            roadmapItems: [
              'Gantt chart views',
              'File attachments',
              'Mobile apps',
            ],
          },
        },
        {
          id: 'footer',
          type: 'footer',
          order: 3,
          visible: true,
          content: {
            companyName: 'BuildTrack',
            contactEmail: 'contact@buildtrack.app',
            links: [
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ],
          },
        },
      ],
    };

    await prisma.siteContent.create({
      data: {
        page: 'home',
        sections: JSON.stringify(defaultHomepageContent.sections),
      },
    });
    console.log('Created default homepage content');
  } else {
    console.log('Homepage content already exists');
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
