"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("../middleware/auth");
const adminAuth_1 = require("../middleware/adminAuth");
const cmsService_1 = require("../services/cmsService");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Configure multer for image uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
// Validation schemas
const sectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['hero', 'features', 'security', 'footer', 'custom']),
    order: zod_1.z.number(),
    visible: zod_1.z.boolean(),
    content: zod_1.z.record(zod_1.z.any()),
});
const updateContentSchema = zod_1.z.object({
    sections: zod_1.z.array(sectionSchema),
});
const updateSectionSchema = zod_1.z.object({
    type: zod_1.z.enum(['hero', 'features', 'security', 'footer', 'custom']).optional(),
    order: zod_1.z.number().optional(),
    visible: zod_1.z.boolean().optional(),
    content: zod_1.z.record(zod_1.z.any()).optional(),
});
const reorderSchema = zod_1.z.object({
    sectionIds: zod_1.z.array(zod_1.z.string()),
});
/**
 * GET /api/cms/content/:page
 * Get page content (public endpoint for rendering)
 */
router.get('/content/:page', async (req, res) => {
    try {
        let content = await cmsService_1.cmsService.getPageContent(req.params.page);
        // If no content exists, return default content
        if (!content && req.params.page === 'home') {
            content = {
                page: 'home',
                sections: cmsService_1.cmsService.getDefaultHomepageContent(),
                updatedAt: new Date(),
                updatedBy: null,
            };
        }
        if (!content) {
            return res.status(404).json({ error: 'Page not found' });
        }
        res.json(content);
    }
    catch (error) {
        console.error('Error getting content:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});
// Protected routes for admin
router.use(auth_1.authenticate);
router.use(adminAuth_1.requireAdmin);
/**
 * PUT /api/cms/content/:page
 * Update page content
 */
router.put('/content/:page', async (req, res) => {
    try {
        const { sections } = updateContentSchema.parse(req.body);
        const content = await cmsService_1.cmsService.updatePageContent(req.params.page, sections, req.admin?.userId);
        res.json(content);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post('/content/:page/sections', async (req, res) => {
    try {
        const section = sectionSchema.parse(req.body);
        const content = await cmsService_1.cmsService.addSection(req.params.page, section, req.admin?.userId);
        res.status(201).json(content);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.put('/content/:page/sections/:sectionId', async (req, res) => {
    try {
        const updates = updateSectionSchema.parse(req.body);
        const content = await cmsService_1.cmsService.updateSection(req.params.page, req.params.sectionId, updates, req.admin?.userId);
        res.json(content);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.delete('/content/:page/sections/:sectionId', async (req, res) => {
    try {
        const content = await cmsService_1.cmsService.deleteSection(req.params.page, req.params.sectionId, req.admin?.userId);
        res.json(content);
    }
    catch (error) {
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
router.put('/content/:page/reorder', async (req, res) => {
    try {
        const { sectionIds } = reorderSchema.parse(req.body);
        const content = await cmsService_1.cmsService.reorderSections(req.params.page, sectionIds, req.admin?.userId);
        res.json(content);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const image = await cmsService_1.cmsService.uploadImage(req.file);
        res.status(201).json(image);
    }
    catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
});
/**
 * GET /api/cms/images
 * List uploaded images
 */
router.get('/images', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const result = await cmsService_1.cmsService.listImages({ page, limit });
        res.json(result);
    }
    catch (error) {
        console.error('Error listing images:', error);
        res.status(500).json({ error: 'Failed to list images' });
    }
});
/**
 * DELETE /api/cms/images/:id
 * Delete an image
 */
router.delete('/images/:id', async (req, res) => {
    try {
        await cmsService_1.cmsService.deleteImage(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        if (error.message === 'Image not found') {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});
exports.default = router;
