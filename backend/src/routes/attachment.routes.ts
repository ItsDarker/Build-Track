import { Router, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth";
import { RBACRequest } from "../middleware/rbac";
import { prisma } from "../config/prisma";
import { config } from "../config/env";
import {
  uploadFileToDrive,
  getFileStream,
  getFileContent,
  deleteFileFromDrive,
  getFileMetadata,
  initializeGoogleDrive,
} from "../services/googleDrive";

const router = Router();

// Configure multer for memory storage (files will be uploaded to Google Drive)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

// Initialize Google Drive on startup
initializeGoogleDrive().catch(err => {
    console.error('Failed to initialize Google Drive:', err);
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
 * Files are uploaded to Google Drive and stored in database with Drive file IDs
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

            // Check if Google Drive is enabled
            if (!config.googleDrive.enabled) {
                return res.status(503).json({ error: "File upload service is not available" });
            }

            const attachments = await Promise.all(
                uploadedFiles.map(async (file) => {
                    try {
                        // Upload to Google Drive
                        const { fileId } = await uploadFileToDrive(
                            file.buffer, // Buffer will be converted to stream by googleDrive service
                            file.originalname,
                            file.mimetype
                        );

                        // Store in database with Drive file ID instead of local path
                        return await prisma.attachment.create({
                            data: {
                                filename: file.originalname,
                                path: fileId, // Store Google Drive file ID
                                mimeType: file.mimetype,
                                size: file.size,
                                moduleRecordId: moduleRecordId || null,
                                projectId: projectId || null,
                                taskId: taskId || null,
                                uploadedById: enrichedUser.userId,
                            },
                        });
                    } catch (err) {
                        console.error(`Failed to upload file ${file.originalname}:`, err);
                        throw err;
                    }
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
 * Retrieves file from Google Drive
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

            if (!config.googleDrive.enabled) {
                return res.status(503).json({ error: "File service is not available" });
            }

            // Get file stream from Google Drive (path contains Drive file ID)
            const fileStream = await getFileStream(attachment.path);

            // For viewing, set inline content disposition (for images/pdfs)
            res.setHeader("Content-Disposition", `inline; filename="${attachment.filename}"`);
            res.setHeader("Content-Type", attachment.mimeType);
            res.setHeader("Cache-Control", "public, max-age=3600");

            fileStream.pipe(res);
        } catch (err) {
            console.error("View error:", err);
            res.status(500).json({ error: "Failed to view file" });
        }
    }
);

/**
 * GET /api/attachments/download/:id
 * Download attachment (forced download)
 * Retrieves file from Google Drive
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

            if (!config.googleDrive.enabled) {
                return res.status(503).json({ error: "File service is not available" });
            }

            // Get file stream from Google Drive (path contains Drive file ID)
            const fileStream = await getFileStream(attachment.path);

            res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
            res.setHeader("Content-Type", attachment.mimeType);
            fileStream.pipe(res);
        } catch (err) {
            console.error("Download error:", err);
            res.status(500).json({ error: "Failed to download file" });
        }
    }
);

/**
 * DELETE /api/attachments/:id
 * Delete an attachment (only uploader or admin can delete)
 * Deletes file from Google Drive and database
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

            // Delete from Google Drive if enabled
            if (config.googleDrive.enabled) {
                try {
                    await deleteFileFromDrive(attachment.path);
                } catch (err) {
                    console.warn(`Failed to delete file from Google Drive: ${attachment.path}`, err);
                    // Continue with DB deletion even if Drive deletion fails
                }
            }

            // Delete from DB
            await prisma.attachment.delete({ where: { id } });

            res.status(204).send();
        } catch (err) {
            console.error("Delete attachment error:", err);
            res.status(500).json({ error: "Failed to delete attachment" });
        }
    }
);

export default router;
