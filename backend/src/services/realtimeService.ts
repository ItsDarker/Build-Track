/**
 * Realtime Service
 * Bridges Socket.io events with service layer
 * Provides type-safe event emissions
 */

import { Server as SocketIOServer, Socket } from 'socket.io';

export class RealtimeService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.io server instance
   */
  initialize(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  /**
   * Emit to specific user
   */
  emitToUser(userId: string, event: string, data?: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit to conversation room
   */
  emitToConversation(conversationId: string, event: string, data?: any) {
    if (!this.io) return;
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Emit to call room
   */
  emitToCall(callSessionId: string, event: string, data?: any) {
    if (!this.io) return;
    this.io.to(`call:${callSessionId}`).emit(event, data);
  }

  /**
   * Emit new message to conversation
   */
  emitNewMessage(conversationId: string, message: any) {
    this.emitToConversation(conversationId, 'message:new', message);
  }

  /**
   * Emit message edited
   */
  emitMessageEdited(conversationId: string, messageId: string, data: any) {
    this.emitToConversation(conversationId, 'message:edited', { messageId, ...data });
  }

  /**
   * Emit message deleted
   */
  emitMessageDeleted(conversationId: string, messageId: string) {
    this.emitToConversation(conversationId, 'message:deleted', { messageId });
  }

  /**
   * Emit typing indicator
   */
  emitTyping(conversationId: string, userId: string, typing: boolean) {
    this.emitToConversation(conversationId, 'user:typing', { userId, typing });
  }

  /**
   * Emit read receipt
   */
  emitReadReceipt(conversationId: string, userId: string, lastReadAt: Date) {
    this.emitToConversation(conversationId, 'message:read', { userId, lastReadAt });
  }

  /**
   * Emit presence update
   */
  emitPresenceUpdate(userId: string, status: string) {
    // Broadcast to all connected clients
    if (!this.io) return;
    this.io.emit('user:presence', { userId, status });
  }

  /**
   * Emit incoming call
   */
  emitIncomingCall(recipientUserId: string, callData: any) {
    this.emitToUser(recipientUserId, 'call:incoming', callData);
  }

  /**
   * Emit call accepted
   */
  emitCallAccepted(callSessionId: string, userId: string, sdpAnswer?: string) {
    this.emitToCall(callSessionId, 'call:accepted', { userId, sdpAnswer });
  }

  /**
   * Emit call rejected
   */
  emitCallRejected(callSessionId: string, userId: string) {
    this.emitToCall(callSessionId, 'call:rejected', { userId });
  }

  /**
   * Emit call ended
   */
  emitCallEnded(callSessionId: string) {
    this.emitToCall(callSessionId, 'call:ended', {});
  }

  /**
   * Emit ICE candidate
   */
  emitIceCandidate(callSessionId: string, fromUserId: string, candidate: any) {
    this.emitToCall(callSessionId, 'call:ice-candidate', { fromUserId, candidate });
  }

  /**
   * Emit participant joined call
   */
  emitParticipantJoined(callSessionId: string, userId: string, userData: any) {
    this.emitToCall(callSessionId, 'call:participant-joined', { userId, ...userData });
  }

  /**
   * Emit participant left call
   */
  emitParticipantLeft(callSessionId: string, userId: string) {
    this.emitToCall(callSessionId, 'call:participant-left', { userId });
  }

  /**
   * Emit participant media change
   */
  emitParticipantMediaChange(callSessionId: string, userId: string, micEnabled: boolean, cameraEnabled: boolean) {
    this.emitToCall(callSessionId, 'call:participant-media', { userId, micEnabled, cameraEnabled });
  }

  /**
   * Emit conversation updated
   */
  emitConversationUpdated(conversationId: string, conversationData: any) {
    this.emitToConversation(conversationId, 'conversation:updated', conversationData);
  }

  /**
   * Get user socket ID for direct socket communication
   */
  getUserSocketId(userId: string): string | null {
    if (!this.io) return null;

    // Find socket connected for this user
    for (const [socketId, socket] of this.io.of('/').sockets) {
      if ((socket as any).userId === userId) {
        return socketId;
      }
    }

    return null;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUsers(): string[] {
    if (!this.io) return [];

    const connectedUsers = new Set<string>();
    for (const [_, socket] of this.io.of('/').sockets) {
      const userId = (socket as any).userId;
      if (userId) {
        connectedUsers.add(userId);
      }
    }

    return Array.from(connectedUsers);
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

