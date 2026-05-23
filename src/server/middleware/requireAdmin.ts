/**
 * requireAdmin.ts — CaraBase©™
 *
 * Middleware for validating SuperAdmin sessions.
 * In-memory, volatile, and isolated from user auth.
 * Adapted from ClawChives SuperAdmin feature.
 *
 * Maintained by CrustAgent©™
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// In-memory admin session store (intentionally volatile)
const adminSessions = new Map<string, { expiresAt: number }>();

// Cleanup interval (every minute)
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of adminSessions) {
    if (session.expiresAt <= now) adminSessions.delete(key);
  }
}, 60_000);

/**
 * Validates the admin session from a cookie or header.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.headers['x-admin-session'] as string || req.cookies?.cb_admin_session;

  if (!sessionToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin session required.' });
  }

  const session = adminSessions.get(sessionToken);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(sessionToken);
    return res.status(401).json({ success: false, error: 'Session expired. Please re-authenticate.' });
  }

  // Refresh session on activity (20 more minutes)
  session.expiresAt = Date.now() + 20 * 60 * 1000;
  
  next();
}

/**
 * Quietly check if a session is valid without throwing an error status.
 * Used for the initial "verify" handshake to keep the browser console clean.
 */
export function isAdminSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(token);
    return false;
  }
  // Refresh on activity
  session.expiresAt = Date.now() + 20 * 60 * 1000;
  return true;
}

/**
 * Creates a new admin session.
 */
export function createAdminSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 20 * 60 * 1000; // 20 minutes
  adminSessions.set(token, { expiresAt });
  return token;
}

/**
 * Destroys an admin session.
 */
export function destroyAdminSession(token: string) {
  adminSessions.delete(token);
}
