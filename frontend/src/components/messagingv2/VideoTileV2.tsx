'use client';

import React, { useEffect, useRef } from 'react';
import { Avatar, Badge } from 'antd';
import { AudioMutedOutlined } from '@ant-design/icons';

interface Props {
  stream: MediaStream | null;
  isLocal: boolean;
  userName: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

/**
 * VideoTileV2
 * Individual video tile for local or remote participant
 */
export default function VideoTileV2({
  stream,
  isLocal,
  userName,
  micEnabled,
  cameraEnabled,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />

      {/* Overlay - No Camera */}
      {!cameraEnabled && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex items-center justify-center">
          <div className="text-center">
            <Avatar size={80} style={{ backgroundColor: '#1890ff' }}>
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <p className="text-white mt-2">{userName}</p>
            <p className="text-gray-400 text-sm">Camera off</p>
          </div>
        </div>
      )}

      {/* User Name Badge */}
      <div className="absolute top-3 left-3 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
        {userName}
        {isLocal && ' (You)'}
      </div>

      {/* Mic Status Badge */}
      <Badge
        count={!micEnabled ? <AudioMutedOutlined style={{ color: '#ff4d4f' }} /> : null}
        className="absolute top-3 right-3"
      />

      {/* Local Label */}
      {isLocal && (
        <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-2 py-1 rounded text-xs">
          Local
        </div>
      )}
    </div>
  );
}

