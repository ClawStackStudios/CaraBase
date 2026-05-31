/**
 * admin.ts — CaraBase©™
 *
 * API Routes for the SuperAdmin Dashboard.
 * Adapted from ClawChives SuperAdmin feature.
 *
 * Maintained by CrustAgent©™
 */

import { Router } from 'express';
import db from '../db.js';
import { requireAdmin, isAdminSessionValid, createAdminSession, destroyAdminSession } from '../middleware/requireAdmin.js';
import { adminAuthLimiter } from '../middleware/adminLimiter.js';
import { timingSafeCompare, hashKey } from '../utils/crypto.js';
import { createAuditLogger } from '../utils/auditLogger.js';
import crypto from 'crypto';
import path from 'path';
import { statSync, existsSync } from 'fs';

const router = Router();
const audit = createAuditLogger(db);

/**
 * POST /api/admin/auth
 * Client SHA-256 hashes the ADMIN_TOKEN, sends the hash.
 * Server hashes its own ADMIN_TOKEN and compares using timing-safe comparison.
 */
router.post('/auth', adminAuthLimiter, (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Token required' });
  }

  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken) {
    return res.status(503).json({ success: false, error: 'Admin panel is not enabled' });
  }

  const expectedHash = crypto.createHash('sha256').update(expectedToken).digest('hex');
  if (timingSafeCompare(token, expectedHash)) {
    const sessionToken = createAdminSession(req);
    res.cookie('cb_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.ENFORCE_HTTPS === 'true',
      sameSite: 'strict',
      maxAge: 20 * 60 * 1000 // 20 minutes
    });

    audit.log('ADMIN_LOGIN', {
      action: 'admin_login',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || '',
      details: { method: 'token' }
    });

    return res.json({ success: true, token: sessionToken });
  }

  audit.log('ADMIN_LOGIN', {
    action: 'admin_login',
    outcome: 'failure',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] || '',
    details: { reason: 'Invalid token' }
  });

  res.status(401).json({ success: false, error: 'Invalid token' });
});

/**
 * GET /api/admin/verify
 * Quiet session validity check (no 401 log spam)
 */
router.get('/verify', (req, res) => {
  const sessionToken = req.cookies?.cb_admin_session || req.headers['x-admin-session'];
  const isValid = isAdminSessionValid(req, sessionToken as string | undefined);
  res.json({ success: isValid });
});

/**
 * POST /api/admin/logout
 */
router.post('/logout', (req, res) => {
  const sessionToken = req.cookies?.cb_admin_session || req.headers['x-admin-session'];
  if (sessionToken) {
    destroyAdminSession(sessionToken as string);
  }
  res.clearCookie('cb_admin_session');
  res.json({ success: true });
});

/**
 * GET /api/admin/users
 * List users with metadata only. No content visibility.
 */
router.get('/users', requireAdmin, (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const users = db.prepare(`
    SELECT 
      u.uuid, 
      u.username, 
      u.created_at,
      (SELECT COUNT(*) FROM agent_keys WHERE user_uuid = u.uuid AND is_active = 1) as active_keys,
      (SELECT MAX(created_at) FROM api_tokens WHERE owner_key = u.uuid AND owner_type = 'human') as last_login
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;

  res.json({ 
    success: true, 
    data: users,
    pagination: {
      total: total.count,
      limit,
      offset
    }
  });
});

/**
 * DELETE /api/admin/users/:uuid
 * Cascade delete user and all their data (atomic transaction).
 */
router.delete('/users/:uuid', requireAdmin, (req, res) => {
  const { uuid } = req.params;

  // Get user info before deletion for audit log
  const user = db.prepare('SELECT username FROM users WHERE uuid = ?').get(uuid) as any;
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  const deleteTx = db.transaction((id: string) => {
    // Cascade cleanup — no FK cascade on all tables
    db.prepare('DELETE FROM agent_keys WHERE user_uuid = ?').run(id);
    db.prepare('DELETE FROM api_tokens WHERE owner_key = ?').run(id);
    const result = db.prepare('DELETE FROM users WHERE uuid = ?').run(id);
    return result.changes;
  });

  try {
    const changes = deleteTx(uuid as string);
    if (changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    audit.log('ADMIN_USER_DELETE', {
      action: 'delete_user',
      outcome: 'success',
      resource: uuid as string,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || '',
      details: { username: user.username, uuid }
    });

    res.json({ success: true, message: `User ${user.username} and all associated data scuttled.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/stats
 * Low-level system performance metrics (Memory, Uptime).
 */
router.get('/stats', requireAdmin, (_req, res) => {
  res.json({
    memory: process.memoryUsage(),
    uptime: Math.floor(process.uptime())
  });
});

/**
 * GET /api/admin/system
 * System health and stats — CaraBase-specific metrics.
 */
router.get('/system', requireAdmin, (_req, res) => {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const mainDbPath = path.join(dataDir, 'carabase.sqlite');

  let dbSize = 0;
  if (existsSync(mainDbPath)) dbSize = statSync(mainDbPath).size;

  // Count user-created tables (exclude system tables)
  const tableCount = db.prepare(`
    SELECT COUNT(*) as count FROM sqlite_schema 
    WHERE type='table' 
    AND name NOT LIKE '_carabase_%' 
    AND name NOT LIKE 'sqlite_%' 
    AND name NOT IN ('users', 'api_tokens', 'agent_keys', 'audit_logs', 'system_settings')
  `).get() as any;

  const stats = {
    totalUsers: (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count,
    totalTables: tableCount.count,
    totalPolicies: (db.prepare('SELECT COUNT(*) as count FROM _carabase_policies').get() as any).count,
    totalEndpoints: (db.prepare('SELECT COUNT(*) as count FROM _carabase_custom_endpoints').get() as any).count,
    dbSize,
    uptime: Math.floor(process.uptime()),
    lastAudit: (db.prepare('SELECT timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 1').get() as any)?.timestamp || null
  };

  res.json({ success: true, data: stats });
});

/**
 * GET /api/admin/audit
 * Query audit logs with filtering and pagination.
 */
router.get('/audit', requireAdmin, (req, res) => {
  const { event_type, actor, outcome, limit = 50, offset = 0 } = req.query;
  
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (event_type) { sql += ' AND event_type = ?'; params.push(event_type); }
  if (actor)      { sql += ' AND actor = ?';      params.push(actor); }
  if (outcome)    { sql += ' AND outcome = ?';    params.push(outcome); }

  // Count total matching records for pagination
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params) as any;

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const logs = db.prepare(sql).all(...params);

  res.json({ 
    success: true, 
    data: logs,
    pagination: {
      total: total.count,
      limit: Number(limit),
      offset: Number(offset)
    }
  });
});

/**
 * GET /api/admin/settings
 * Fetch global system settings from key-value store.
 */
router.get('/settings', requireAdmin, (_req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all() as any[];
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/settings
 * Upsert global system settings.
 */
router.patch('/settings', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid settings payload' });
  }

  const now = new Date().toISOString();
  try {
    const updateStmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        updateStmt.run(key, String(value), now);
      }
    })();
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/uptime
 * Compute historical uptime sessions from audit log events.
 */
router.get('/uptime', requireAdmin, (_req, res) => {
  try {
    const events = db.prepare(`
      SELECT timestamp, event_type, details 
      FROM audit_logs 
      WHERE event_type IN ('SYSTEM_START', 'SYSTEM_SHUTDOWN')
      ORDER BY timestamp ASC
    `).all() as any[];

    const sessions: Array<{ id: string, start: string, end: string | null, duration: number | null }> = [];
    let currentSession: any = null;

    for (const event of events) {
      const details = JSON.parse(event.details || '{}');
      const sessionId = details.session_id;

      if (event.event_type === 'SYSTEM_START') {
        if (currentSession) {
          sessions.unshift(currentSession);
        }
        currentSession = { id: sessionId, start: event.timestamp, end: null, duration: null };
      } else if (event.event_type === 'SYSTEM_SHUTDOWN') {
        if (currentSession && currentSession.id === sessionId) {
          currentSession.end = event.timestamp;
          currentSession.duration = Math.floor((new Date(currentSession.end).getTime() - new Date(currentSession.start).getTime()) / 1000);
          sessions.unshift(currentSession);
          currentSession = null;
        }
      }
    }

    // Push the currently active session (if any)
    if (currentSession) {
      currentSession.duration = Math.floor((Date.now() - new Date(currentSession.start).getTime()) / 1000);
      sessions.unshift(currentSession);
    }

    res.json({ success: true, data: sessions });
  } catch (err: any) {
    console.error('[Uptime] Failed to fetch uptime history:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch uptime history' });
  }
});

export default router;
