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
import db from '../db.js';
import { createAuditLogger } from '../utils/auditLogger.js';

const audit = createAuditLogger(db);

interface AdminSession {
  expiresAt: number;
  userAgent: string;
  ip: string;
}

// In-memory admin session store (intentionally volatile)
const adminSessions = new Map<string, AdminSession>();

// Throttle for unauthorized logs to prevent DoS (1 log per minute per IP)
const unauthorizedLogThrottle = new Map<string, number>();

// Cleanup interval (every minute)
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of adminSessions) {
    if (session.expiresAt <= now) adminSessions.delete(key);
  }
  for (const [ip, lastLoggedAt] of unauthorizedLogThrottle) {
    if (now - lastLoggedAt > 60000) unauthorizedLogThrottle.delete(ip);
  }
}, 60_000);

const SESSION_TOKEN_REGEX = /^[0-9a-f]{64}$/;

function logUnauthorizedAttempt(req: Request, reason: string) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const lastLoggedAt = unauthorizedLogThrottle.get(ip);
  
  if (!lastLoggedAt || now - lastLoggedAt > 60000) {
    unauthorizedLogThrottle.set(ip, now);
    audit.log('ADMIN_UNAUTHORIZED', {
      action: 'admin_access_denied',
      outcome: 'failure',
      ip_address: ip,
      user_agent: req.headers['user-agent'] || '',
      details: { reason, path: req.path }
    });
  }
}

/**
 * Validates the admin session from a cookie or header.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.headers['x-admin-session'] as string || req.cookies?.cb_admin_session;

  if (!sessionToken) {
    logUnauthorizedAttempt(req, 'Missing session token');
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin session required.' });
  }

  if (!SESSION_TOKEN_REGEX.test(sessionToken)) {
    logUnauthorizedAttempt(req, 'Malformed session token');
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid session format.' });
  }

  const session = adminSessions.get(sessionToken);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(sessionToken);
    logUnauthorizedAttempt(req, 'Expired or missing session');
    return res.status(401).json({ success: false, error: 'Session expired. Please re-authenticate.' });
  }

  const currentUserAgent = req.headers['user-agent'] || '';
  if (session.userAgent !== currentUserAgent) {
    adminSessions.delete(sessionToken);
    logUnauthorizedAttempt(req, 'Context mismatch (User-Agent)');
    return res.status(401).json({ success: false, error: 'Session context mismatch. Please re-authenticate.' });
  }

  // Refresh session on activity (20 more minutes)
  session.expiresAt = Date.now() + 20 * 60 * 1000;
  
  next();
}

/**
 * Quietly check if a session is valid without throwing an error status.
 * Used for the initial "verify" handshake to keep the browser console clean.
 */
export function isAdminSessionValid(req: Request, token: string | undefined): boolean {
  if (!token || !SESSION_TOKEN_REGEX.test(token)) return false;
  
  const session = adminSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) adminSessions.delete(token);
    return false;
  }
  
  const currentUserAgent = req.headers['user-agent'] || '';
  if (session.userAgent !== currentUserAgent) {
    adminSessions.delete(token);
    return false;
  }
  
  // Refresh on activity
  session.expiresAt = Date.now() + 20 * 60 * 1000;
  return true;
}

/**
 * Creates a new admin session bound to context.
 */
export function createAdminSession(req: Request): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 20 * 60 * 1000; // 20 minutes
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  adminSessions.set(token, { expiresAt, userAgent, ip });
  return token;
}

/**
 * Destroys an admin session.
 */
export function destroyAdminSession(token: string) {
  if (SESSION_TOKEN_REGEX.test(token)) {
    adminSessions.delete(token);
  }
}
