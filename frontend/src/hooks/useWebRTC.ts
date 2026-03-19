'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CallSession, IncomingCall, UseWebRTCReturn } from '@/types/messagingv2';
import { useSocketIO } from './useSocketIO';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * WebRTC Hook
 * Manages audio/video calls using WebRTC
 * Handles peer connections, media streams, and call signaling
 */
export function useWebRTC(): UseWebRTCReturn {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [userId: string]: MediaStream }>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const peerConnectionsRef = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const { emit, on, off, isConnected } = useSocketIO();

  /**
   * Get user media (audio/video)
   */
  const getUserMedia = useCallback(
    async (constraints?: MediaStreamConstraints) => {
      try {
        const defaultConstraints: MediaStreamConstraints = {
          audio: true,
          video: true,
          ...constraints,
        };

        const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
        setLocalStream(stream);
        setError(null);
        return stream;
      } catch (err: any) {
        console.error('[WebRTC] Error getting user media:', err);

        let msg = 'Failed to access camera or microphone.';
        if (err.name === 'NotAllowedError') {
          msg = 'Permission denied. Please allow access to your camera and microphone in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera or microphone found on this device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Your camera or microphone is already in use by another application.';
        }

        setError(msg);

        // Fallback: If video failed but wasn't explicitly rejected, try audio only
        if (constraints?.video && err.name !== 'NotAllowedError') {
          try {
            console.log('[WebRTC] Retrying with audio only...');
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(audioOnlyStream);
            setCameraEnabled(false);
            setError('Camera failed, joined with audio only.');
            return audioOnlyStream;
          } catch (audioErr) {
            console.error('[WebRTC] Audio-only fallback also failed:', audioErr);
          }
        }

        throw new Error(msg);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  /**
   * Create a peer connection for a user
   */
  const createPeerConnection = useCallback((userId: string, stream: MediaStream) => {
    if (peerConnectionsRef.current[userId]) return peerConnectionsRef.current[userId];

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [userId]: event.streams[0],
      }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callSession) {
        emit('calling:ice-candidate', {
          callSessionId: callSession.id,
          toUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionsRef.current[userId] = pc;
    return pc;
  }, [callSession, emit]);

  /**
   * Initiate a call
   */
  const initiateCall = useCallback(
    async (recipientIds: string[], conversationId?: string, callType: 'video' | 'audio' = 'video') => {
      try {
        setError(null);
        setIsConnecting(true);

        const stream = await getUserMedia({
          audio: true,
          video: callType === 'video',
        });

        if (isConnected) {
          emit('calling:initiate', {
            recipientIds,
            conversationId,
            callType,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initiate call');
        setIsConnecting(false);
      }
    },
    [getUserMedia, isConnected, emit]
  );

  /**
   * Accept incoming call
   */
  const acceptCall = useCallback(
    async (callSessionId: string) => {
      try {
        setError(null);
        setIsConnecting(true);

        const stream = await getUserMedia({
          audio: true,
          video: true,
        });

        if (isConnected) {
          emit('calling:accept', { callSessionId });
        }
        setIncomingCall(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to accept call');
        setIsConnecting(false);
      }
    },
    [getUserMedia, isConnected, emit]
  );

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(
    async (callSessionId: string) => {
      if (isConnected) {
        emit('calling:reject', { callSessionId });
      }
      setIncomingCall(null);
    },
    [isConnected, emit]
  );

  /**
   * End current call
   */
  const endCall = useCallback(async () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      if (callSession && isConnected) {
        emit('calling:end', { callSessionId: callSession.id });
      }

      setCallSession(null);
      setRemoteStreams({});
      setIsConnecting(false);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, [callSession, localStream, isConnected, emit]);

  const toggleMic = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !micEnabled);
      setMicEnabled(!micEnabled);
      if (callSession) {
        emit('calling:media-change', { callSessionId: callSession.id, micEnabled: !micEnabled });
      }
    }
  }, [localStream, micEnabled, callSession, emit]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !cameraEnabled);
      setCameraEnabled(!cameraEnabled);
      if (callSession) {
        emit('calling:media-change', { callSessionId: callSession.id, cameraEnabled: !cameraEnabled });
      }
    }
  }, [localStream, cameraEnabled, callSession, emit]);

  // Handle Socket Events
  useEffect(() => {
    if (!isConnected) return;

    // Incoming Call Notification
    const handleIncomingCall = (data: IncomingCall) => {
      setIncomingCall(data);
    };

    // Call Initiated (for the initiator)
    const handleCallInitiated = (data: { callSession: CallSession }) => {
      setCallSession(data.callSession);
      setIsConnecting(false);
    };

    // Someone joined (create offer if we are the initiator or already in)
    const handleParticipantJoined = async (data: { userId: string, user: any }) => {
      if (!localStream) return;

      const pc = createPeerConnection(data.userId, localStream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emit('calling:sdp-offer', {
        callSessionId: callSession?.id,
        toUserId: data.userId,
        sdpOffer: offer.sdp
      });
    };

    // Received Offer
    const handleSdpOffer = async (data: { fromUserId: string, sdpOffer: string, callSessionId: string }) => {
      if (!localStream) return;

      const pc = createPeerConnection(data.fromUserId, localStream);
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdpOffer }));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emit('calling:sdp-answer', {
        callSessionId: data.callSessionId,
        toUserId: data.fromUserId,
        sdpAnswer: answer.sdp
      });
    };

    // Received Answer
    const handleSdpAnswer = async (data: { fromUserId: string, sdpAnswer: string }) => {
      const pc = peerConnectionsRef.current[data.fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdpAnswer }));
      }
    };

    // Received ICE Candidate
    const handleIceCandidate = async (data: { fromUserId: string, candidate: any }) => {
      const pc = peerConnectionsRef.current[data.fromUserId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    const handleCallEnded = () => {
      endCall();
    };

    on('calling:incoming-call', handleIncomingCall);
    on('calling:initiated', handleCallInitiated);
    on('calling:participant-joined', handleParticipantJoined);
    on('calling:sdp-offer', handleSdpOffer);
    on('calling:sdp-answer', handleSdpAnswer);
    on('calling:ice-candidate', handleIceCandidate);
    on('calling:ended', handleCallEnded);

    return () => {
      off('calling:incoming-call', handleIncomingCall);
      off('calling:initiated', handleCallInitiated);
      off('calling:participant-joined', handleParticipantJoined);
      off('calling:sdp-offer', handleSdpOffer);
      off('calling:sdp-answer', handleSdpAnswer);
      off('calling:ice-candidate', handleIceCandidate);
      off('calling:ended', handleCallEnded);
    };
  }, [isConnected, on, off, localStream, callSession, createPeerConnection, emit, endCall]);

  return {
    callSession,
    localStream,
    remoteStreams,
    isConnecting,
    error,
    micEnabled,
    cameraEnabled,
    incomingCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    clearError,
    selectAudioDevice: () => { },
    selectVideoDevice: () => { },
    selectSpeaker: () => { },
  };
}
