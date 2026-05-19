import crypto from 'crypto';

/**
 * Generate a random string of specified length.
 * Uses crypto.randomInt to avoid modulo bias.
 * Output: alphanumeric (A-Za-z0-9)
 */
export function generateString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[crypto.randomInt(chars.length)];
  }
  return result;
}

/**
 * Generate a cryptographically secure UUID.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Hash a key using SHA-256.
 * Used for storing agent keys and tokens securely.
 *
 * One-way: plaintext → hash, but hash → plaintext impossible
 */
export function hashKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

/**
 * Timing-safe comparison of two buffers.
 * Prevents attackers from inferring key format via response time.
 *
 * Returns true only if both buffers have identical content.
 * Throws if lengths don't match (catch and return false).
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    return false;  // Different lengths or error
  }
}
