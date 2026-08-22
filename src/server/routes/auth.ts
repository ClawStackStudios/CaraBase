import { Router } from 'express';
import db from '../db.js';
import { createAuditLogger } from '../utils/auditLogger.js';
import { calculateExpiry } from '../utils/tokenExpiry.js';
import { generateString, hashKey, timingSafeCompare } from '../utils/crypto.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { AuthSchemas } from '../validation/schemas.js';

const router = Router();
const audit = createAuditLogger(db);

/**
 * POST /api/auth/register
 *
 * Register a new human user with their ClawKey.
 * Client sends: { uuid, username, keyHash }
 * Server stores: user(uuid, username, key_hash)
 */
router.post('/register', authLimiter, validateBody(AuthSchemas.register), (req, res) => {
  const { uuid, username, keyHash } = req.body;

  try {
    const insertUser = db.transaction((uUuid: string, uUsername: string, uKeyHash: string) => {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const assignedRole = userCount.count === 0 ? 'superadmin' : 'viewer';

      db.prepare(
        'INSERT INTO users (uuid, username, key_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(uUuid, uUsername, uKeyHash, assignedRole, new Date().toISOString());
      
      return assignedRole;
    });

    const role = insertUser.immediate(uuid, username, keyHash);

    audit.log('AUTH_REGISTER', {
      actor: uuid,
      actor_type: 'human',
      action: 'register',
      outcome: 'success',
      resource: 'user',
      details: { username, user_uuid: uuid },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    // Return the assigned role so clients can reflect real privileges
    // immediately (first user on an empty table becomes superadmin).
    res.status(201).json({ success: true, message: 'User registered successfully', role });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('unique constraint')) {
      res.status(409).json({
        success: false,
        error: 'Username or key already registered'
      });
      return;
    }
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/token
 *
 * Generate a session token (api-*) from a ClawKey or Lobster Key.
 */
router.post('/token', authLimiter, validateBody(AuthSchemas.token), (req, res) => {
  const { type, uuid, keyHash, ownerKey } = req.body;
  const ttl = process.env.TOKEN_TTL_DEFAULT || '1d';
  const expiresAt = calculateExpiry(ttl);

  if (type === 'human') {
    let user: any;
    if (uuid) {
      user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid) as any;
    } else if (keyHash) {
      user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash) as any;
    }

    if (!user) {
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'human',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const keyMatch = timingSafeCompare(user.key_hash, keyHash);

    if (!keyMatch) {
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'human',
        actor: user.uuid,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string,
        details: { reason: 'Invalid key' }
      });
      res.status(401).json({
        success: false,
        error: 'Invalid identity key'
      });
      return;
    }

    const token = `api-${generateString(32)}`;
    const hashedToken = hashKey(token);

    db.prepare(
      'INSERT INTO api_tokens (key, token_hash, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(token, hashedToken, user.uuid, 'human', new Date().toISOString(), expiresAt);

    audit.log('AUTH_SUCCESS', {
      actor: user.uuid,
      actor_type: 'human',
      action: 'login',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        token,
        type: 'human',
        createdAt: new Date().toISOString(),
        expiresAt,
        user: { uuid: user.uuid, username: user.username, role: user.role }
      }
    });
    return;
  }

  if (type === 'agent') {
    const agentKey = ownerKey;
    if (!agentKey?.startsWith('lb-')) {
      res.status(400).json({ success: false, error: 'Invalid agent key format' });
      return;
    }

    const hashedKey = hashKey(agentKey);
    const agent = db.prepare(
      'SELECT * FROM agent_keys WHERE api_key_hash = ? AND is_active = 1'
    ).get(hashedKey) as any;

    if (!agent) {
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'agent',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });
      res.status(401).json({
        success: false,
        error: 'Invalid or revoked agent key'
      });
      return;
    }

    const token = `api-${generateString(32)}`;
    const hashedToken = hashKey(token);

    db.prepare(
      'INSERT INTO api_tokens (key, token_hash, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(token, hashedToken, hashedKey, 'agent', new Date().toISOString(), expiresAt);

    audit.log('AUTH_SUCCESS', {
      actor: agent.id,
      actor_type: 'agent',
      action: 'login',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        token,
        type: 'agent',
        createdAt: new Date().toISOString(),
        expiresAt
      }
    });
    return;
  }

  res.status(400).json({ success: false, error: 'Invalid authentication request' });
});

/**
 * GET /api/auth/validate
 * Verify that the current token is valid.
 */
router.get('/validate', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.json({
    success: true,
    data: {
      valid: true,
      keyType: authReq.keyType,
      userUuid: authReq.userUuid,
      permissions: authReq.agentPermissions
    }
  });
});

/**
 * POST /api/auth/revoke
 * Revoke the current session token.
 */
router.post('/revoke', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const hashedKey = hashKey(authReq.apiKey);

  db.prepare(
    'UPDATE api_tokens SET revoked_at = ? WHERE token_hash = ?'
  ).run(new Date().toISOString(), hashedKey);

  audit.log('AUTH_REVOKE', {
    actor: authReq.userUuid,
    actor_type: authReq.keyType,
    action: 'revoke_token',
    outcome: 'success',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.json({ success: true });
});

/**
 * POST /api/auth/lookup
 */
router.post('/lookup', authLimiter, (req, res) => {
  try {
    const { keyHash } = req.body;
    if (!keyHash || typeof keyHash !== 'string' || keyHash.length !== 64 || !/^[0-9a-f]{64}$/.test(keyHash)) {
      res.status(400).json({ error: 'Invalid keyHash format' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash) as any;
    if (!user) {
      res.status(404).json({ error: 'Key not found' });
      return;
    }

    res.json({ uuid: user.uuid, username: user.username, role: user.role });
  } catch (err: any) {
    console.error('[ERROR] /api/auth/lookup:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
