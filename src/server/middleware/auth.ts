import { Request, Response, NextFunction } from 'express';
import db from '../db.js';
import { hashKey, timingSafeCompare } from '../utils/crypto.js';
import { checkTokenExpiry } from '../utils/tokenExpiry.js';
import { createAuditLogger } from '../utils/auditLogger.js';

const audit = createAuditLogger(db);

export interface AuthRequest extends Request {
  apiKey: string;
  keyType: 'human' | 'agent' | 'api';
  userUuid: string;
  role: 'superadmin' | 'admin' | 'viewer';
  agentPermissions: Record<string, boolean | string>;
  username: string | null;
}

function detectKeyType(key: string): 'human' | 'agent' | 'api' | null {
  if (key?.startsWith('hu-')) return 'human';
  if (key?.startsWith('lb-')) return 'agent';
  if (key?.startsWith('api-')) return 'api';
  return null;
}

const HUMAN_PERMISSIONS = {
  canRead: true,
  canWrite: true,
  canEdit: true,
  canMove: true,
  canDelete: true,
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: no Bearer token' });
    return;
  }

  const key = auth.substring(7).trim();
  const keyType = detectKeyType(key);

  if (!keyType) {
    res.status(401).json({
      success: false,
      error: 'Invalid key format — must use hu-, lb-, or api- prefix'
    });
    return;
  }

  let finalUserUuid: string | null = null;
  let finalPermissions: Record<string, boolean | string> | null = null;
  let actualKeyType: 'human' | 'agent' | 'api' = keyType;

  if (keyType === 'api') {
    const hashedKey = hashKey(key);
    const row = db.prepare('SELECT * FROM api_tokens WHERE token_hash = ?').get(hashedKey) as any;

    if (!row) {
      res.status(401).json({ success: false, error: 'Invalid or revoked API token' });
      return;
    }

    if (row.revoked_at) {
      audit.log('AUTH_FAILURE', {
        actor: row.owner_key,
        action: 'validate_token',
        outcome: 'failure',
        resource: 'api_token',
        details: { reason: 'Token revoked' }
      });
      res.status(401).json({ success: false, error: 'Token has been revoked' });
      return;
    }

    if (!checkTokenExpiry(row.expires_at)) {
      audit.log('AUTH_FAILURE', {
        actor: row.owner_key,
        action: 'validate_token',
        outcome: 'failure',
        resource: 'api_token',
        details: { reason: 'Token expired' }
      });
      res.status(401).json({ success: false, error: 'Token expired. Please authenticate again.' });
      return;
    }

    if (row.owner_type === 'human') {
      finalUserUuid = row.owner_key;
      finalPermissions = HUMAN_PERMISSIONS;
      actualKeyType = 'human';
    } else if (row.owner_type === 'agent') {
      const agent = db.prepare(
        'SELECT user_uuid, permissions, is_active, expiration_date FROM agent_keys WHERE api_key_hash = ?'
      ).get(row.owner_key) as any;

      if (!agent) {
        res.status(401).json({ success: false, error: 'Agent for this token no longer exists' });
        return;
      }

      if (!agent.is_active) {
        res.status(401).json({ success: false, error: 'Lobster Key revoked' });
        return;
      }

      if (agent.expiration_date && new Date(agent.expiration_date) < new Date()) {
        res.status(401).json({ success: false, error: 'Lobster Key expired' });
        return;
      }

      finalUserUuid = agent.user_uuid;
      finalPermissions = JSON.parse(agent.permissions || '{}');
      actualKeyType = 'agent';
    }
  }

  if (keyType === 'agent') {
    const hashedKey = hashKey(key);
    const row = db.prepare(
      'SELECT * FROM agent_keys WHERE api_key_hash = ? AND is_active = 1'
    ).get(hashedKey) as any;

    if (!row) {
      res.status(401).json({ success: false, error: 'Lobster Key revoked or invalid' });
      return;
    }

    if (row.expiration_date && new Date(row.expiration_date) < new Date()) {
      res.status(401).json({ success: false, error: 'Lobster Key expired' });
      return;
    }

    db.prepare('UPDATE agent_keys SET last_used = ? WHERE api_key_hash = ?')
      .run(new Date().toISOString(), hashedKey);

    finalUserUuid = row.user_uuid;
    finalPermissions = JSON.parse(row.permissions || '{}');
    actualKeyType = 'agent';
  }

  if (!finalUserUuid) {
    res.status(401).json({ success: false, error: 'Could not resolve user identity' });
    return;
  }

  // Fetch user info.
  // SECURITY: A token that resolves to a user UUID which no longer exists
  // (e.g., stale browser session against a wiped/restored database) is an
  // authentication failure — NOT a low-privilege session. We reject with 401
  // instead of silently downgrading to 'viewer'.
  const userRow = db.prepare('SELECT role, username FROM users WHERE uuid = ?').get(finalUserUuid) as { role: 'superadmin' | 'admin' | 'viewer', username: string } | undefined;

  if (!userRow) {
    audit.log('AUTH_FAILURE', {
      actor: finalUserUuid,
      actor_type: actualKeyType,
      action: 'validate_token',
      outcome: 'failure',
      resource: 'user',
      details: { reason: 'Identity no longer exists' },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || ''
    });
    res.status(401).json({ success: false, error: 'Identity no longer exists. Please log in again.' });
    return;
  }

  const userRole = userRow.role;
  const username = userRow.username;

  const authReq = req as AuthRequest;
  authReq.apiKey = key;
  authReq.keyType = actualKeyType;
  authReq.userUuid = finalUserUuid;
  authReq.role = userRole;
  authReq.agentPermissions = finalPermissions || {};
  authReq.username = username;

  next();
}

export function requirePermission(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (authReq.agentPermissions?.level === 'full') {
      next();
      return;
    }

    if (authReq.agentPermissions?.[action] === true) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `Permission denied: ${action} required`
    });
  };
}

export function requireHuman(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;

  if (authReq.keyType === 'human') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Forbidden: This action requires human identity'
  });
}
