/**
 * Parse TTL string and calculate expiry timestamp.
 *
 * Examples:
 *   '30m' → 30 minutes from now
 *   '1d' → 1 day from now
 *   '90d' → 90 days from now
 *   '1y' → 1 year from now
 */
export function calculateExpiry(ttl: string): string {
  const now = Date.now();
  let ms = 0;

  if (ttl.endsWith('m')) {
    ms = parseInt(ttl) * 60 * 1000;
  } else if (ttl.endsWith('h')) {
    ms = parseInt(ttl) * 60 * 60 * 1000;
  } else if (ttl.endsWith('d')) {
    ms = parseInt(ttl) * 24 * 60 * 60 * 1000;
  } else if (ttl.endsWith('y')) {
    ms = parseInt(ttl) * 365 * 24 * 60 * 60 * 1000;
  } else {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }

  return new Date(now + ms).toISOString();
}

/**
 * Check if an expiry timestamp is still valid.
 * Returns true if not expired, false if expired.
 */
export function checkTokenExpiry(expiresAt: string | null): boolean {
  if (!expiresAt) return true;  // No expiry = always valid
  return new Date(expiresAt) > new Date();
}
