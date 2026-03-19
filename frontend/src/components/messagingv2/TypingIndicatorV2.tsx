'use client';

import React from 'react';

interface Props {
  userCount: number;
}

/**
 * TypingIndicatorV2
 * Animated typing indicator
 */
export default function TypingIndicatorV2({ userCount }: Props) {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <span className="text-xs text-gray-500">
        {userCount === 1 ? 'Someone is typing' : `${userCount} people are typing`}
      </span>
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        />
      </div>
    </div>
  );
}

