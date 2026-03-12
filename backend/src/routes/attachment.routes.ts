import { Router, Response, NextFunction } from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import path from "path";
import { authenticate, AuthRequest } from "../middleware/auth";
import { RBACRequest } from "../middleware/rbac";
import { prisma } from "../config/prisma";

const router = Router();
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET || "buildtrack-dev-storage");

// Use memory storage — files go to GCS, not disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

/**
 * Middleware to get user role with permissions
 */
const enrichUser = async (req: RBACRequest, res: Response, next: NextFunction) => {
    try {
        const user = (req as AuthRequest).user;
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
 * Upload a file buffer to GCS and return the GCS path
 */
async function uploadToGCS(file: Express.Multer.File): Promise<string> {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const gcsFile = bucket.file(uniqueName);

    await gcsFile.save(file.buffer, {
        metadata: { contentType: file.mimetype },
    });

    return uniqueName;
}

/**
 * POST /api/attachments/upload
 * Upload files and link to moduleRecord, project, or task
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

            if (!moduleRecordId && !projectId && !taskId) {
                return res.status(400).json({ error: "Must specify moduleRecordId, projectId, or taskId" });
            }

            if (moduleRecordId) {
                const record = await prisma.moduleRecord.findUnique({
                    where: { id: moduleRecordId }
                });
                if (!record) {
                    return res.status(404).json({ error: "Module record not found" });
                }
            }

            const attachments = await Promise.all(
                uploadedFiles.map(async (file) => {
                    const gcsPath = await uploadToGCS(file);
                    return prisma.attachment.create({
                        data: {
                            filename: file.originalname,
                            path: gcsPath,
                            mimeType: file.mimetype,
                            size: file.size,
                            moduleRecordId: moduleRecordId || null,
                            projectId: projectId || null,
                            taskId: taskId || null,
                            uploadedById: enrichedUser.userId,
                        },
                    });
                })
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

            const record = await prisma.moduleRecord.findUnique({
                where: { id: recordId }
            });
            if (!record) {
                return res.status(404).json({ error: "Module record not found" });
            }

            const attachments = await prisma.attachment.findMany({
                where: { moduleRecordId: recordId },
                include: {
                    uploadedBy: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            res.json({ attachments });
        } catch (err) {
            console.error("List attachments error:", err);
            res.status(500).json({ error: "Failed to list attachments" });
        }
    }
);

/**
 * GET /api/attachments/download/:id
 * Download attachment from GCS
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

            const gcsFile = bucket.file(attachment.path);
            const [exists] = await gcsFile.exists();
            if (!exists) {
                return res.status(404).json({ error: "File not found in storage" });
            }

            res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
            res.setHeader("Content-Type", attachment.mimeType);
            gcsFile.createReadStream().pipe(res);
        } catch (err) {
            console.error("Download error:", err);
            res.status(500).json({ error: "Failed to download file" });
        }
    }
);

/**
 * DELETE /api/attachments/:id
 * Delete an attachment from GCS and DB
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

            if (attachment.uploadedById !== enrichedUser.userId && !enrichedUser.isAdmin) {
                return res.status(403).json({ error: "Cannot delete attachment uploaded by another user" });
            }

            // Delete from DB first
            await prisma.attachment.delete({ where: { id } });

            // Then delete from GCS
            const gcsFile = bucket.file(attachment.path);
            const [exists] = await gcsFile.exists();
            if (exists) {
                await gcsFile.delete();
            }

            res.status(204).send();
        } catch (err) {
            console.error("Delete attachment error:", err);
            res.status(500).json({ error: "Failed to delete attachment" });
        }
    }
);

export default router;
