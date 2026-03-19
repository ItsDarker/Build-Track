"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/ui-kit/DashboardLayout";
import { UserProvider } from "@/lib/context/UserContext";
import { apiClient } from "@/lib/api/client";

import { initializeSocket, disconnectSocket } from "@/lib/socket/client";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallOverlayV2 from "@/components/messagingv2/CallOverlayV2";

interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string | null;
    role: {
        name: string;
        displayName: string;
    };
    emailVerified?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Call state from our hook
    const webrtc = useWebRTC();

    useEffect(() => {
        async function checkAuth() {
            const result = await apiClient.getCurrentUser();

            if (result.error || !result.data) {
                router.push("/login");
                return;
            }

            const userData = (result.data as { user: User }).user;

            if (!userData.emailVerified) {
                router.push("/login?unverified=1");
                return;
            }

            // Initialize Socket.io
            const socket = initializeSocket('session', userData.id);
            socket.on('connect', () => {
                socket.emit('auth:identify', { userId: userData.id });
            });
            if (socket.connected) {
                socket.emit('auth:identify', { userId: userData.id });
            }

            setUser(userData);
            setLoading(false);
        }

        checkAuth();

        return () => {
            disconnectSocket();
        };
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <UserProvider user={user}>
            <DashboardLayout user={user}>
                {children}
                <CallOverlayV2
                    incomingCall={webrtc.incomingCall}
                    callSession={webrtc.callSession}
                    localStream={webrtc.localStream}
                    remoteStreams={webrtc.remoteStreams}
                    micEnabled={webrtc.micEnabled}
                    cameraEnabled={webrtc.cameraEnabled}
                    onAccept={webrtc.acceptCall}
                    onReject={webrtc.rejectCall}
                    onEnd={webrtc.endCall}
                    onToggleMic={webrtc.toggleMic}
                    onToggleCamera={webrtc.toggleCamera}
                    error={webrtc.error}
                    onClearError={webrtc.clearError}
                />
            </DashboardLayout>
        </UserProvider>
    );
}
