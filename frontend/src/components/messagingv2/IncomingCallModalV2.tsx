'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Avatar, message as antMessage } from 'antd';
import { PhoneOutlined, PhoneFilled, CloseOutlined } from '@ant-design/icons';
import { IncomingCall } from '@/types/messagingv2';

interface Props {
  call: IncomingCall;
  onAccept: () => void;
  onReject: () => void;
}

/**
 * IncomingCallModalV2
 * Modal that appears when receiving an incoming call
 */
export default function IncomingCallModalV2({
  call,
  onAccept,
  onReject,
}: Props) {
  const [ringAudio] = useState(
    typeof Audio !== 'undefined' ? new Audio('/sounds/ring.mp3') : null
  );

  // Play ringing sound
  useEffect(() => {
    if (ringAudio) {
      ringAudio.loop = true;
      ringAudio.play().catch(() => {
        console.log('Could not autoplay ring sound');
      });
    }

    return () => {
      if (ringAudio) {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      }
    };
  }, [ringAudio]);

  const handleAccept = () => {
    if (ringAudio) {
      ringAudio.pause();
    }
    onAccept();
  };

  const handleReject = () => {
    if (ringAudio) {
      ringAudio.pause();
    }
    onReject();
  };

  return (
    <Modal
      title={null}
      open={true}
      onCancel={handleReject}
      footer={null}
      closable={false}
      centered
      width={320}
      style={{ backgroundColor: '#fff' }}
      wrapClassName="incoming-call-modal"
    >
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        {/* Caller Avatar */}
        <Avatar src={call.initiatorAvatar} size={120} />

        {/* Caller Name */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {call.initiatorName || 'Unknown Caller'}
          </h2>
          <p className="text-sm text-gray-600">
            {call.callType === 'video' ? 'Video call' : 'Voice call'}
            {call.isGroup && ` • ${call.participantCount} people`}
          </p>
        </div>

        {/* Ringing Animation */}
        <div className="flex gap-2">
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>

        {/* Actions */}
        <Space size="large" className="mt-4">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={
              call.callType === 'video' ? (
                <PhoneFilled />
              ) : (
                <PhoneOutlined />
              )
            }
            onClick={handleAccept}
            style={{
              backgroundColor: '#10b981',
              width: 56,
              height: 56,
              fontSize: 24,
            }}
          />

          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<CloseOutlined />}
            onClick={handleReject}
            style={{
              width: 56,
              height: 56,
              fontSize: 24,
            }}
          />
        </Space>
      </div>
    </Modal>
  );
}

