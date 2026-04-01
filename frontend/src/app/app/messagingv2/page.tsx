'use client';

import ProRoute from "@/components/auth/ProRoute";

import React from 'react';
import MessagingV2Shell from '@/components/messagingv2/MessagingV2Shell';

/**
 * MessagingV2 Page
 * New messaging module with real-time features and voice/video calling
 * This is the new implementation that replaces the legacy messaging page
 */
export default function MessagingV2Page() {
  return <ProRoute><MessagingV2Shell /></ProRoute>;
}