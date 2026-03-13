/**
 * Device Fingerprinting Utility
 * Generates a unique fingerprint for the current device/browser
 * Used for "Remember Me" functionality
 */

import crypto from 'crypto';

interface DeviceInfo {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
}

/**
 * Get device information
 */
function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0,
    deviceMemory: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined,
  };
}

/**
 * Generate device fingerprint (hash of device info)
 * This creates a unique identifier for the device
 * Note: Uses synchronous hash for immediate use in forms
 */
export function generateDeviceFingerprint(): string {
  const deviceInfo = getDeviceInfo();
  const fingerprint = [
    deviceInfo.userAgent,
    deviceInfo.language,
    deviceInfo.timezone,
    deviceInfo.screenResolution,
    deviceInfo.hardwareConcurrency,
    deviceInfo.deviceMemory?.toString() || '',
  ].join('|');

  // Use simple synchronous hash function for immediate use
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * Async fingerprint using SubtleCrypto
 */
async function fingerprintAsync(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `fp_${hashHex}`;
}

/**
 * Get device fingerprint (synchronously)
 * For browser, returns a sync fingerprint
 */
export function getDeviceFingerprint(): string {
  // Get from localStorage if already generated in this session
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('_device_fingerprint') : null;
  if (stored) {
    return stored;
  }

  const fingerprint = generateDeviceFingerprint();

  // Store for this session
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('_device_fingerprint', fingerprint);
  }

  return fingerprint;
}

/**
 * Store device token
 */
export function storeDeviceToken(email: string, deviceToken: string): void {
  if (typeof localStorage === 'undefined') return;

  const key = `device_token_${email}`;
  localStorage.setItem(key, deviceToken);
}

/**
 * Get stored device token
 */
export function getStoredDeviceToken(email: string): string | null {
  if (typeof localStorage === 'undefined') return null;

  const key = `device_token_${email}`;
  return localStorage.getItem(key);
}

/**
 * Clear device token
 */
export function clearDeviceToken(email: string): void {
  if (typeof localStorage === 'undefined') return;

  const key = `device_token_${email}`;
  localStorage.removeItem(key);
}

/**
 * Check if device should auto-login
 */
export function shouldAutoLogin(email: string): boolean {
  const token = getStoredDeviceToken(email);
  return !!token;
}

/**
 * Store remember me preference
 */
export function setRememberMePreference(email: string, remember: boolean): void {
  if (typeof localStorage === 'undefined') return;

  const key = `remember_me_${email}`;
  if (remember) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Get remember me preference
 */
export function getRememberMePreference(email: string): boolean {
  if (typeof localStorage === 'undefined') return false;

  const key = `remember_me_${email}`;
  return localStorage.getItem(key) === 'true';
}
