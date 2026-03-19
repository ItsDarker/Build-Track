/**
 * MessagingV2 Domain Types
 * Complete TypeScript interfaces for the new messaging module
 */

/**
 * User in messaging context
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status?: string;
}

/**
 * Presence status
 */
export type PresenceStatus = 'online' | 'away' | 'offline' | 'in-call';

export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: Date;
  user?: User;
}

/**
 * Conversation member
 */
export interface ConversationMemberV2 {
  id: string;
  userId: string;
  conversationId: string;
  user: User;
  role: string;
  joinedAt: Date;
  leftAt?: Date | null;
  lastReadAt?: Date | null;
}

/**
 * Conversation (1:1 or group)
 */
export interface ConversationV2 {
  id: string;
  name?: string;
  description?: string;
  iconUrl?: string;
  isGroup: boolean;
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Conversation with members
 */
export interface ConversationWithMembersV2 extends ConversationV2 {
  members: ConversationMemberV2[];
  lastMessage?: MessageV2;
  unreadCount?: number;
}

/**
 * Conversation list item (for sidebar)
 */
export interface ConversationListItemV2 extends ConversationWithMembersV2 {
  lastActivity: Date;
  memberPresences: { [userId: string]: PresenceStatus };
}

/**
 * Message attachment
 */
export interface MessageAttachmentV2 {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  gcsFileId?: string;
}

/**
 * Message
 */
export interface MessageV2 {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  messageType: string;
  isEdited: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  deletedAt?: Date | null;
  attachments: MessageAttachmentV2[];
}

/**
 * Decrypted message (client-side)
 */
export interface DecryptedMessageV2 extends MessageV2 {
  decryptedContent: string;
  decryptionFailed?: boolean;
  decryptionError?: string;
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  userId: string;
  conversationId: string;
  typing: boolean;
}

/**
 * Read receipt
 */
export interface ReadReceipt {
  userId: string;
  conversationId: string;
  lastReadAt: Date;
}

/**
 * Call session
 */
export interface CallSession {
  id: string;
  conversationId?: string;
  callType: 'video' | 'audio';
  initiatorId: string;
  initiator: User;
  status: 'ringing' | 'connecting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  participants: CallParticipant[];
}

/**
 * Call participant
 */
export interface CallParticipant {
  id: string;
  callSessionId: string;
  userId: string;
  user: User;
  joinedAt: Date;
  leftAt?: Date | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  sdpOffer?: string;
  sdpAnswer?: string;
}

/**
 * Incoming call notification
 */
export interface IncomingCall {
  callSessionId: string;
  initiatorId: string;
  initiatorName?: string;
  initiatorAvatar?: string;
  callType: 'video' | 'audio';
  conversationId?: string;
  isGroup: boolean;
  participantCount: number;
}

/**
 * WebRTC configuration
 */
export interface WebRTCConfig {
  turnServers: Array<{ urls: string | string[] }>;
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
}

/**
 * Socket.io events
 */
export interface SocketIOEvents {
  'messaging:join-conversation': { conversationId: string };
  'messaging:leave-conversation': { conversationId: string };
  'messaging:typing': { conversationId: string; typing: boolean };
  'messaging:typing-stopped': { conversationId: string };
  'messaging:message-sent': any;
  'messaging:edit-message': any;
  'messaging:delete-message': { conversationId: string; messageId: string };
  'messaging:conversation-created': any;

  'calling:initiate': { recipientIds: string[]; conversationId?: string; callType: string };
  'calling:accept': { callSessionId: string; sdpAnswer?: string };
  'calling:reject': { callSessionId: string };
  'calling:start': { callSessionId: string };
  'calling:end': { callSessionId: string };
  'calling:ice-candidate': { callSessionId: string; candidate: any };
  'calling:media-change': { callSessionId: string; micEnabled?: boolean; cameraEnabled?: boolean };
  'calling:sdp-offer': { callSessionId: string; sdpOffer: string };
  'calling:sdp-answer': { callSessionId: string; toUserId: string; sdpAnswer: string };

  'presence:set-status': { status: PresenceStatus };
  'presence:away': void;
  'presence:online': void;
  'presence:get': { userIds: string[] };
  'presence:subscribe': { userIds: string[] };
  'presence:unsubscribe': { userIds: string[] };
  'presence:conversation-members': { conversationId: string };
}

/**
 * UseMessagingV2 hook return type
 */
export interface UseMessagingV2Return {
  conversation: ConversationWithMembersV2 | null;
  messages: DecryptedMessageV2[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  hasMoreMessages: boolean;
  sharedKey: CryptoKey | null;
  decryptedSharedKey: string | null;
  typingUsers: Set<string>;
  memberPresences: { [userId: string]: PresenceStatus };
  loadConversation: () => Promise<void>;
  loadMessages: (reset?: boolean) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  clearError: () => void;
}

/**
 * UseWebRTC hook return type
 */
export interface UseWebRTCReturn {
  callSession: CallSession | null;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStreams: { [userId: string]: MediaStream };
  micEnabled: boolean;
  cameraEnabled: boolean;
  isConnecting: boolean;
  error: string | null;
  initiateCall: (recipientIds: string[], conversationId?: string, callType?: 'audio' | 'video') => Promise<void>;
  acceptCall: (callSessionId: string) => Promise<void>;
  rejectCall: (callSessionId: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  clearError: () => void;
  selectAudioDevice: (deviceId: string) => void;
  selectVideoDevice: (deviceId: string) => void;
  selectSpeaker: (deviceId: string) => void;
}

/**
 * Socket.io listeners (server -> client)
 */
export interface SocketIOListeners {
  'message:new': (message: MessageV2) => void;
  'message:edited': (data: { messageId: string;[key: string]: any }) => void;
  'message:deleted': (data: { messageId: string }) => void;
  'message:read': (data: { userId: string; lastReadAt: Date }) => void;

  'messaging:user-typing': (data: { userId: string; typing: boolean }) => void;
  'messaging:conversation-new': (data: any) => void;

  'user:presence': (data: { userId: string; status: PresenceStatus }) => void;
}
