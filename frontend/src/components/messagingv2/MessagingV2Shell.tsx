'use client';

import React, { useState, useEffect } from 'react';
import { Empty } from 'antd';
import { useUser } from '@/lib/context/UserContext';
import { useMessagingV2 } from '@/hooks/useMessagingV2';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useSocketIO } from '@/hooks/useSocketIO';
import { initializeSocket } from '@/lib/socket/client';
import ConversationSidebarV2 from './ConversationSidebarV2';
import MessagePaneV2 from './MessagePaneV2';
import IncomingCallModalV2 from './IncomingCallModalV2';
import ActiveCallViewV2 from './ActiveCallViewV2';

/**
 * MessagingV2Shell
 * Main component for the new messaging system
 * Renders conversation sidebar and message pane in a 3-panel layout
 */
export default function MessagingV2Shell() {
  const user = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const messaging = useMessagingV2(selectedConversationId || '');
  const webrtc = useWebRTC();

  // Initialize Socket.io once on mount
  // Note: JWT is in an httpOnly cookie (not accessible from JS).
  // REST calls authenticate via cookie; socket gets an empty token and connects
  // in unauthenticated mode — real-time push works if the backend allows it,
  // otherwise the conversation still loads correctly via REST polling.
  useEffect(() => {
    if (user) {
      try {
        initializeSocket('', user.id);
      } catch (error) {
        console.error('Failed to initialize Socket.io:', error);
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="Please log in to access messaging" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Active Call View (Overlay) */}
      {webrtc.callSession && (
        <ActiveCallViewV2
          callSession={webrtc.callSession}
          localStream={webrtc.localStream}
          remoteStreams={webrtc.remoteStreams}
          onEndCall={webrtc.endCall}
          onToggleMic={webrtc.toggleMic}
          onToggleCamera={webrtc.toggleCamera}
          micEnabled={webrtc.micEnabled}
          cameraEnabled={webrtc.cameraEnabled}
        />
      )}

      {/* Sidebar */}
      <div className="w-80 hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <ConversationSidebarV2
          selectedId={selectedConversationId || undefined}
          onSelectConversation={setSelectedConversationId}
          currentUserId={user.id}
        />
      </div>

      {/* Main Message Pane */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {selectedConversationId ? (
          <MessagePaneV2
            conversationId={selectedConversationId}
            currentUserId={user.id}
            messaging={messaging}
            webrtc={webrtc}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              description="Select a conversation to start messaging"
              style={{ marginBottom: 48 }}
            />
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {webrtc.incomingCall && !webrtc.callSession && (
        <IncomingCallModalV2
          call={webrtc.incomingCall}
          onAccept={() => webrtc.acceptCall(webrtc.incomingCall!.callSessionId)}
          onReject={() => webrtc.rejectCall(webrtc.incomingCall!.callSessionId)}
        />
      )}
    </div>
  );
}

