import { sha256 } from 'js-sha256';

const BASE62_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const KEY_LENGTH = 64

/**
 * Generate a random human-readable key.
 * Format: "hu-" + 64 random Base-62 characters
 * Total entropy: ~381 bits
 */
export function generateHumanKey(): string {
  const bytes = new Uint8Array(KEY_LENGTH)
  crypto.getRandomValues(bytes)

  const chars = Array.from(bytes).map(b => BASE62_CHARSET[b % 62])
  return 'hu-' + chars.join('')
}

/**
 * Generate RFC-4122 v4 UUID.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Hash a token (key) using SHA-256.
 * Input: "hu-[64chars]" (the raw key)
 * Output: 64-character hex string (256 bits)
 */
export async function hashToken(token: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(token)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch(e) {
      // Fallback if subtle digest fails
    }
  }
  return sha256(token);
}

/**
 * Validate an identity file structure.
 * Throws if invalid.
 */
export interface IdentityFile {
  username: string
  uuid: string
  token: string
  createdAt: string
}

export function validateIdentityFile(parsed: unknown): IdentityFile {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Identity file must be a JSON object')
  }

  const { username, uuid, token, createdAt } = parsed as Record<string, unknown>

  if (typeof token !== 'string') {
    throw new Error('token field must be a string')
  }
  if (!token.startsWith('hu-')) {
    throw new Error('token must start with "hu-"')
  }
  if (token.length !== 67) {
    throw new Error('token must be exactly 67 characters (hu- + 64 chars)')
  }

  if (typeof uuid !== 'string' || !uuid) {
    throw new Error('uuid is required and must be a non-empty string')
  }
  if (typeof username !== 'string' || !username) {
    throw new Error('username is required and must be a non-empty string')
  }

  return {
    username,
    uuid,
    token,
    createdAt: String(createdAt ?? '')
  }
}
