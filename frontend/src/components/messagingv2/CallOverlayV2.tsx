'use client';

import React, { useEffect, useRef } from 'react';
import { Modal, Button, Avatar, Space, Typography } from 'antd';
import {
    PhoneOutlined,
    CloseOutlined,
    AudioOutlined,
    AudioMutedOutlined,
    VideoCameraOutlined,
    VideoCameraAddOutlined, // For camera off
    FullscreenOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons';
import { IncomingCall, CallSession } from '@/types/messagingv2';

const { Text, Title } = Typography;

interface Props {
    incomingCall: IncomingCall | null;
    callSession: CallSession | null;
    localStream: MediaStream | null;
    remoteStreams: { [userId: string]: MediaStream };
    micEnabled: boolean;
    cameraEnabled: boolean;
    onAccept: (callSessionId: string) => void;
    onReject: (callSessionId: string) => void;
    onEnd: () => void;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    error: string | null;
    onClearError: () => void;
}

/**
 * CallOverlayV2
 * Handles incoming call alerts and active call UI
 */
export default function CallOverlayV2({
    incomingCall,
    callSession,
    localStream,
    remoteStreams,
    micEnabled,
    cameraEnabled,
    onAccept,
    onReject,
    onEnd,
    onToggleMic,
    onToggleCamera,
    error,
    onClearError,
}: Props) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<{ [userId: string]: HTMLVideoElement }>({});

    // Update local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Update remote video streams
    useEffect(() => {
        Object.entries(remoteStreams).forEach(([userId, stream]) => {
            const videoElement = remoteVideoRefs.current[userId];
            if (videoElement && videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
            }
        });
    }, [remoteStreams]);

    if (!incomingCall && !callSession && !error) return null;

    // Display Error if present
    if (error && !callSession && !incomingCall) {
        return (
            <Modal
                title={null}
                open={true}
                footer={null}
                closable={false}
                centered
                width={400}
            >
                <div className="flex flex-col items-center py-6 text-center">
                    <Title level={4} type="danger">Call Error</Title>
                    <Text className="mb-6 block">{error}</Text>
                    <Button type="primary" onClick={onClearError}>Dismiss</Button>
                </div>
            </Modal>
        );
    }

    // 1. Incoming Call UI
    if (incomingCall && !callSession) {
        return (
            <Modal
                title={null}
                open={true}
                footer={null}
                closable={false}
                centered
                width={350}
                className="call-modal"
            >
                <div className="flex flex-col items-center py-6">
                    <Avatar size={80} src={incomingCall.initiatorAvatar} className="mb-4">
                        {incomingCall.initiatorName?.[0]}
                    </Avatar>
                    <Title level={4} className="mb-1">{incomingCall.initiatorName}</Title>
                    <Text type="secondary" className="mb-6">Incoming {incomingCall.callType} call...</Text>

                    <Space size="large">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PhoneOutlined />}
                            size="large"
                            style={{ backgroundColor: '#52c41a', border: 'none', width: 60, height: 60 }}
                            onClick={() => onAccept(incomingCall.callSessionId)}
                        />
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<CloseOutlined />}
                            size="large"
                            style={{ width: 60, height: 60 }}
                            onClick={() => onReject(incomingCall.callSessionId)}
                        />
                    </Space>
                </div>
            </Modal>
        );
    }

    // 2. Active Call UI
    return (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-4">
            {/* Remote Video (Main) */}
            <div className="relative flex-1 w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
                {Object.entries(remoteStreams).length > 0 ? (
                    Object.entries(remoteStreams).map(([userId, stream]) => (
                        <video
                            key={userId}
                            ref={(el) => { if (el) remoteVideoRefs.current[userId] = el; }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center">
                        <Avatar size={120} src={callSession?.participants.find(p => remoteStreams[p.userId])?.user?.avatarUrl} className="mb-4" />
                        <Title level={3} className="text-white m-0">Connecting...</Title>
                    </div>
                )}

                {/* Local Video (Small Overlay) */}
                {cameraEnabled && (
                    <div className="absolute top-4 right-4 w-40 h-56 bg-black rounded-lg border-2 border-gray-700 overflow-hidden shadow-2xl">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ transform: 'scaleX(-1)' }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center gap-6 bg-gray-800/80 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-gray-700">
                <Button
                    type="text"
                    shape="circle"
                    size="large"
                    icon={micEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
                    className={micEnabled ? "text-white" : "text-red-500 bg-red-500/10"}
                    onClick={onToggleMic}
                />
                <Button
                    type="text"
                    shape="circle"
                    size="large"
                    icon={cameraEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
                    className={cameraEnabled ? "text-white" : "text-red-500 bg-red-500/10"}
                    onClick={onToggleCamera}
                />
                <div className="w-px h-8 bg-gray-700 mx-2" />
                <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="large"
                    icon={<CloseOutlined />}
                    style={{ width: 50, height: 50 }}
                    onClick={onEnd}
                />
            </div>
        </div>
    );
}
