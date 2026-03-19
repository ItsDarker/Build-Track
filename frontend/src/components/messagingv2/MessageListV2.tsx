'use client';

import React from 'react';
import { DecryptedMessageV2, PresenceStatus } from '@/types/messagingv2';
import MessageBubbleV2 from './MessageBubbleV2';
import TypingIndicatorV2 from './TypingIndicatorV2';

interface Props {
  messages: DecryptedMessageV2[];
  currentUserId: string;
  typingUsers: Set<string>;
  memberPresences: { [userId: string]: PresenceStatus };
  sharedKeyHex: string | null;
}

/**
 * MessageListV2
 * Renders list of messages with proper grouping
 */
export default function MessageListV2({
  messages,
  currentUserId,
  typingUsers,
  memberPresences,
  sharedKeyHex,
}: Props) {
  // Group messages by sender to avoid repetitive avatars
  // Filter out messages that failed to decrypt so they don't clutter the UI
  const validMessages = messages.filter((m) => !m.decryptionFailed);
  const groupedMessages = validMessages.reduce((acc, msg, index) => {
    const lastMsg = validMessages[index - 1];
    const isSameSender = lastMsg && lastMsg.senderId === msg.senderId;
    const isConsecutive = isSameSender &&
      new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime() < 60000; // 1 minute

    if (!isSameSender || !isConsecutive) {
      acc.push({ type: 'message', message: msg, isFirstInGroup: true });
    } else {
      acc.push({ type: 'message', message: msg, isFirstInGroup: false });
    }

    return acc;
  }, [] as any[]);

  return (
    <div className="flex flex-col gap-2">
      {groupedMessages.map((item, index) => (
        <MessageBubbleV2
          key={item.message.id}
          message={item.message}
          isOwn={item.message.senderId === currentUserId}
          isFirstInGroup={item.isFirstInGroup}
          sharedKeyHex={sharedKeyHex}
        />
      ))}

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <TypingIndicatorV2 userCount={typingUsers.size} />
      )}
    </div>
  );
}

