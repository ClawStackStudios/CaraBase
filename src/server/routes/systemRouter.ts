import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { audit } from '../utils/audit.js';
import { triggerBackup, getBackupsList } from '../utils/backup.js';

const router = express.Router();
router.use(requireAuth);

const upload = multer({ dest: 'data/storage' });

// --- Keys ---
router.get('/keys', requireRole('admin'), (req, res) => {
  try {
    const keys = db.prepare(`SELECT id, name, type, created_at, substr(key, 1, 8) || '...' as partial_key FROM _carabase_api_keys`).all();
    res.json(keys);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/keys', requireRole('admin'), (req, res) => {
  const { name, type } = req.body;
  if (!name || (type !== 'public' && type !== 'private')) return res.status(400).json({ error: 'Invalid parameters' });
  const id = uuidv4();
  const prefix = type === 'public' ? 'ls-' : 'ls-p-';
  const key = prefix + crypto.randomBytes(32).toString('hex');
  try {
    db.prepare('INSERT INTO _carabase_api_keys (id, name, key, type) VALUES (?, ?, ?, ?)').run(id, name, key, type);
    res.json({ id, name, type, key });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/keys/:id', requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM _carabase_api_keys WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Policies ---
router.get('/policies', requireRole('admin'), (req, res) => {
    try {
        const policies = db.prepare('SELECT * FROM _carabase_policies').all();
        res.json(policies);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/policies', requireRole('admin'), (req, res) => {
    const { table_name, action, definition } = req.body;
    const id = uuidv4();
    try {
        db.prepare('INSERT INTO _carabase_policies (id, table_name, action, definition) VALUES (?, ?, ?, ?)').run(id, table_name, action, definition);
        res.json({ id, table_name, action, definition });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/policies/:id', requireRole('admin'), (req, res) => {
    try {
        db.prepare('DELETE FROM _carabase_policies WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- Custom Endpoints ---
router.get('/endpoints', requireRole('admin'), (req, res) => {
    try {
        const endpoints = db.prepare('SELECT * FROM _carabase_custom_endpoints ORDER BY created_at DESC').all();
        res.json(endpoints);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/endpoints', requireRole('admin'), (req, res) => {
    const { name, path: endpointPath, method, table_name, schema } = req.body;
    const id = uuidv4();
    try {
        db.prepare('INSERT INTO _carabase_custom_endpoints (id, name, path, method, table_name, schema) VALUES (?, ?, ?, ?, ?, ?)').run(
            id, name, endpointPath, method, table_name, JSON.stringify(schema)
        );

        audit.log('ENDPOINT_CREATED', {
            actor: (req as any).userUuid,
            actor_type: 'human',
            resource: id,
            action: 'create',
            outcome: 'success',
            ip_address: req.ip,
            user_agent: req.headers['user-agent'] || '',
            details: { name, path: endpointPath, method, table_name }
        });

        res.json({ id, name, path: endpointPath, method, table_name, schema });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/endpoints/:id', requireRole('admin'), (req, res) => {
    const { id } = req.params;
    try {
        const endpoint = db.prepare('SELECT * FROM _carabase_custom_endpoints WHERE id = ?').get(id) as any;
        if (endpoint) {
            db.prepare('DELETE FROM _carabase_custom_endpoints WHERE id = ?').run(id);

            audit.log('ENDPOINT_DELETED', {
                actor: (req as any).userUuid,
                actor_type: 'human',
                resource: id,
                action: 'delete',
                outcome: 'success',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'] || '',
                details: { name: endpoint.name, path: endpoint.path, method: endpoint.method }
            });
        }
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// --- Backups ---
router.get('/backups', requireRole('superadmin'), (req, res) => {
  try {
    const backups = getBackupsList();
    res.json({ success: true, data: backups });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/backups/trigger', requireRole('superadmin'), async (req, res) => {
  try {
    const info = await triggerBackup(db);
    res.json({ success: true, data: info });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/backups/download/:filename', requireRole('superadmin'), (req, res) => {
  const filename = req.params.filename;
  if (!filename.startsWith('carabase-backup-') || !filename.endsWith('.sqlite') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid backup file format' });
  }
  const filePath = path.join(process.cwd(), 'data', 'backups', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  res.download(filePath);
});

router.delete('/backups/:filename', requireRole('superadmin'), (req, res) => {
  const filename = req.params.filename;
  if (!filename.startsWith('carabase-backup-') || !filename.endsWith('.sqlite') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid backup file format' });
  }
  const filePath = path.join(process.cwd(), 'data', 'backups', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/backups/import', requireRole('superadmin'), upload.single('db_file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No database file provided' });
    }
    if (!req.file.originalname.endsWith('.sqlite') && !req.file.originalname.endsWith('.db')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Must be a SQLite database file' });
    }
    const activeDbPath = path.join(process.cwd(), 'data', 'carabase.sqlite');
    db.close();
    fs.copyFileSync(req.file.path, activeDbPath);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: 'Database imported. Server restarting...' });
    setTimeout(() => {
      console.log('[CaraBase] Database replaced via import. Restarting process...');
      process.exit(0);
    }, 1000);
  } catch (e: any) {
    console.error('[CaraBase] Import error:', e);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (err) {}
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/query', requireRole('superadmin'), (req, res) => {
    const { query, method = 'all', params = [] } = req.body;
    try {
      const upperQuery = query.trim().toUpperCase();
      if (upperQuery.startsWith('DROP TABLE')) {
        const match = query.match(/DROP TABLE\s+(?:IF EXISTS\s+)?["'`]?(_carabase_[a-zA-Z0-9_]+|sqlite_[a-zA-Z0-9_]+|users)["'`]?/i);
        if (match) {
           return res.status(403).json({ error: 'Modification of core system tables is restricted via raw query API.' });
        }
      }

      if (method === 'run') {
        const result = db.prepare(query).run(...params);
        res.json(result);
      } else {
        const rows = db.prepare(query).all(...params);
        res.json(rows);
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
});

// --- System Operations ---
router.delete('/wipe', requireRole('superadmin'), (req, res) => {
  try {
    const activeDbPath = path.join(process.cwd(), 'data', 'carabase.sqlite');
    const storageDirPath = path.join(process.cwd(), 'data', 'storage');
    db.close();
    if (fs.existsSync(activeDbPath)) fs.unlinkSync(activeDbPath);
    if (fs.existsSync(activeDbPath + '-wal')) fs.unlinkSync(activeDbPath + '-wal');
    if (fs.existsSync(activeDbPath + '-shm')) fs.unlinkSync(activeDbPath + '-shm');
    if (fs.existsSync(storageDirPath)) {
      const files = fs.readdirSync(storageDirPath);
      for (const file of files) {
        if (file !== '.gitkeep') fs.unlinkSync(path.join(storageDirPath, file));
      }
    }
    res.json({ success: true, message: 'Volume wiped. Server restarting...' });
    setTimeout(() => {
      console.log('[CaraBase] Volume wiped. Restarting process to rebuild schema...');
      process.exit(0);
    }, 1000);
  } catch (e: any) {
    console.error('[CaraBase] Wipe error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/settings', requireRole('admin'), (req, res) => {
    try {
        const rows = db.prepare("SELECT key, value FROM system_settings WHERE key IN ('cors_origins', 'api_enabled', 'rate_limit_per_minute')").all() as any[];
        const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
        res.json({ success: true, data: settings });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.patch('/settings', requireRole('admin'), (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Invalid settings payload' });
        }
        const updateSettingsTx = db.transaction((updates: Record<string, string>) => {
            const stmt = db.prepare('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?');
            for (const [key, value] of Object.entries(updates)) {
                if (['cors_origins', 'api_enabled', 'rate_limit_per_minute'].includes(key)) {
                    stmt.run(String(value), key);
                }
            }
        });
        updateSettingsTx(settings);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/audit-logs', requireRole('superadmin'), (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500').all();
        res.json(logs);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
