import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';
import { RBACRequest } from '../middleware/rbac';
import { prisma } from '../config/prisma';
import { messagingService } from '../services/messagingService';
import { encryptionService } from '../services/encryptionService';

const router = Router();

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET || 'buildtrack-dev-storage');

// Use memory storage — files go to GCS, not disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

/**
 * Middleware to enrich user with role and permissions
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
              include: { permission: true },
            },
          },
        },
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
      permissions: dbUser.role.permissions.map((p) => `${p.permission.action}:${p.permission.resource}`),
    };

    next();
  } catch (err) {
    console.error('User enrichment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply auth and user enrichment to all routes
router.use(authenticate);
router.use(enrichUser);

/**
 * Upload encrypted file buffer to GCS
 */
async function uploadEncryptedToGCS(
  encryptedBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const uniqueName = `msg-attachments/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(filename)}`;
  const gcsFile = bucket.file(uniqueName);

  await gcsFile.save(encryptedBuffer, {
    metadata: { contentType: 'application/octet-stream' }, // Always octet-stream for encrypted files
  });

  return gcsFile.id || uniqueName;
}

/**
 * Download encrypted file from GCS
 */
async function downloadEncryptedFromGCS(fileId: string): Promise<Buffer> {
  try {
    const gcsFile = bucket.file(fileId);
    const [data] = await gcsFile.download();
    return data;
  } catch (error) {
    console.error('Error downloading from GCS:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * DELETE encrypted file from GCS
 */
async function deleteEncryptedFromGCS(fileId: string): Promise<void> {
  try {
    const gcsFile = bucket.file(fileId);
    await gcsFile.delete();
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    // Don't throw — continue even if GCS delete fails
  }
}

/**
 * POST /message-attachments/upload
 * Upload and encrypt file for message attachment
 * Body: messageId, conversationId, encryptionKey (the shared conversation key)
 */
router.post('/upload', upload.single('file'), async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { messageId, conversationId, encryptionKey } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!messageId || !conversationId || !encryptionKey) {
      return res.status(400).json({ error: 'Missing required fields: messageId, conversationId, encryptionKey' });
    }

    // Verify user is member of conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: not a member of this conversation' });
    }

    // Verify message exists and belongs to user
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Only sender can add attachments to message' });
    }

    // Encrypt file
    const { encryptedBuffer, iv } = encryptionService.encryptFile(
      file.buffer,
      encryptionKey
    );

    // Upload encrypted file to GCS
    const gcsFileId = await uploadEncryptedToGCS(
      encryptedBuffer,
      file.originalname,
      file.mimetype
    );

    // Create attachment record
    const attachment = await messagingService.createMessageAttachment(messageId, {
      filename: file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      gcsFileId,
      gcsBucketName: bucket.name,
      encryptionKey: encryptionKey, // Store the key (will be encrypted separately per user if needed)
      encryptionIv: iv,
    });

    res.status(201).json({ attachment });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

/**
 * GET /message-attachments/:id/download
 * Download and decrypt file attachment
 * Query: encryptionKey (the shared conversation key to decrypt)
 */
router.get('/:id/download', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { encryptionKey } = req.query;

    if (!encryptionKey) {
      return res.status(400).json({ error: 'Missing encryptionKey query parameter' });
    }

    // Get attachment
    const attachment = await messagingService.getAttachment(id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Verify user is member of conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: attachment.message.conversationId,
          userId,
        },
      },
    });

    if (!isMember && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Download encrypted file from GCS
    const encryptedBuffer = await downloadEncryptedFromGCS(attachment.gcsFileId);

    // Decrypt file
    const decryptedBuffer = encryptionService.decryptFile(
      encryptedBuffer,
      encryptionKey as string,
      attachment.encryptionIv
    );

    // Send file with original name
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Length', decryptedBuffer.length);

    res.send(decryptedBuffer);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

/**
 * GET /message-attachments/:id/preview
 * Get attachment metadata for preview/rendering
 */
router.get('/:id/preview', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Get attachment
    const attachment = await messagingService.getAttachment(id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Verify user is member of conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: attachment.message.conversationId,
          userId,
        },
      },
    });

    if (!isMember && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return metadata without file content
    const preview = {
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      uploadedAt: attachment.uploadedAt,
    };

    res.json({ attachment: preview });
  } catch (error) {
    console.error('Error fetching attachment preview:', error);
    res.status(500).json({ error: 'Failed to fetch attachment preview' });
  }
});

/**
 * DELETE /message-attachments/:id
 * Delete attachment (sender or admin)
 */
router.delete('/:id', async (req: RBACRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Get attachment with message info
    const attachment = await messagingService.getAttachment(id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Get message
    const message = await prisma.message.findUnique({
      where: { id: attachment.messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check authorization (sender or admin)
    if (message.senderId !== userId && !(req as any).enrichedUser.isAdmin) {
      return res.status(403).json({ error: 'Only sender can delete attachment' });
    }

    // Delete from GCS
    await deleteEncryptedFromGCS(attachment.gcsFileId);

    // Delete from database
    await messagingService.deleteAttachment(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
