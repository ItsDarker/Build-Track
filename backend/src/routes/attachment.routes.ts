import { Router, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate, AuthRequest } from "../middleware/auth";
import { RBACRequest } from "../middleware/rbac";
import { prisma } from "../config/prisma";

const router = Router();

// Configure multer storage with file size limits
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

/**
 * Middleware to get user role with permissions
 */
const enrichUser = async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user || !user.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                email: true,
                isBlocked: true,
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            },
        });

        if (!dbUser || dbUser.isBlocked) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!dbUser.role) {
            return res.status(403).json({ error: 'User has no role assigned' });
        }

        // Attach user info with role
        const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'ADMIN'];
        const isAdmin = ADMIN_ROLES.includes(dbUser.role.name);

        (req as any).enrichedUser = {
            userId: user.userId,
            email: dbUser.email,
            roleName: dbUser.role.name,
            isAdmin,
            permissions: dbUser.role.permissions.map(p => `${p.permission.action}:${p.permission.resource}`)
        };

        next();
    } catch (err) {
        console.error('User enrichment error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/attachments/upload
 * Upload files and link to moduleRecord, project, or task
 * Accessible to authenticated users with read/write access to the module
 */
router.post(
    "/upload",
    authenticate,
    upload.array("files"),
    enrichUser,
    async (req: AuthRequest, res: Response) => {
        try {
            const { moduleRecordId, projectId, taskId } = req.body;
            const uploadedFiles = req.files as Express.Multer.File[];
            const enrichedUser = (req as any).enrichedUser;

            if (!uploadedFiles || uploadedFiles.length === 0) {
                return res.status(400).json({ error: "No files provided" });
            }

            // Verify at least one valid target
            if (!moduleRecordId && !projectId && !taskId) {
                return res.status(400).json({ error: "Must specify moduleRecordId, projectId, or taskId" });
            }

            // For module records, verify the record exists
            if (moduleRecordId) {
                const record = await prisma.moduleRecord.findUnique({
                    where: { id: moduleRecordId }
                });
                if (!record) {
                    return res.status(404).json({ error: "Module record not found" });
                }
            }

            const attachments = await Promise.all(
                uploadedFiles.map((file) =>
                    prisma.attachment.create({
                        data: {
                            filename: file.originalname,
                            path: file.filename,
                            mimeType: file.mimetype,
                            size: file.size,
                            moduleRecordId: moduleRecordId || null,
                            projectId: projectId || null,
                            taskId: taskId || null,
                            uploadedById: enrichedUser.userId,
                        },
                    })
                )
            );

            res.status(201).json({
                attachments: attachments.map(a => ({
                    id: a.id,
                    filename: a.filename,
                    mimeType: a.mimeType,
                    size: a.size,
                    createdAt: a.createdAt
                }))
            });
        } catch (err) {
            console.error("Upload error:", err);
            // Clean up uploaded files on error
            if (req.files) {
                (req.files as Express.Multer.File[]).forEach(file => {
                    const filePath = path.join(process.cwd(), "uploads", file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
            res.status(500).json({ error: "Failed to upload files" });
        }
    }
);

/**
 * GET /api/attachments/record/:recordId
 * List attachments for a module record
 */
router.get(
    "/record/:recordId",
    authenticate,
    enrichUser,
    async (req: AuthRequest, res: Response) => {
        try {
            const { recordId } = req.params;

            // Verify record exists
            const record = await prisma.moduleRecord.findUnique({
                where: { id: recordId }
            });
            if (!record) {
                return res.status(404).json({ error: "Record not found" });
            }

            const attachments = await prisma.attachment.findMany({
                where: { moduleRecordId: recordId },
                select: {
                    id: true,
                    filename: true,
                    mimeType: true,
                    size: true,
                    createdAt: true,
                    uploadedBy: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: { createdAt: "desc" },
            });

            res.json({ attachments });
        } catch (err) {
            console.error("List attachments error:", err);
            res.status(500).json({ error: "Failed to list attachments" });
        }
    }
);

/**
 * GET /api/attachments/view/:id
 * View attachment (stream for previewing, not downloading)
 */
router.get(
    "/view/:id",
    authenticate,
    enrichUser,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const attachment = await prisma.attachment.findUnique({
                where: { id },
            });

            if (!attachment) {
                return res.status(404).json({ error: "Attachment not found" });
            }

            const filePath = path.join(process.cwd(), "uploads", attachment.path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: "File not found on disk" });
            }

            // For viewing, set inline content disposition (for images/pdfs)
            res.setHeader("Content-Disposition", `inline; filename="${attachment.filename}"`);
            res.setHeader("Content-Type", attachment.mimeType);
            res.setHeader("Cache-Control", "public, max-age=3600");

            fs.createReadStream(filePath).pipe(res);
        } catch (err) {
            console.error("View error:", err);
            res.status(500).json({ error: "Failed to view file" });
        }
    }
);

/**
 * GET /api/attachments/download/:id
 * Download attachment (forced download)
 */
router.get(
    "/download/:id",
    authenticate,
    enrichUser,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const attachment = await prisma.attachment.findUnique({
                where: { id },
            });

            if (!attachment) {
                return res.status(404).json({ error: "Attachment not found" });
            }

            const filePath = path.join(process.cwd(), "uploads", attachment.path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: "File not found on disk" });
            }

            res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
            res.setHeader("Content-Type", attachment.mimeType);
            fs.createReadStream(filePath).pipe(res);
        } catch (err) {
            console.error("Download error:", err);
            res.status(500).json({ error: "Failed to download file" });
        }
    }
);

/**
 * DELETE /api/attachments/:id
 * Delete an attachment (only uploader or admin can delete)
 */
router.delete(
    "/:id",
    authenticate,
    enrichUser,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const enrichedUser = (req as any).enrichedUser;

            const attachment = await prisma.attachment.findUnique({
                where: { id },
            });

            if (!attachment) {
                return res.status(404).json({ error: "Attachment not found" });
            }

            // Only the uploader or admin can delete
            if (attachment.uploadedById !== enrichedUser.userId && !enrichedUser.isAdmin) {
                return res.status(403).json({ error: "Cannot delete attachment uploaded by another user" });
            }

            // Delete from DB
            await prisma.attachment.delete({ where: { id } });

            // Delete from disk
            const filePath = path.join(process.cwd(), "uploads", attachment.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            res.status(204).send();
        } catch (err) {
            console.error("Delete attachment error:", err);
            res.status(500).json({ error: "Failed to delete attachment" });
        }
    }
);

export default router;
