'use client';

import React from 'react';
import MessagingV2Shell from '@/components/messagingv2/MessagingV2Shell';

/**
 * Messaging Page
 * New messaging module with real-time features, voice/video calling, and presence indicators
 * Uses the messagingv2 implementation with Socket.io and WebRTC
 */
export default function MessagingPage() {
  return <MessagingV2Shell />;
}
