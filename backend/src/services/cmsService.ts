import { prisma } from '../config/prisma';
import fs from 'fs';
import path from 'path';

export interface Section {
  id: string;
  type: 'hero' | 'features' | 'security' | 'footer' | 'custom';
  order: number;
  visible: boolean;
  content: Record<string, any>;
}

export interface PageContent {
  page: string;
  sections: Section[];
  updatedAt: Date;
  updatedBy: string | null;
}

class CmsService {
  private uploadsDir = path.join(__dirname, '../../public/uploads');

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Get page content
   */
  async getPageContent(page: string): Promise<PageContent | null> {
    const content = await prisma.siteContent.findUnique({
      where: { page },
    });

    if (!content) {
      return null;
    }

    return {
      page: content.page,
      sections: JSON.parse(content.sections),
      updatedAt: content.updatedAt,
      updatedBy: content.updatedBy,
    };
  }

  /**
   * Update page content
   */
  async updatePageContent(
    page: string,
    sections: Section[],
    updatedBy?: string
  ): Promise<PageContent> {
    const content = await prisma.siteContent.upsert({
      where: { page },
      create: {
        page,
        sections: JSON.stringify(sections),
        updatedBy,
      },
      update: {
        sections: JSON.stringify(sections),
        updatedBy,
      },
    });

    return {
      page: content.page,
      sections: JSON.parse(content.sections),
      updatedAt: content.updatedAt,
      updatedBy: content.updatedBy,
    };
  }

  /**
   * Add a new section to a page
   */
  async addSection(page: string, section: Section, updatedBy?: string): Promise<PageContent> {
    const content = await this.getPageContent(page);
    const sections = content?.sections || [];

    // Add new section at the end or at specified order
    sections.push(section);

    // Re-order sections
    sections.sort((a, b) => a.order - b.order);

    return this.updatePageContent(page, sections, updatedBy);
  }

  /**
   * Update a specific section
   */
  async updateSection(
    page: string,
    sectionId: string,
    updates: Partial<Section>,
    updatedBy?: string
  ): Promise<PageContent> {
    const content = await this.getPageContent(page);
    if (!content) {
      throw new Error('Page not found');
    }

    const sections = content.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    );

    return this.updatePageContent(page, sections, updatedBy);
  }

  /**
   * Delete a section
   */
  async deleteSection(page: string, sectionId: string, updatedBy?: string): Promise<PageContent> {
    const content = await this.getPageContent(page);
    if (!content) {
      throw new Error('Page not found');
    }

    const sections = content.sections.filter(s => s.id !== sectionId);

    // Re-order remaining sections
    sections.forEach((s, index) => {
      s.order = index;
    });

    return this.updatePageContent(page, sections, updatedBy);
  }

  /**
   * Reorder sections
   */
  async reorderSections(
    page: string,
    sectionIds: string[],
    updatedBy?: string
  ): Promise<PageContent> {
    const content = await this.getPageContent(page);
    if (!content) {
      throw new Error('Page not found');
    }

    // Create a map for quick lookup
    const sectionMap = new Map(content.sections.map(s => [s.id, s]));

    // Reorder based on provided IDs
    const reorderedSections = sectionIds
      .map((id, index) => {
        const section = sectionMap.get(id);
        if (section) {
          return { ...section, order: index };
        }
        return null;
      })
      .filter((s): s is Section => s !== null);

    return this.updatePageContent(page, reorderedSections, updatedBy);
  }

  /**
   * Upload image
   */
  async uploadImage(file: Express.Multer.File): Promise<{
    id: string;
    filename: string;
    path: string;
    url: string;
  }> {
    const image = await prisma.contentImage.create({
      data: {
        filename: file.originalname,
        path: file.filename,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return {
      id: image.id,
      filename: image.filename,
      path: image.path,
      url: `/uploads/${image.path}`,
    };
  }

  /**
   * List uploaded images
   */
  async listImages(params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params || {};
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.contentImage.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contentImage.count(),
    ]);

    return {
      images: images.map(img => ({
        ...img,
        url: `/uploads/${img.path}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<{ success: boolean }> {
    const image = await prisma.contentImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Delete file from filesystem
    const filePath = path.join(this.uploadsDir, image.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.contentImage.delete({ where: { id: imageId } });

    return { success: true };
  }

  /**
   * Get default homepage content
   */
  getDefaultHomepageContent(): Section[] {
    return [
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
          roadmapItems: ['Gantt chart views', 'File attachments', 'Mobile apps'],
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
    ];
  }
}

export const cmsService = new CmsService();
