import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { requireAdmin, AdminRequest } from '../middleware/adminAuth';
import { cmsService } from '../services/cmsService';
import { z } from 'zod';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Validation schemas
const sectionSchema = z.object({
  id: z.string(),
  type: z.enum(['hero', 'features', 'security', 'footer', 'custom']),
  order: z.number(),
  visible: z.boolean(),
  content: z.record(z.any()),
});

const updateContentSchema = z.object({
  sections: z.array(sectionSchema),
});

const updateSectionSchema = z.object({
  type: z.enum(['hero', 'features', 'security', 'footer', 'custom']).optional(),
  order: z.number().optional(),
  visible: z.boolean().optional(),
  content: z.record(z.any()).optional(),
});

const reorderSchema = z.object({
  sectionIds: z.array(z.string()),
});

/**
 * GET /api/cms/content/:page
 * Get page content (public endpoint for rendering)
 */
router.get('/content/:page', async (req: Request, res: Response) => {
  try {
    let content = await cmsService.getPageContent(req.params.page);

    // If no content exists, return default content
    if (!content && req.params.page === 'home') {
      content = {
        page: 'home',
        sections: cmsService.getDefaultHomepageContent(),
        updatedAt: new Date(),
        updatedBy: null,
      };
    }

    if (!content) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Error getting content:', error);
    res.status(500).json({ error: 'Failed to get content' });
  }
});

// Protected routes for admin
router.use(authenticate);
router.use(requireAdmin);

/**
 * PUT /api/cms/content/:page
 * Update page content
 */
router.put('/content/:page', async (req: AdminRequest, res: Response) => {
  try {
    const { sections } = updateContentSchema.parse(req.body);
    const content = await cmsService.updatePageContent(
      req.params.page,
      sections,
      req.admin?.userId
    );
    res.json(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

/**
 * POST /api/cms/content/:page/sections
 * Add a new section
 */
router.post('/content/:page/sections', async (req: AdminRequest, res: Response) => {
  try {
    const section = sectionSchema.parse(req.body);
    const content = await cmsService.addSection(
      req.params.page,
      section,
      req.admin?.userId
    );
    res.status(201).json(content);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error adding section:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
});

/**
 * PUT /api/cms/content/:page/sections/:sectionId
 * Update a specific section
 */
router.put('/content/:page/sections/:sectionId', async (req: AdminRequest, res: Response) => {
  try {
    const updates = updateSectionSchema.parse(req.body);
    const content = await cmsService.updateSection(
      req.params.page,
      req.params.sectionId,
      updates,
      req.admin?.userId
    );
    res.json(content);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.message === 'Page not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error updating section:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
});

/**
 * DELETE /api/cms/content/:page/sections/:sectionId
 * Delete a section
 */
router.delete('/content/:page/sections/:sectionId', async (req: AdminRequest, res: Response) => {
  try {
    const content = await cmsService.deleteSection(
      req.params.page,
      req.params.sectionId,
      req.admin?.userId
    );
    res.json(content);
  } catch (error: any) {
    if (error.message === 'Page not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

/**
 * PUT /api/cms/content/:page/reorder
 * Reorder sections
 */
router.put('/content/:page/reorder', async (req: AdminRequest, res: Response) => {
  try {
    const { sectionIds } = reorderSchema.parse(req.body);
    const content = await cmsService.reorderSections(
      req.params.page,
      sectionIds,
      req.admin?.userId
    );
    res.json(content);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.message === 'Page not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error reordering sections:', error);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
});

/**
 * POST /api/cms/upload
 * Upload an image
 */
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const image = await cmsService.uploadImage(req.file);
    res.status(201).json(image);
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

/**
 * GET /api/cms/images
 * List uploaded images
 */
router.get('/images', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await cmsService.listImages({ page, limit });
    res.json(result);
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

/**
 * DELETE /api/cms/images/:id
 * Delete an image
 */
router.delete('/images/:id', async (req: Request, res: Response) => {
  try {
    await cmsService.deleteImage(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Image not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
