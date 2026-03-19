import { Server as SocketIOServer, Socket } from 'socket.io';
import { callSessionService } from '../services/callSessionService';

/**
 * Initialize all socket handlers
 */
export function initSocketHandlers(io: SocketIOServer) {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket.io] New connection: ${socket.id}`);

        // Authentication middleware (simplified for now)
        socket.on('auth:identify', (data: { userId: string }) => {
            (socket as any).userId = data.userId;
            socket.join(`user:${data.userId}`);
            console.log(`[Socket.io] User ${data.userId} identified on socket ${socket.id}`);
        });

        // Messaging - Join conversation room
        socket.on('messaging:join-conversation', (data: { conversationId: string }) => {
            socket.join(`conversation:${data.conversationId}`);
        });

        socket.on('messaging:leave-conversation', (data: { conversationId: string }) => {
            socket.leave(`conversation:${data.conversationId}`);
        });

        // --- CALLING FEATURE ---

        // Initiate Call
        socket.on('calling:initiate', async (data: {
            recipientIds: string[];
            conversationId?: string;
            callType: 'video' | 'audio'
        }) => {
            const userId = (socket as any).userId;
            if (!userId) return;

            try {
                const session = await callSessionService.createCallSession({
                    initiatorId: userId,
                    participantIds: data.recipientIds,
                    conversationId: data.conversationId,
                    callType: data.callType
                });

                // Notify recipients via private room
                data.recipientIds.forEach(recipientId => {
                    io.to(`user:${recipientId}`).emit('calling:incoming-call', {
                        callSessionId: session.id,
                        initiatorId: userId,
                        initiatorName: session.initiator.displayName || session.initiator.name,
                        initiatorAvatar: session.initiator.avatarUrl,
                        callType: data.callType,
                        conversationId: data.conversationId,
                        isGroup: !!data.conversationId,
                        participantCount: session.participants.length
                    });
                });

                // Join initiator to call room
                socket.join(`call:${session.id}`);

                // Return session info to initiator
                socket.emit('calling:initiated', { callSession: session });
            } catch (error) {
                console.error('[Socket.io] Error initiating call:', error);
                socket.emit('calling:error', { message: 'Failed to initiate call' });
            }
        });

        // Accept Call
        socket.on('calling:accept', async (data: { callSessionId: string }) => {
            const userId = (socket as any).userId;
            if (!userId) return;

            try {
                // In a real app, we might update DB status here if needed
                // For now, join the room and notify others
                socket.join(`call:${data.callSessionId}`);

                const session = await callSessionService.getCallSession(data.callSessionId);

                // Notify others in the call that someone joined
                socket.to(`call:${data.callSessionId}`).emit('calling:participant-joined', {
                    userId,
                    user: session.participants.find((p: any) => p.userId === userId)?.user
                });

                // If this is the first one accepting, maybe transition status to 'connecting'
                if (session.status === 'ringing') {
                    await callSessionService.updateCallStatus(data.callSessionId, 'connecting');
                }
            } catch (error) {
                console.error('[Socket.io] Error accepting call:', error);
            }
        });

        // Reject Call
        socket.on('calling:reject', async (data: { callSessionId: string }) => {
            const userId = (socket as any).userId;
            if (!userId) return;

            try {
                await callSessionService.removeParticipant(data.callSessionId, userId);

                // Notify initiator/room
                socket.to(`call:${data.callSessionId}`).emit('calling:participant-rejected', { userId });

                // Check if anyone left
                const session = await callSessionService.getCallSession(data.callSessionId);
                if (session.participants.length === 0) {
                    await callSessionService.endCallSession(data.callSessionId);
                }
            } catch (error) {
                console.error('[Socket.io] Error rejecting call:', error);
            }
        });

        // Signaling Relay (SDP Offer/Answer/ICE)
        socket.on('calling:sdp-offer', (data: { callSessionId: string; toUserId: string; sdpOffer: string }) => {
            io.to(`user:${data.toUserId}`).emit('calling:sdp-offer', {
                fromUserId: (socket as any).userId,
                callSessionId: data.callSessionId,
                sdpOffer: data.sdpOffer
            });
        });

        socket.on('calling:sdp-answer', (data: { callSessionId: string; toUserId: string; sdpAnswer: string }) => {
            io.to(`user:${data.toUserId}`).emit('calling:sdp-answer', {
                fromUserId: (socket as any).userId,
                callSessionId: data.callSessionId,
                sdpAnswer: data.sdpAnswer
            });
        });

        socket.on('calling:ice-candidate', (data: { callSessionId: string; toUserId: string; candidate: any }) => {
            io.to(`user:${data.toUserId}`).emit('calling:ice-candidate', {
                fromUserId: (socket as any).userId,
                callSessionId: data.callSessionId,
                candidate: data.candidate
            });
        });

        // Media Toggle (Mic/Camera)
        socket.on('calling:media-change', async (data: {
            callSessionId: string;
            micEnabled?: boolean;
            cameraEnabled?: boolean
        }) => {
            const userId = (socket as any).userId;
            if (!userId) return;

            try {
                await callSessionService.updateParticipant(data.callSessionId, userId, {
                    micEnabled: data.micEnabled,
                    cameraEnabled: data.cameraEnabled
                });

                // Broadcast to others in call
                socket.to(`call:${data.callSessionId}`).emit('calling:participant-media-changed', {
                    userId,
                    micEnabled: data.micEnabled,
                    cameraEnabled: data.cameraEnabled
                });
            } catch (error) {
                console.error('[Socket.io] Error updating media state:', error);
            }
        });

        // End/Leave Call
        socket.on('calling:end', async (data: { callSessionId: string }) => {
            const userId = (socket as any).userId;
            if (!userId) return;

            try {
                await callSessionService.removeParticipant(data.callSessionId, userId);
                socket.leave(`call:${data.callSessionId}`);

                // Notify others
                socket.to(`call:${data.callSessionId}`).emit('calling:participant-left', { userId });

                // Check if call should end
                const session = await callSessionService.getCallSession(data.callSessionId);
                if (session.participants.length === 0) {
                    await callSessionService.endCallSession(data.callSessionId);
                    io.to(`call:${data.callSessionId}`).emit('calling:ended', { callSessionId: data.callSessionId });
                }
            } catch (error) {
                console.error('[Socket.io] Error ending/leaving call:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.io] Socket disconnected: ${socket.id}`);
        });
    });
}
