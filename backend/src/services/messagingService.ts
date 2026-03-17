import { PrismaClient } from '@prisma/client';
import { encryptionService } from './encryptionService';

const prisma = new PrismaClient();

export interface CreateConversationInput {
  name?: string;
  description?: string;
  isGroup: boolean;
  createdById: string;
  memberIds: string[]; // Includes creator
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  messageType?: string;
}

export interface MessageAttachmentInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  gcsFileId: string;
  gcsBucketName?: string;
  encryptionKey: string;
  encryptionIv: string;
}

/**
 * Messaging Service
 * Handles conversation and message operations
 */
export class MessagingService {
  /**
   * Create a new conversation (one-to-one or group)
   */
  async createConversation(input: CreateConversationInput) {
    const sharedKey = encryptionService.generateConversationKey();
    const sharedKeyHash = encryptionService.hashConversationKey(sharedKey);

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        name: input.name,
        description: input.description,
        isGroup: input.isGroup,
        createdById: input.createdById,
        sharedKeyHash,
      },
    });

    // Add members with encrypted keys
    const memberPromises = input.memberIds.map((userId) =>
      this.addConversationMember(conversation.id, userId, sharedKey)
    );
    await Promise.all(memberPromises);

    // Return conversation with shared key wrapped for creator
    const creatorDerivedKey = this.getUserDerivedKey(input.createdById);
    const encryptedKeyForCreator = encryptionService.encryptKeyForUser(
      sharedKey,
      creatorDerivedKey
    );

    return {
      ...conversation,
      encryptedKeyForCurrentUser: encryptedKeyForCreator,
    };
  }

  /**
   * Add a member to a conversation
   */
  private async addConversationMember(
    conversationId: string,
    userId: string,
    sharedKey: string
  ) {
    const userDerivedKey = this.getUserDerivedKey(userId);
    const encryptedKey = encryptionService.encryptKeyForUser(sharedKey, userDerivedKey);

    return prisma.conversationMember.create({
      data: {
        conversationId,
        userId,
        encryptedKey,
      },
    });
  }

  /**
   * Get user's derived key (from password hash)
   * In a real implementation, this would fetch from DB and use actual password hash
   * For now, we use a placeholder that would be replaced with actual password hash
   */
  private getUserDerivedKey(userId: string): string {
    // TODO: Fetch user's password hash from DB
    // For testing, generate a consistent key based on user ID
    const placeholderHash = `password_hash_${userId}`;
    return encryptionService.deriveUserKey(userId, placeholderHash);
  }

  /**
   * Get conversation details with decrypted key for current user
   */
  async getConversation(conversationId: string, currentUserId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify user is member
    const isMember = conversation.members.some((m) => m.userId === currentUserId);
    if (!isMember) {
      throw new Error('Access denied: user is not a member of this conversation');
    }

    // Get user's encrypted key and decrypt it
    const memberRecord = conversation.members.find((m) => m.userId === currentUserId);
    const userDerivedKey = this.getUserDerivedKey(currentUserId);

    let decryptedSharedKey: string | null = null;
    try {
      if (memberRecord?.encryptedKey) {
        decryptedSharedKey = encryptionService.decryptKeyForUser(
          memberRecord.encryptedKey,
          userDerivedKey
        );
      }
    } catch (error) {
      console.error('Failed to decrypt shared key for user', currentUserId, error);
    }

    return {
      ...conversation,
      decryptedSharedKeyForCurrentUser: decryptedSharedKey,
      // Don't return encrypted keys to client
      members: conversation.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        user: m.user,
        joinedAt: m.joinedAt,
        lastReadAt: m.lastReadAt,
      })),
    };
  }

  /**
   * Get all conversations for a user
   */
  async getConversationsForUser(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        members: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          where: { leftAt: null },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' }, // Sort by conversation update time instead
    });

    return conversations;
  }

  /**
   * Send a message
   */
  async sendMessage(input: SendMessageInput) {
    // Verify user is member of conversation
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: input.conversationId,
          userId: input.senderId,
        },
      },
    });

    if (!isMember) {
      throw new Error('Access denied: user is not a member of this conversation');
    }

    return prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        encryptedContent: input.encryptedContent,
        encryptionIv: input.encryptionIv,
        authTag: input.authTag,
        messageType: input.messageType || 'text',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get messages in a conversation (with pagination)
   */
  async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    // Verify user is member
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      throw new Error('Access denied: user is not a member of this conversation');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.message.count({
      where: {
        conversationId,
        deletedAt: null,
      },
    });

    return {
      messages: messages.reverse(), // Return in ascending order (oldest first)
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    newEncryptedContent: string,
    newIv: string,
    newAuthTag: string
  ) {
    return prisma.message.update({
      where: { id: messageId },
      data: {
        encryptedContent: newEncryptedContent,
        encryptionIv: newIv,
        authTag: newAuthTag,
        isEdited: true,
        editedAt: new Date(),
      },
    });
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string) {
    return prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string) {
    return prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  /**
   * Add members to a group conversation
   */
  async addGroupMembers(conversationId: string, userIds: string[]) {
    // Get the conversation to access shared key
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // We need to decrypt the shared key to re-encrypt for new members
    // For now, this is a limitation - in production, PM would need to provide the key
    // or we'd use a key server approach
    throw new Error(
      'Key re-wrapping for new members requires additional security setup. Contact admin.'
    );
  }

  /**
   * Create message attachment record
   */
  async createMessageAttachment(
    messageId: string,
    input: MessageAttachmentInput
  ) {
    return prisma.messageAttachment.create({
      data: {
        messageId,
        filename: input.filename,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        gcsFileId: input.gcsFileId,
        gcsBucketName: input.gcsBucketName,
        encryptionKey: input.encryptionKey,
        encryptionIv: input.encryptionIv,
      },
    });
  }

  /**
   * Get attachment
   */
  async getAttachment(attachmentId: string) {
    return prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            conversationId: true,
          },
        },
      },
    });
  }

  /**
   * Delete attachment (soft or hard)
   */
  async deleteAttachment(attachmentId: string) {
    return prisma.messageAttachment.delete({
      where: { id: attachmentId },
    });
  }

  /**
   * Leave a conversation (soft delete for group members)
   */
  async leaveConversation(conversationId: string, userId: string) {
    return prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  /**
   * Remove a member from a conversation
   */
  async removeConversationMember(conversationId: string, userId: string) {
    return prisma.conversationMember.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
  }

  /**
   * Update conversation (name, description)
   */
  async updateConversation(
    conversationId: string,
    updates: { name?: string; description?: string }
  ) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: updates,
    });
  }

  /**
   * Soft delete a conversation
   */
  async deleteConversation(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    });
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
