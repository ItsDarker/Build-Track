/**
 * Client-Side Encryption Library
 * Uses Web Crypto API (SubtleCrypto) for AES-256-GCM encryption/decryption
 * Mirrors backend implementation for seamless message security
 */

/**
 * Encryption result containing ciphertext, IV, and authentication tag
 */
export interface EncryptionResult {
  encryptedContent: string; // Hex-encoded ciphertext
  iv: string; // Hex-encoded initialization vector
  authTag: string; // Hex-encoded authentication tag
}

/**
 * File encryption result with IV included for decryption
 */
export interface FileEncryptionResult {
  encryptedBuffer: ArrayBuffer; // Encrypted file data (includes auth tag at end)
  iv: string; // Base64-encoded IV
  authTag: string; // Hex-encoded auth tag
}

/**
 * Key encryption result for wrapping conversation keys per user
 */
export interface KeyWrapResult {
  encryptedKey: string; // Format: iv:authTag:encryptedKey (all hex)
}

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 16; // bytes (128 bits)
const TAG_LENGTH = 128; // bits for GCM auth tag

/**
 * ClientEncryption class
 * Provides AES-256-GCM encryption/decryption using Web Crypto API
 */
export class ClientEncryption {
  /**
   * Convert hex string to Uint8Array
   */
  static hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      throw new Error('Invalid hex string: odd length');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Convert Uint8Array to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert ArrayBuffer to hex string
   */
  static arrayBufferToHex(buffer: ArrayBuffer): string {
    return this.bytesToHex(new Uint8Array(buffer));
  }

  /**
   * Convert hex string to ArrayBuffer
   */
  static hexToArrayBuffer(hex: string): ArrayBuffer {
    return this.hexToBytes(hex).buffer as ArrayBuffer;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  static arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Import a hex-encoded key as a CryptoKey for use in encryption/decryption
   * @param hexKey - Hex-encoded 256-bit key
   * @returns CryptoKey ready for AES-GCM operations
   */
  static async importKeyFromHex(hexKey: string): Promise<CryptoKey> {
    try {
      if (!hexKey || typeof hexKey !== 'string') {
        throw new Error(`Invalid hexKey: expected string, got ${typeof hexKey}`);
      }

      if (hexKey.length !== 64) {
        throw new Error(`Invalid hexKey length: expected 64 chars (256 bits), got ${hexKey.length}`);
      }

      console.debug('[ClientEncryption.importKeyFromHex] Importing key, length:', hexKey.length);

      const keyData = this.hexToArrayBuffer(hexKey);

      console.debug('[ClientEncryption.importKeyFromHex] Converted to ArrayBuffer, size:', keyData.byteLength);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: ALGORITHM },
        false, // not extractable (security best practice)
        ['encrypt', 'decrypt']
      );

      console.debug('[ClientEncryption.importKeyFromHex] Successfully imported key', {
        type: cryptoKey.type,
        algorithm: (cryptoKey.algorithm as any)?.name,
        usages: cryptoKey.usages,
      });

      return cryptoKey;
    } catch (error) {
      console.error('[ClientEncryption.importKeyFromHex] Failed to import key:', {
        error: error instanceof Error ? error.message : String(error),
        hexKeyLength: hexKey?.length,
        errorType: error?.constructor?.name,
      });
      throw error;
    }
  }

  /**
   * Generate a new random AES-256 key
   * @returns CryptoKey suitable for encryption/decryption
   */
  static async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true, // extractable (needed to export for DB storage)
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Export a CryptoKey to hex string (for transmission)
   * @param cryptoKey - The CryptoKey to export
   * @returns Hex-encoded key (256 bits = 64 hex chars)
   */
  static async exportKeyToHex(cryptoKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', cryptoKey);
    return this.arrayBufferToHex(exported);
  }

  /**
   * Encrypt a plaintext message with AES-256-GCM
   * @param plaintext - Message to encrypt
   * @param cryptoKey - AES-256 CryptoKey
   * @returns Encryption result with encryptedContent, iv, authTag (all hex)
   */
  static async encryptMessage(
    plaintext: string,
    cryptoKey: CryptoKey
  ): Promise<EncryptionResult> {
    try {
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encode plaintext as UTF-8
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Encrypt with AES-256-GCM
      const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
        cryptoKey,
        data
      );

      // Extract ciphertext and auth tag
      // The ciphertext includes the auth tag concatenated at the end
      const ciphertextArray = new Uint8Array(ciphertext);
      const tagStart = ciphertextArray.length - 16; // 128 bits = 16 bytes

      const encryptedContent = this.bytesToHex(ciphertextArray.slice(0, tagStart));
      const authTag = this.bytesToHex(ciphertextArray.slice(tagStart));

      return {
        encryptedContent,
        iv: this.bytesToHex(iv),
        authTag,
      };
    } catch (error) {
      throw new Error(`Message encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt an encrypted message with AES-256-GCM
   * @param encryptedContent - Hex-encoded ciphertext (without auth tag)
   * @param iv - Hex-encoded initialization vector
   * @param authTag - Hex-encoded authentication tag
   * @param cryptoKey - AES-256 CryptoKey
   * @returns Decrypted plaintext message
   */
  static async decryptMessage(
    encryptedContent: string,
    iv: string,
    authTag: string,
    cryptoKey: CryptoKey
  ): Promise<string> {
    try {
      // Validate inputs
      if (!encryptedContent || !iv || !authTag) {
        throw new Error('Missing encryption parameters (content, iv, or tag)');
      }

      console.debug('[ClientEncryption.decryptMessage] Input validation passed', {
        contentLen: encryptedContent.length,
        ivLen: iv.length,
        tagLen: authTag.length,
      });

      // Convert hex inputs to bytes
      const ivBytes = this.hexToBytes(iv);
      const contentBytes = this.hexToBytes(encryptedContent);
      const tagBytes = this.hexToBytes(authTag);

      console.debug('[ClientEncryption.decryptMessage] Converted to bytes', {
        ivBytes: ivBytes.length,
        contentBytes: contentBytes.length,
        tagBytes: tagBytes.length,
      });

      // Reconstruct full ciphertext with tag appended
      const fullCiphertext = new Uint8Array(contentBytes.length + tagBytes.length);
      fullCiphertext.set(contentBytes);
      fullCiphertext.set(tagBytes, contentBytes.length);

      console.debug('[ClientEncryption.decryptMessage] Full ciphertext length:', fullCiphertext.length);

      // Decrypt with AES-256-GCM
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: ivBytes as any, tagLength: TAG_LENGTH },
        cryptoKey,
        fullCiphertext as any
      );

      console.debug('[ClientEncryption.decryptMessage] Decryption successful');

      // Decode to UTF-8 string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      // Better error message extraction
      let errMsg = 'Unknown error';
      if (error instanceof Error) {
        errMsg = error.message;
      } else if (error instanceof DOMException) {
        errMsg = `${error.name}: ${error.message}`;
      } else if (typeof error === 'string') {
        errMsg = error;
      } else {
        errMsg = String(error);
      }

      console.error('[ClientEncryption.decryptMessage] Detailed error:', {
        type: error?.constructor?.name,
        message: errMsg,
        errorObj: error,
      });

      // Don't expose detailed error info to prevent leaking encryption details
      if (errMsg.includes('decryption failed') || errMsg.includes('authentication') || errMsg.includes('OperationError')) {
        throw new Error('Failed to decrypt message - key mismatch or corrupted data');
      }
      throw new Error(`Message decryption failed: ${errMsg}`);
    }
  }

  /**
   * Encrypt a file with AES-256-GCM
   * @param fileData - File contents as ArrayBuffer
   * @param cryptoKey - AES-256 CryptoKey
   * @returns Encryption result with encrypted file data
   */
  static async encryptFile(
    fileData: ArrayBuffer,
    cryptoKey: CryptoKey
  ): Promise<FileEncryptionResult> {
    try {
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encrypt file data
      const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
        cryptoKey,
        fileData
      );

      // Extract ciphertext and auth tag
      const ciphertextArray = new Uint8Array(ciphertext);
      const tagStart = ciphertextArray.length - 16;

      const encryptedBuffer = ciphertextArray.slice(0, tagStart);
      const authTag = ciphertextArray.slice(tagStart);

      return {
        encryptedBuffer: encryptedBuffer.buffer,
        iv: this.arrayBufferToBase64(iv.buffer),
        authTag: this.bytesToHex(authTag),
      };
    } catch (error) {
      throw new Error(`File encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt a file with AES-256-GCM
   * @param encryptedBuffer - Encrypted file data (without auth tag)
   * @param iv - Base64-encoded initialization vector
   * @param authTag - Hex-encoded authentication tag
   * @param cryptoKey - AES-256 CryptoKey
   * @returns Decrypted file data as ArrayBuffer
   */
  static async decryptFile(
    encryptedBuffer: ArrayBuffer,
    iv: string,
    authTag: string,
    cryptoKey: CryptoKey
  ): Promise<ArrayBuffer> {
    try {
      // Convert inputs
      const ivBytes = new Uint8Array(this.base64ToArrayBuffer(iv) as ArrayBuffer);
      const contentBytes = new Uint8Array(encryptedBuffer);
      const tagBytes = this.hexToBytes(authTag);

      // Reconstruct full ciphertext with tag appended
      const fullCiphertext = new Uint8Array(contentBytes.length + tagBytes.length);
      fullCiphertext.set(contentBytes);
      fullCiphertext.set(tagBytes, contentBytes.length);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: ivBytes as any, tagLength: TAG_LENGTH },
        cryptoKey,
        fullCiphertext as any
      );

      return decrypted;
    } catch (error) {
      throw new Error(`File decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Wrap (encrypt) a conversation key with a user's derived key
   * @param conversationKey - Hex-encoded conversation shared key
   * @param userDerivedKey - Hex-encoded user-derived key (from PBKDF2)
   * @returns Key wrap result with encrypted key
   */
  static async encryptKeyForUser(
    conversationKey: string,
    userDerivedKey: string
  ): Promise<KeyWrapResult> {
    try {
      const userKey = await this.importKeyFromHex(userDerivedKey);
      const plainKey = this.hexToArrayBuffer(conversationKey);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encrypt the conversation key
      const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
        userKey,
        plainKey
      );

      // Extract ciphertext and tag
      const encryptedArray = new Uint8Array(encrypted);
      const tagStart = encryptedArray.length - 16;
      const encryptedContent = this.bytesToHex(encryptedArray.slice(0, tagStart));
      const authTag = this.bytesToHex(encryptedArray.slice(tagStart));

      // Return combined: iv:authTag:encryptedKey
      const result = `${this.bytesToHex(iv)}:${authTag}:${encryptedContent}`;
      return { encryptedKey: result };
    } catch (error) {
      throw new Error(`Key wrapping failed: ${(error as Error).message}`);
    }
  }

  /**
   * Unwrap (decrypt) a conversation key with a user's derived key
   * @param encryptedKeyWithMetadata - Combined string: iv:authTag:encryptedKey
   * @param userDerivedKey - Hex-encoded user-derived key (from PBKDF2)
   * @returns Decrypted conversation key as hex string
   */
  static async decryptKeyForUser(
    encryptedKeyWithMetadata: string,
    userDerivedKey: string
  ): Promise<string> {
    try {
      // Parse combined string
      const [ivHex, authTagHex, encryptedKeyHex] = encryptedKeyWithMetadata.split(':');

      const userKey = await this.importKeyFromHex(userDerivedKey);
      const ivBytes = this.hexToBytes(ivHex);
      const contentBytes = this.hexToBytes(encryptedKeyHex);
      const tagBytes = this.hexToBytes(authTagHex);

      // Reconstruct full ciphertext
      const fullCiphertext = new Uint8Array(contentBytes.length + tagBytes.length);
      fullCiphertext.set(contentBytes);
      fullCiphertext.set(tagBytes, contentBytes.length);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: ivBytes as any, tagLength: TAG_LENGTH },
        userKey,
        fullCiphertext as any
      );

      return this.arrayBufferToHex(decrypted);
    } catch (error) {
      throw new Error(`Key unwrapping failed: ${(error as Error).message}`);
    }
  }

  /**
   * Derive a user key from password hash (PBKDF2 equivalent in frontend)
   * Note: Real derivation happens on backend; this is for reference
   * In production, backend sends pre-derived keys to client
   */
  static async deriveUserKey(userId: string, passwordHash: string): Promise<string> {
    try {
      // Import password hash as key
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passwordHash),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      // Derive bits using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(userId),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        KEY_LENGTH // 256 bits
      );

      return this.arrayBufferToHex(derivedBits);
    } catch (error) {
      throw new Error(`Key derivation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Check if Web Crypto API is available in the browser
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.getRandomValues === 'function'
    );
  }
}

/**
 * Singleton instance for convenience
 */
export const clientEncryption = new ClientEncryption();
