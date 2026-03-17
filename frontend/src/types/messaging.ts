/**
 * Messaging Domain Types
 * Complete TypeScript interfaces for secure messaging module
 */

/**
 * User information in messaging context
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * Conversation member with role info
 */
export interface ConversationMember {
  id: string;
  userId: string;
  user: User;
  joinedAt: Date;
  leftAt?: Date | null;
  lastReadAt?: Date | null;
}

/**
 * Conversation (one-to-one or group)
 */
export interface Conversation {
  id: string;
  name?: string; // null for one-to-one
  description?: string;
  isGroup: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Conversation with full member list and encryption key
 */
export interface ConversationWithMembers extends Conversation {
  createdBy?: User;
  members: ConversationMember[];
  decryptedSharedKeyForCurrentUser?: string; // Hex-encoded CryptoKey
}

/**
 * File attachment metadata
 */
export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  uploadedAt: Date;
}

/**
 * Encrypted message from backend
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  encryptedContent: string; // Hex-encoded ciphertext
  encryptionIv: string; // Hex-encoded IV
  authTag: string; // Hex-encoded authentication tag
  messageType: string; // 'text' | 'system' | 'file'
  isEdited: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  deletedAt?: Date | null;
  attachments: MessageAttachment[];
}

/**
 * Message with decrypted content (client-side)
 */
export interface DecryptedMessage extends Message {
  decryptedContent: string; // Plaintext after decryption
  decryptionFailed?: boolean; // true if decryption errored
  decryptionError?: string; // Error message if decryption failed
}

/**
 * Payload for sending a message
 */
export interface SendMessagePayload {
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  messageType?: string;
}

/**
 * Payload for editing a message
 */
export interface EditMessagePayload extends SendMessagePayload {}

/**
 * Payload for creating a conversation
 */
export interface CreateConversationPayload {
  name?: string; // Required for groups
  description?: string;
  isGroup: boolean;
  memberIds: string[]; // Must include creator
}

/**
 * Paginated messages response
 */
export interface GetMessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Conversation with last message preview
 */
export interface ConversationListItem extends Conversation {
  members: ConversationMember[];
  lastMessage?: {
    id: string;
    senderId: string;
    sender?: { name?: string; displayName?: string };
    createdAt: Date;
  };
  unreadCount?: number;
}

/**
 * Group creation form data
 */
export interface CreateGroupFormData {
  name: string;
  description?: string;
  memberIds: string[];
}

/**
 * Message input state for composer
 */
export interface MessageComposerState {
  content: string;
  files: File[];
  isLoading: boolean;
  error?: string;
}

/**
 * Conversation state from useMessaging hook
 */
export interface UseMessagingState {
  conversation: ConversationWithMembers | null;
  messages: DecryptedMessage[];
  sharedKey: CryptoKey | null;
  isLoading: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  isSending: boolean;
  editingMessageId: string | null;
}

/**
 * Actions from useMessaging hook
 */
export interface UseMessagingActions {
  loadConversation(): Promise<void>;
  loadMessages(resetPagination?: boolean): Promise<void>;
  loadMoreMessages(): Promise<void>;
  sendMessage(plaintext: string): Promise<void>;
  editMessage(messageId: string, plaintext: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  markAsRead(): Promise<void>;
  setEditingMessageId(id: string | null): void;
  clearError(): void;
}

/**
 * Complete useMessaging hook return type
 */
export type UseMessagingReturn = UseMessagingState & UseMessagingActions;

/**
 * Assignable user for member picker
 */
export interface AssignableUser extends User {
  role?: {
    name: string;
    displayName: string;
  };
}
