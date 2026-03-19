'use client';

import React from 'react';
import { Button, Space, Tooltip, Card } from 'antd';
import { PhoneOutlined, AudioOutlined, AudioMutedOutlined, VideoCameraOutlined, PhoneFilled } from '@ant-design/icons';
import { CallSession } from '@/types/messagingv2';
import VideoTileV2 from './VideoTileV2';

interface Props {
  callSession: CallSession;
  localStream: MediaStream | null;
  remoteStreams: { [userId: string]: MediaStream };
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

/**
 * ActiveCallViewV2
 * Full-screen active call view with video tiles and controls
 */
export default function ActiveCallViewV2({
  callSession,
  localStream,
  remoteStreams,
  onEndCall,
  onToggleMic,
  onToggleCamera,
  micEnabled,
  cameraEnabled,
}: Props) {
  const participantCount = Object.keys(remoteStreams).length + 1; // +1 for self
  const remoteUserIds = Object.keys(remoteStreams);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 flex flex-wrap overflow-hidden">
        {/* Local Video */}
        <div className="flex-1 min-w-[200px] p-2">
          <VideoTileV2
            stream={localStream}
            isLocal={true}
            userName="You"
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
          />
        </div>

        {/* Remote Videos */}
        {remoteUserIds.map((userId) => (
          <div key={userId} className="flex-1 min-w-[200px] p-2">
            <VideoTileV2
              stream={remoteStreams[userId]}
              isLocal={false}
              userName={userId}
              micEnabled={true}
              cameraEnabled={true}
            />
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="bg-black bg-opacity-80 px-6 py-4 flex items-center justify-center gap-4">
        {/* Call Info */}
        <div className="text-white text-sm mr-4">
          {callSession.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'} •{' '}
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>

        {/* Controls */}
        <Space>
          <Tooltip title={micEnabled ? 'Mute' : 'Unmute'}>
            <Button
              type={micEnabled ? 'default' : 'primary'}
              danger={!micEnabled}
              icon={
                micEnabled ? <AudioOutlined /> : <AudioMutedOutlined />
              }
              onClick={onToggleMic}
              size="large"
              shape="circle"
            />
          </Tooltip>

          {callSession.callType === 'video' && (
            <Tooltip title={cameraEnabled ? 'Stop camera' : 'Start camera'}>
              <Button
                type={cameraEnabled ? 'default' : 'primary'}
                danger={!cameraEnabled}
                icon={
                  cameraEnabled ? (
                    <VideoCameraOutlined />
                  ) : (
                    <VideoCameraOutlined />
                  )
                }
                onClick={onToggleCamera}
                size="large"
                shape="circle"
              />
            </Tooltip>
          )}

          {/* End Call */}
          <Tooltip title="End call">
            <Button
              type="primary"
              danger
              icon={<PhoneFilled />}
              onClick={onEndCall}
              size="large"
              shape="circle"
            />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
}

