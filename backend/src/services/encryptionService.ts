import crypto from 'crypto';

/**
 * Encryption Service
 * Handles all cryptographic operations for secure messaging
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16; // 16 bytes = 128 bits
  private readonly AUTH_TAG_LENGTH = 16; // 16 bytes for GCM
  private readonly ENCODING = 'hex';

  /**
   * Generate a new conversation key (256-bit random)
   */
  generateConversationKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt a message using AES-256-GCM
   * @param plaintext - The message to encrypt
   * @param conversationKey - The shared conversation key (hex string)
   * @returns Object with encrypted content, IV, and auth tag (all hex strings)
   */
  encryptMessage(
    plaintext: string,
    conversationKey: string
  ): { encryptedContent: string; iv: string; authTag: string } {
    const keyBuffer = Buffer.from(conversationKey, this.ENCODING);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
    let encryptedContent = cipher.update(plaintext, 'utf-8', this.ENCODING);
    encryptedContent += cipher.final(this.ENCODING);

    const authTag = cipher.getAuthTag().toString(this.ENCODING);

    return {
      encryptedContent,
      iv: iv.toString(this.ENCODING),
      authTag,
    };
  }

  /**
   * Decrypt a message using AES-256-GCM
   * @param encryptedContent - The encrypted message (hex string)
   * @param iv - The initialization vector (hex string)
   * @param authTag - The authentication tag (hex string)
   * @param conversationKey - The shared conversation key (hex string)
   * @returns The decrypted plaintext
   */
  decryptMessage(
    encryptedContent: string,
    iv: string,
    authTag: string,
    conversationKey: string
  ): string {
    const keyBuffer = Buffer.from(conversationKey, this.ENCODING);
    const ivBuffer = Buffer.from(iv, this.ENCODING);
    const authTagBuffer = Buffer.from(authTag, this.ENCODING);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let plaintext = decipher.update(encryptedContent, this.ENCODING, 'utf-8');
    plaintext += decipher.final('utf-8');

    return plaintext;
  }

  /**
   * Encrypt a file buffer using AES-256-GCM
   * @param fileBuffer - The file contents as a buffer
   * @param conversationKey - The shared conversation key (hex string)
   * @returns Object with encrypted buffer, key, and IV (base64)
   */
  encryptFile(
    fileBuffer: Buffer,
    conversationKey: string
  ): { encryptedBuffer: Buffer; key: string; iv: string } {
    const keyBuffer = Buffer.from(conversationKey, this.ENCODING);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
    let encryptedBuffer = cipher.update(fileBuffer);
    encryptedBuffer = Buffer.concat([encryptedBuffer, cipher.final()]);

    // Note: For files, we also need to prepend the auth tag
    const authTag = cipher.getAuthTag();
    const withAuthTag = Buffer.concat([encryptedBuffer, authTag]);

    return {
      encryptedBuffer: withAuthTag,
      key: conversationKey, // Pass through the key (will be encrypted per-user separately)
      iv: iv.toString('base64'),
    };
  }

  /**
   * Decrypt a file buffer using AES-256-GCM
   * @param encryptedBuffer - The encrypted file contents (includes auth tag at end)
   * @param conversationKey - The shared conversation key (hex string)
   * @param iv - The initialization vector (base64 string)
   * @returns The decrypted file buffer
   */
  decryptFile(
    encryptedBuffer: Buffer,
    conversationKey: string,
    iv: string
  ): Buffer {
    const keyBuffer = Buffer.from(conversationKey, this.ENCODING);
    const ivBuffer = Buffer.from(iv, 'base64');

    // Extract auth tag from end of encrypted buffer
    const authTag = encryptedBuffer.slice(-this.AUTH_TAG_LENGTH);
    const ciphertextOnly = encryptedBuffer.slice(0, -this.AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextOnly);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Encrypt a conversation key for a specific user
   * Uses PBKDF2-derived user key for wrapping
   * @param conversationKey - The shared conversation key (hex string)
   * @param userDerivedKey - User's derived key (hex string)
   * @returns Encrypted conversation key (hex string)
   */
  encryptKeyForUser(
    conversationKey: string,
    userDerivedKey: string
  ): string {
    const keyBuffer = Buffer.from(userDerivedKey, this.ENCODING);
    const plainKey = Buffer.from(conversationKey, this.ENCODING);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
    let encryptedKey = cipher.update(plainKey).toString(this.ENCODING);
    encryptedKey += cipher.final(this.ENCODING);

    const authTag = cipher.getAuthTag().toString(this.ENCODING);

    // Return combined: iv + authTag + encryptedKey
    return `${iv.toString(this.ENCODING)}:${authTag}:${encryptedKey}`;
  }

  /**
   * Decrypt a conversation key for a specific user
   * @param encryptedKeyWithMetadata - Combined string: iv:authTag:encryptedKey
   * @param userDerivedKey - User's derived key (hex string)
   * @returns The decrypted conversation key (hex string)
   */
  decryptKeyForUser(
    encryptedKeyWithMetadata: string,
    userDerivedKey: string
  ): string {
    const [ivHex, authTagHex, encryptedKey] = encryptedKeyWithMetadata.split(':');

    const keyBuffer = Buffer.from(userDerivedKey, this.ENCODING);
    const ivBuffer = Buffer.from(ivHex, this.ENCODING);
    const authTagBuffer = Buffer.from(authTagHex, this.ENCODING);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decryptedKey = decipher.update(encryptedKey, this.ENCODING, this.ENCODING);
    decryptedKey += decipher.final(this.ENCODING);

    return decryptedKey;
  }

  /**
   * Derive a user key from password hash
   * Uses PBKDF2 with SHA-256
   * @param userId - User ID as salt
   * @param passwordHash - The user's password hash (stored in DB)
   * @returns Derived key (hex string)
   */
  deriveUserKey(userId: string, passwordHash: string): string {
    const salt = userId; // Use user ID as salt for deterministic key
    const derivedKey = crypto.pbkdf2Sync(
      passwordHash,
      salt,
      100000, // iterations
      32, // key length (256 bits)
      'sha256'
    );
    return derivedKey.toString(this.ENCODING);
  }

  /**
   * Hash a conversation key for database storage
   * Uses HMAC-SHA256 for integrity verification
   * @param conversationKey - The shared conversation key (hex string)
   * @returns Hash of the key (hex string)
   */
  hashConversationKey(conversationKey: string): string {
    return crypto
      .createHmac('sha256', 'buildtrack-messaging-key')
      .update(conversationKey)
      .digest(this.ENCODING);
  }

  /**
   * Verify a conversation key hash
   * @param conversationKey - The shared conversation key (hex string)
   * @param keyHash - The stored hash from database
   * @returns Whether the hash matches
   */
  verifyConversationKeyHash(conversationKey: string, keyHash: string): boolean {
    const computedHash = this.hashConversationKey(conversationKey);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(keyHash)
    );
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
