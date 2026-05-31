import { Router } from 'express';
import db from '../db.js';
import { createAuditLogger } from '../utils/auditLogger.js';
import { generateId, generateString, hashKey } from '../utils/crypto.js';
import { calculateExpiry } from '../utils/tokenExpiry.js';
import { requireAuth, requireHuman, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AgentKeySchemas } from '../validation/schemas.js';

const router = Router();
const audit = createAuditLogger(db);

/**
 * GET /api/agent-keys
 */
router.get('/', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const rows = db.prepare(
    'SELECT id, name, description, permissions, is_active, created_at, last_used, expiration_date, rate_limit FROM agent_keys WHERE user_uuid = ? ORDER BY created_at DESC'
  ).all(authReq.userUuid) as any[];

  res.json({
    success: true,
    data: rows.map(row => ({
      ...row,
      permissions: JSON.parse(row.permissions || '{}')
    }))
  });
});

/**
 * POST /api/agent-keys
 */
router.post(
  '/',
  requireAuth,
  requireHuman,
  validateBody(AgentKeySchemas.create),
  (req, res) => {
    const authReq = req as AuthRequest;
    const { name, description, permissions, expirationType, rateLimit } = req.body;

    let expDate = null;
    if (expirationType && expirationType !== 'never') {
      expDate = calculateExpiry(expirationType);
    }

    const plainKey = `lb-${generateString(64)}`;
    const hashedKey = hashKey(plainKey);

    const keyData = {
      id: generateId(),
      user_uuid: authReq.userUuid,
      name,
      description: description || null,
      api_key_hash: hashedKey,
      permissions: JSON.stringify(permissions || {}),
      expiration_type: expirationType || 'never',
      expiration_date: expDate,
      rate_limit: rateLimit || null,
      is_active: 1,
      created_at: new Date().toISOString(),
      last_used: null
    };

    const insertKey = db.transaction(() => {
      const dup = db.prepare(
        'SELECT id FROM agent_keys WHERE name = ? AND is_active = 1 AND user_uuid = ?'
      ).get(name, authReq.userUuid);

      if (dup) {
        throw new Error('DUPLICATE_NAME');
      }

      db.prepare(
        `INSERT INTO agent_keys (
          id, user_uuid, name, description, api_key_hash, permissions,
          expiration_type, expiration_date, rate_limit, is_active, created_at, last_used
        ) VALUES (
          @id, @user_uuid, @name, @description, @api_key_hash, @permissions,
          @expiration_type, @expiration_date, @rate_limit, @is_active, @created_at, @last_used
        )`
      ).run(keyData);
    });

    try {
      insertKey.immediate();
    } catch (err: any) {
      if (err.message === 'DUPLICATE_NAME') {
        res.status(409).json({
          success: false,
          error: `An active agent key named "${name}" already exists`
        });
        return;
      }
      throw err;
    }

    audit.log('AGENT_KEY_CREATED', {
      actor: authReq.userUuid,
      actor_type: 'human',
      resource: keyData.id,
      action: 'create',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string,
      details: { name: keyData.name }
    });

    res.status(201).json({
      success: true,
      data: {
        id: keyData.id,
        name: keyData.name,
        description: keyData.description,
        key: plainKey,
        api_key: plainKey,
        permissions: permissions || {},
        expiration_date: keyData.expiration_date,
        rate_limit: keyData.rate_limit,
        is_active: keyData.is_active,
        created_at: keyData.created_at,
        last_used: keyData.last_used
      }
    });
  }
);

/**
 * PATCH /api/agent-keys/:id/revoke
 */
router.patch('/:id/revoke', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const now = new Date().toISOString();

  const info = db.prepare(
    'UPDATE agent_keys SET is_active = 0, revoked_at = ?, revoked_by = ? WHERE id = ? AND user_uuid = ?'
  ).run(now, authReq.userUuid, req.params.id, authReq.userUuid);

  if (info.changes === 0) {
    res.status(404).json({ success: false, error: 'Agent key not found' });
    return;
  }

  audit.log('AGENT_KEY_REVOKED', {
    actor: authReq.userUuid,
    actor_type: 'human',
    resource: req.params.id,
    action: 'revoke',
    outcome: 'success',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.json({ success: true });
});

/**
 * DELETE /api/agent-keys/:id
 */
router.delete('/:id', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;

  const info = db.prepare(
    'DELETE FROM agent_keys WHERE id = ? AND user_uuid = ?'
  ).run(req.params.id, authReq.userUuid);

  if (info.changes === 0) {
    res.status(404).json({ success: false, error: 'Agent key not found' });
    return;
  }

  audit.log('AGENT_KEY_DELETED', {
    actor: authReq.userUuid,
    actor_type: 'human',
    resource: req.params.id,
    action: 'delete',
    outcome: 'success',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.json({ success: true });
});

export default router;
