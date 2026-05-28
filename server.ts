import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';

// Use the new db and auth router
import db, { rlsContext } from './src/server/db.js';
import authRouter from './src/server/routes/auth.js';
import agentKeysRouter from './src/server/routes/agentKeys.js';
import adminRouter from './src/server/routes/admin.js';
import { createAuditLogger } from './src/server/utils/auditLogger.js';
import { requireAuth } from './src/server/middleware/auth.js';
import { requireRole } from './src/server/middleware/requireRole.js';
import { globalLimiter } from './src/server/middleware/globalLimiter.js';
import { triggerBackup, getBackupsList, startBackupSchedule } from './src/server/utils/backup.js';
import { getCorsConfig } from './src/server/config/corsConfig.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const realtimeEmitter = new EventEmitter();

async function startServer() {
  const audit = createAuditLogger(db);
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  // --- Security Middleware ---
  app.use(helmet({
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    xssFilter: true,
    noSniff: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        frameAncestors: isProduction ? ["'self'"] : ["'self'", "*"],
        upgradeInsecureRequests: process.env.ENFORCE_HTTPS === 'true' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    frameguard: { action: 'sameorigin' },
  }));

  app.use(globalLimiter);

  app.use(cors(getCorsConfig()));
  app.use(express.json());
  app.use(cookieParser());

  // Ensure directories exist
  const dataDir = path.join(process.cwd(), 'data');
  const storageDir = path.join(dataDir, 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const storageOptions = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, storageDir) },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, uuidv4() + ext);
    }
  });
  const upload = multer({ storage: storageOptions });

  // --- Core API Routes ---
  app.get('/api/health', (req, res) => res.json({ 
    status: 'ok',
    tunnelUrl: process.env.CLOUDFLARE_TUNNEL_URL || null
  }));
  app.get('/api/info', (req, res) => res.json({ name: 'CaraBase', version: '2.0.0' }));

  // Sandboxing middleware to protect internal routes from agent keys
  const sandboxAgentKeys = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // If the request has an agent keytype, forbid access to these internal routes
    if ((req as any).keyType === 'agent') {
       return res.status(403).json({ error: 'Forbidden: LobsterKeys are strictly sandboxed from system and admin routes.' });
    }
    next();
  };

  // --- Mount Auth & Agent Key Routers ---
  app.use('/api/auth', authRouter);
  app.use('/api/agent-keys', agentKeysRouter);
  app.use('/api/admin', adminRouter);

  // --- System API: Internal dashboard management ---
  const systemApi = express.Router();
  systemApi.use(requireAuth, sandboxAgentKeys);

  systemApi.get('/telemetry', requireRole('superadmin'), (req, res) => {
    try {
      const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
      const mainDbPath = path.join(dataDir, 'carabase.sqlite');

      let dbSize = 0;
      if (fs.existsSync(mainDbPath)) dbSize = fs.statSync(mainDbPath).size;

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
        uptime: process.uptime(),
        lastAudit: (db.prepare('SELECT timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 1').get() as any)?.timestamp || null
      };

      res.json({ success: true, data: stats });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  systemApi.get('/backups', requireRole('superadmin'), (req, res) => {
    try {
      const backups = getBackupsList();
      res.json({ success: true, data: backups });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  systemApi.post('/backups/trigger', requireRole('superadmin'), async (req, res) => {
    try {
      const info = await triggerBackup(db);
      res.json({ success: true, data: info });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  systemApi.get('/backups/download/:filename', requireRole('superadmin'), (req, res) => {
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

  systemApi.delete('/backups/:filename', requireRole('superadmin'), (req, res) => {
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

  systemApi.post('/backups/import', requireRole('superadmin'), upload.single('db_file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No database file provided' });
      }

      // Quick sanity check - must be a sqlite file
      if (!req.file.originalname.endsWith('.sqlite') && !req.file.originalname.endsWith('.db')) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, error: 'Must be a SQLite database file' });
      }

      const activeDbPath = path.join(process.cwd(), 'data', 'carabase.sqlite');

      // 1. Close active DB connection to prevent WAL corruption
      db.close();

      // 2. Overwrite the active DB with the uploaded file
      fs.copyFileSync(req.file.path, activeDbPath);

      // 3. Delete the uploaded temp file
      fs.unlinkSync(req.file.path);

      // We respond before shutting down so the client knows it worked
      res.json({ success: true, message: 'Database imported. Server restarting...' });

      // 4. Force server restart to load the new database cleanly
      setTimeout(() => {
        console.log('[CaraBase] Database replaced via import. Restarting process...');
        process.exit(0);
      }, 1000);
      
    } catch (e: any) {
      console.error('[CaraBase] Import error:', e);
      // Try to clean up
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (err) {}
      }
      res.status(500).json({ success: false, error: e.message });
    }
  });

  systemApi.delete('/wipe', requireRole('superadmin'), (req, res) => {
    try {
      const activeDbPath = path.join(process.cwd(), 'data', 'carabase.sqlite');
      const storageDirPath = path.join(process.cwd(), 'data', 'storage');

      // 1. Close DB connection
      db.close();

      // 2. Delete database file(s)
      if (fs.existsSync(activeDbPath)) {
        fs.unlinkSync(activeDbPath);
      }
      const walPath = activeDbPath + '-wal';
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
      }
      const shmPath = activeDbPath + '-shm';
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath);
      }

      // 3. Delete storage files
      if (fs.existsSync(storageDirPath)) {
        const files = fs.readdirSync(storageDirPath);
        for (const file of files) {
          if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(storageDirPath, file));
          }
        }
      }

      res.json({ success: true, message: 'Volume wiped. Server restarting...' });

      // 4. Force restart
      setTimeout(() => {
        console.log('[CaraBase] Volume wiped. Restarting process to rebuild schema...');
        process.exit(0);
      }, 1000);

    } catch (e: any) {
      console.error('[CaraBase] Wipe error:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });


  systemApi.get('/indexes', (req, res) => {
    try {
      const indexes = db.prepare(`
        SELECT name, tbl_name as tableName, sql 
        FROM sqlite_schema 
        WHERE type='index' AND sql IS NOT NULL AND tbl_name NOT LIKE '_carabase_%' AND tbl_name NOT LIKE 'sqlite_%' AND tbl_name NOT IN ('users', 'api_tokens', 'agent_keys', 'audit_logs')
      `).all();
      res.json(indexes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.get('/tables', (req, res) => {
    try {
      const tables = db.prepare(`
        SELECT name FROM sqlite_schema 
        WHERE type='table' AND name NOT LIKE '_carabase_%' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('users', 'api_tokens', 'agent_keys', 'audit_logs');
      `).all();
      res.json(tables);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/tables', requireRole('admin'), (req, res) => {
    const { tableName, columns } = req.body;
    if (!tableName || !Array.isArray(columns)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const safeIdent = (str: string) => str.replace(/[^a-zA-Z0-9_]/g, '');
    const safeTable = safeIdent(tableName);
    if (!safeTable) return res.status(400).json({ error: 'Invalid table name' });

    let colsDef = columns.map(c => {
      const name = safeIdent(c.name);
      let def = `${name} ${c.type || 'TEXT'}`;
      if (c.primaryKey) def += ' PRIMARY KEY';
      if (c.unique) def += ' UNIQUE';
      if (!c.nullable && !c.primaryKey) def += ' NOT NULL';
      if (c.defaultValue) def += ` DEFAULT '${c.defaultValue.replace(/'/g, "''")}'`;
      return def;
    }).join(', ');

    try {
      db.exec(`CREATE TABLE ${safeTable} (${colsDef})`);
      res.json({ success: true, table: safeTable });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.get('/tables/:name/columns', (req, res) => {
    const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const columns = db.prepare(`PRAGMA table_info(${safeTable})`).all();
      res.json(columns);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.get('/tables/:name/schema', (req, res) => {
    const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const columns = db.prepare(`PRAGMA table_info(${safeTable})`).all();
      res.json(columns);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---- Advanced Schema Features (Task 14) ----
  systemApi.get('/tables/:name/indexes', (req, res) => {
    const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const indexes = db.prepare(`PRAGMA index_list(${safeTable})`).all() as any[];
      // Fetch index columns info
      for (let idx of indexes) {
         idx.columns = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
      }
      res.json(indexes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/tables/:name/indexes', requireRole('admin'), (req, res) => {
    const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    const { indexName, columnName, isUnique } = req.body;
    if (!indexName || !columnName) return res.status(400).json({ error: 'Missing indexName or columnName' });
    
    const safeIndex = indexName.replace(/[^a-zA-Z0-9_]/g, '');
    const safeCol = columnName.replace(/[^a-zA-Z0-9_]/g, '');
    const uniqueStr = isUnique ? 'UNIQUE' : '';
    
    try {
      db.exec(`CREATE ${uniqueStr} INDEX ${safeIndex} ON ${safeTable} (${safeCol})`);
      res.json({ success: true, message: `Index ${safeIndex} created` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.delete('/tables/:name/indexes/:indexName', requireRole('admin'), (req, res) => {
    const safeIndex = req.params.indexName.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      db.exec(`DROP INDEX ${safeIndex}`);
      res.json({ success: true, message: `Index ${safeIndex} dropped` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.get('/tables/:name/foreign_keys', (req, res) => {
    const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const fks = db.prepare(`PRAGMA foreign_key_list(${safeTable})`).all();
      res.json(fks);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/tables/:name/fk', requireRole('admin'), (req, res) => {
    const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    const { localColumn, foreignTable, foreignColumn, onDelete = 'RESTRICT', onUpdate = 'RESTRICT' } = req.body;
    
    if (!localColumn || !foreignTable || !foreignColumn) {
      return res.status(400).json({ error: 'Missing FK configuration' });
    }
    
    const safeLocalCol = localColumn.replace(/[^a-zA-Z0-9_]/g, '');
    const safeForeignTab = foreignTable.replace(/[^a-zA-Z0-9_]/g, '');
    const safeForeignCol = foreignColumn.replace(/[^a-zA-Z0-9_]/g, '');

    const validActions = ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT'];
    const safeOnDelete = validActions.includes(onDelete) ? onDelete : 'RESTRICT';
    const safeOnUpdate = validActions.includes(onUpdate) ? onUpdate : 'RESTRICT';

    try {
      const schemaRow = db.prepare(`SELECT sql FROM sqlite_schema WHERE type='table' AND name=?`).get(safeTable) as any;
      if (!schemaRow || !schemaRow.sql) {
         return res.status(404).json({ error: 'Table schema not found' });
      }
      
      const currentSql: string = schemaRow.sql;
      const lastParenIndex = currentSql.lastIndexOf(')');
      if (lastParenIndex === -1) {
         return res.status(500).json({ error: 'Could not parse table schema' });
      }
      
      const fkConstraint = `, FOREIGN KEY ("${safeLocalCol}") REFERENCES "${safeForeignTab}"("${safeForeignCol}") ON DELETE ${safeOnDelete} ON UPDATE ${safeOnUpdate}`;
      
      let newTableSql = currentSql.substring(0, lastParenIndex) + fkConstraint + currentSql.substring(lastParenIndex);
      
      const tmpTable = `__carabase_tmp_${Date.now()}`;
      newTableSql = newTableSql.replace(new RegExp(`CREATE TABLE (\\w+|"${safeTable}")`, 'i'), `CREATE TABLE ${tmpTable}`);

      db.exec('PRAGMA foreign_keys=off;');
      const migrate = db.transaction(() => {
         db.exec(newTableSql);
         db.exec(`INSERT INTO ${tmpTable} SELECT * FROM ${safeTable}`);
         db.exec(`DROP TABLE ${safeTable}`);
         db.exec(`ALTER TABLE ${tmpTable} RENAME TO ${safeTable}`);
         
         const violations = db.prepare('PRAGMA foreign_key_check').all();
         if (violations.length > 0) {
            throw new Error('Foreign key constraint violation in existing data');
         }
      });
      
      migrate();
      db.exec('PRAGMA foreign_keys=on;');
      
      res.json({ success: true, message: 'Foreign Key added successfully' });
    } catch (e: any) {
      db.exec('PRAGMA foreign_keys=on;'); 
      res.status(500).json({ error: e.message });
    }
  });

  // ---- Advanced Schema Features (Task 15: Views & Triggers) ----
  systemApi.get('/views', requireRole('admin'), (req, res) => {
    try {
      const views = db.prepare(`SELECT name, sql FROM sqlite_schema WHERE type='view' AND name NOT LIKE 'sqlite_%'`).all();
      res.json(views);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/views', requireRole('admin'), (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query is required' });
    
    // Security validation: ensure it's actually a CREATE VIEW statement
    const trimmed = query.trim().toUpperCase();
    if (!trimmed.startsWith('CREATE VIEW') && !trimmed.startsWith('CREATE TEMPORARY VIEW') && !trimmed.startsWith('CREATE TEMP VIEW')) {
      return res.status(400).json({ error: 'Only CREATE VIEW statements are allowed here' });
    }

    try {
      db.exec(query);
      res.json({ success: true, message: 'View created successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.delete('/views/:name', requireRole('admin'), (req, res) => {
    const safeName = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      db.exec(`DROP VIEW IF EXISTS "${safeName}"`);
      res.json({ success: true, message: `View ${safeName} dropped` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.get('/triggers', requireRole('admin'), (req, res) => {
    try {
      const triggers = db.prepare(`SELECT name, sql FROM sqlite_schema WHERE type='trigger' AND name NOT LIKE 'sqlite_%'`).all();
      res.json(triggers);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/triggers', requireRole('admin'), (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query is required' });
    
    // Security validation: ensure it's actually a CREATE TRIGGER statement
    const trimmed = query.trim().toUpperCase();
    if (!trimmed.startsWith('CREATE TRIGGER') && !trimmed.startsWith('CREATE TEMPORARY TRIGGER') && !trimmed.startsWith('CREATE TEMP TRIGGER')) {
      return res.status(400).json({ error: 'Only CREATE TRIGGER statements are allowed here' });
    }

    try {
      db.exec(query);
      res.json({ success: true, message: 'Trigger created successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.delete('/triggers/:name', requireRole('admin'), (req, res) => {
    const safeName = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
    try {
      db.exec(`DROP TRIGGER IF EXISTS "${safeName}"`);
      res.json({ success: true, message: `Trigger ${safeName} dropped` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/query', requireRole('superadmin'), (req, res) => {
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

  systemApi.get('/tables/:name/rows', (req, res) => {
      const safeTable = req.params.name.replace(/[^a-zA-Z0-9_]/g, '');
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      try {
          const rows = db.prepare(`SELECT * FROM ${safeTable} LIMIT ? OFFSET ?`).all(limit, offset);
          res.json(rows);
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  // legacy API mapping mostly replacing DB calls
  systemApi.get('/keys', requireRole('admin'), (req, res) => {
    try {
      const keys = db.prepare(`SELECT id, name, type, created_at, substr(key, 1, 8) || '...' as partial_key FROM _carabase_api_keys`).all();
      res.json(keys);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  systemApi.post('/keys', requireRole('admin'), (req, res) => {
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

  systemApi.delete('/keys/:id', requireRole('admin'), (req, res) => {
    try {
      db.prepare('DELETE FROM _carabase_api_keys WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const authenticateDataApi = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let legacyKey = (req.headers['apikey'] as string) || (req.query.apikey as string);
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.startsWith('ls-p-') || token.startsWith('ls-') || token.startsWith('pk_')) {
        legacyKey = token;
      }
    }

    if (legacyKey) {
      // Legacy _carabase_api_keys auth
      try {
        const apiKeyRow = db.prepare('SELECT * FROM _carabase_api_keys WHERE key = ?').get(legacyKey) as any;
        if (!apiKeyRow) {
           return res.status(401).json({ error: 'Invalid Legacy API Key' });
        }
        (req as any).apiKey = apiKeyRow;
        return next();
      } catch (e: any) {
        return res.status(500).json({ error: 'Authentication Error: ' + e.message });
      }
    }

    // Modern ClawChives Auth (hu-, lb-, api-)
    requireAuth(req, res, () => {
      // After requireAuth succeeds, map AuthRequest properties to the format externalApi expects
      const authReq = req as AuthRequest;
      (req as any).userUuid = authReq.userUuid;
      (req as any).username = authReq.username;
      
      // We synthesize an apiKey object so applyRls can check for bypasses
      let isPrivate = false;
      if (authReq.role === 'superadmin' || authReq.role === 'admin' || authReq.agentPermissions?.level === 'full') {
         isPrivate = true;
      }
      
      (req as any).apiKey = { 
        type: isPrivate ? 'private' : 'public',
        _isModern: true,
        role: authReq.role,
        permissions: authReq.agentPermissions
      };
      
      next();
    });
  };

  const validateTargetTable = (req: express.Request, res: express.Response, next: express.NextFunction) => {
     const table = req.params.table;
     if (!table || table.startsWith('_carabase_') || table.startsWith('sqlite_') || ['users', 'api_tokens', 'agent_keys', 'audit_logs'].includes(table)) {
          return res.status(403).json({ error: 'Forbidden table' });
     }
     (req as any).safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');
     next();
  }

  const applyRls = (table: string, action: string, req: express.Request) => {
      const policies = db.prepare("SELECT * FROM _carabase_policies WHERE table_name = ? AND (action = ? OR action = 'ALL')").all(table, action);
      const apiKey = (req as any).apiKey;
      if (apiKey.type === 'private') return '1=1';
      if (policies.length === 0) return '0=1';
      return '(' + policies.map((p: any) => '(' + p.definition + ')').join(' OR ') + ')';
  }

  // Parse custom filters (supporting standard and eq. syntax)
  const parseQueryFilters = (query: any) => {
    const filters: string[] = [];
    const values: any[] = [];
    for (const key of Object.keys(query)) {
      if (key === 'apikey' || key === 'limit' || key === 'offset' || key === 'order_by' || key === 'dir') continue;
      const val = query[key];
      if (typeof val === 'string') {
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (val.startsWith('eq.')) {
          filters.push(`${cleanKey} = ?`);
          values.push(val.substring(3));
        } else {
          filters.push(`${cleanKey} = ?`);
          values.push(val);
        }
      }
    }
    return {
      whereClause: filters.length > 0 ? filters.join(' AND ') : '1=1',
      values
    };
  };

  // SDK / Public API Middleware: Kill Switch & Rate Limiter
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  
  const publicApiGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const settingsRows = db.prepare("SELECT key, value FROM system_settings WHERE key IN ('api_enabled', 'rate_limit_per_minute')").all() as any[];
      const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});

      if (settings.api_enabled === 'false') {
        return res.status(503).json({ error: 'Data API is currently disabled by administrator.' });
      }

      const limit = parseInt(settings.rate_limit_per_minute, 10);
      if (limit > 0) {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        let record = rateLimitMap.get(ip);
        
        if (!record || now > record.resetTime) {
          record = { count: 0, resetTime: now + 60000 };
        }

        if (record.count >= limit) {
          res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
          return res.status(429).json({ error: 'Too Many Requests' });
        }

        record.count++;
        rateLimitMap.set(ip, record);

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
      }

      next();
    } catch (e: any) {
      console.error('[Public API Guard] Error:', e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const externalApi = express.Router();
  externalApi.use(authenticateDataApi);

  // Dynamic REST API Generator Catch-all Interceptor Router
  externalApi.all('/custom/:path(*)', async (req, res) => {
      const path = req.params.path;
      const method = req.method.toUpperCase();

      try {
          const endpoint = db.prepare('SELECT * FROM _carabase_custom_endpoints WHERE path = ? AND method = ?').get(path, method) as any;
          if (!endpoint) {
              return res.status(404).json({ error: `Custom endpoint not found for path: /custom/${path} and method: ${method}` });
          }

          const schema = JSON.parse(endpoint.schema);
          const table = endpoint.table_name;

          // Strict Regex Validation for Dynamic SQL injection prevention
          if (!/^[a-zA-Z0-9_]+$/.test(table)) {
              return res.status(400).json({ error: 'Invalid table name pattern in endpoint configuration.' });
          }

          // 1. Validate request body against builder parameters (POST / PATCH / PUT)
          if (['POST', 'PATCH', 'PUT'].includes(method)) {
              if (schema.validation && Array.isArray(schema.validation)) {
                  for (const rule of schema.validation) {
                      const val = req.body[rule.field];
                      if (rule.required && (val === undefined || val === null || val === '')) {
                          return res.status(400).json({ error: `Field '${rule.field}' is required` });
                      }
                      if (val !== undefined && val !== null) {
                          if (rule.type === 'number' && isNaN(Number(val))) {
                              return res.status(400).json({ error: `Field '${rule.field}' must be a number` });
                          }
                          if (rule.type === 'boolean' && typeof val !== 'boolean' && val !== 'true' && val !== 'false' && val !== 1 && val !== 0) {
                              return res.status(400).json({ error: `Field '${rule.field}' must be a boolean` });
                          }
                      }
                  }
              }
          }

          // 2. Process dynamic DB operations
          if (method === 'GET') {
              let columnsList = '*';
              if (schema.columns && Array.isArray(schema.columns) && schema.columns.length > 0) {
                  columnsList = schema.columns.map((c: string) => c.replace(/[^a-zA-Z0-9_]/g, '')).join(', ');
              }

              const rlsSelectFilter = applyRls(table, 'SELECT', req);
              const { whereClause: queryWhere, values: queryValues } = parseQueryFilters(req.query);

              // Pre-configured static builder filter rules
              let staticWhere = '1=1';
              const staticValues: any[] = [];
              if (schema.filters && Array.isArray(schema.filters)) {
                  for (const f of schema.filters) {
                      if (f.field && f.operator && f.value !== undefined) {
                          const cleanField = f.field.replace(/[^a-zA-Z0-9_]/g, '');
                          const op = f.operator.toUpperCase();
                          if (['=', '!=', '>', '<', '>=', '<=', 'LIKE'].includes(op)) {
                              staticWhere += ` AND ${cleanField} ${op} ?`;
                              staticValues.push(f.value);
                          }
                      }
                  }
              }

              const combinedWhere = `(${rlsSelectFilter}) AND (${queryWhere}) AND (${staticWhere})`;
              const allValues = [...queryValues, ...staticValues];

              // Pagination options
              let paginationSql = '';
              if (schema.pagination) {
                  const limit = parseInt(req.query.limit as string) || schema.defaultLimit || 10;
                  const offset = parseInt(req.query.offset as string) || 0;
                  paginationSql = ' LIMIT ? OFFSET ?';
                  allValues.push(limit, offset);
              }

              // Sorting options
              let sortingSql = '';
              if (schema.sorting) {
                  const orderBy = (req.query.order_by as string) || schema.defaultSortField;
                  if (orderBy) {
                      const dir = ((req.query.dir as string) || schema.defaultSortDir || 'ASC').toUpperCase();
                      const cleanOrderBy = orderBy.replace(/[^a-zA-Z0-9_]/g, '');
                      if (['ASC', 'DESC'].includes(dir)) {
                          sortingSql = ` ORDER BY ${cleanOrderBy} ${dir}`;
                      }
                  }
              }

              const sql = `SELECT ${columnsList} FROM ${table} WHERE ${combinedWhere}${sortingSql}${paginationSql}`;
              const rows = db.prepare(sql).all(...allValues);
              return res.json(rows);

          } else if (method === 'POST') {
              const body = req.body;
              const fields = Object.keys(body).filter(k => k !== 'id');
              const cleanFields = fields.map(f => f.replace(/[^a-zA-Z0-9_]/g, ''));
              const placeholders = fields.map(() => '?').join(', ');
              const values = fields.map(f => body[f]);

              if (cleanFields.length === 0) {
                  return res.status(400).json({ error: 'No fields provided for insertion' });
              }

              const rlsInsertFilter = applyRls(table, 'INSERT', req);
              const id = uuidv4();

              db.transaction(() => {
                  db.prepare(`INSERT INTO ${table} (id, ${cleanFields.join(', ')}) VALUES (?, ${placeholders})`).run(id, ...values);
                  const check = db.prepare(`SELECT 1 FROM ${table} WHERE id = ? AND (${rlsInsertFilter})`).get(id);
                  if (!check) {
                      throw new Error('RLS_VIOLATION');
                  }
              })();

              const insertedRow = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);

              audit.log('CUSTOM_ENDPOINT_POST', {
                  actor: (req as any).userUuid || 'anonymous',
                  actor_type: (req as any).userUuid ? 'human' : 'anonymous',
                  resource: `${table}/${id}`,
                  action: 'insert',
                  outcome: 'success',
                  ip_address: req.ip,
                  user_agent: req.headers['user-agent'] || '',
                  details: { endpoint: path, table }
              });

              return res.status(201).json(insertedRow);

          } else if (method === 'PATCH' || method === 'PUT') {
              const body = req.body;
              const fields = Object.keys(body).filter(k => k !== 'id');
              const cleanFields = fields.map(f => f.replace(/[^a-zA-Z0-9_]/g, ''));
              const values = fields.map(f => body[f]);

              if (cleanFields.length === 0) {
                  return res.status(400).json({ error: 'No fields provided for update' });
              }

              const rlsSelectFilter = applyRls(table, 'SELECT', req);
              const rlsUpdateFilter = applyRls(table, 'UPDATE', req);

              const { whereClause: queryWhere, values: queryValues } = parseQueryFilters(req.query);
              const combinedWhere = `(${rlsSelectFilter}) AND (${queryWhere})`;

              const targets = db.prepare(`SELECT id FROM ${table} WHERE ${combinedWhere}`).all(...queryValues);
              if (targets.length === 0) {
                  return res.json({ updated: 0 });
              }

              db.transaction(() => {
                  const setClause = cleanFields.map(f => `${f} = ?`).join(', ');
                  for (const target of targets as any[]) {
                      db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, target.id);
                      const check = db.prepare(`SELECT 1 FROM ${table} WHERE id = ? AND (${rlsUpdateFilter})`).get(target.id);
                      if (!check) {
                          throw new Error('RLS_VIOLATION');
                      }
                  }
              })();

              audit.log('CUSTOM_ENDPOINT_PATCH', {
                  actor: (req as any).userUuid || 'anonymous',
                  actor_type: (req as any).userUuid ? 'human' : 'anonymous',
                  resource: `${table}`,
                  action: 'update',
                  outcome: 'success',
                  ip_address: req.ip,
                  user_agent: req.headers['user-agent'] || '',
                  details: { endpoint: path, table, affected_count: targets.length }
              });

              return res.json({ updated: targets.length });

          } else if (method === 'DELETE') {
              const rlsSelectFilter = applyRls(table, 'SELECT', req);
              const rlsDeleteFilter = applyRls(table, 'DELETE', req);

              const { whereClause: queryWhere, values: queryValues } = parseQueryFilters(req.query);
              const combinedWhere = `(${rlsSelectFilter}) AND (${rlsDeleteFilter}) AND (${queryWhere})`;

              const targets = db.prepare(`SELECT id FROM ${table} WHERE ${combinedWhere}`).all(...queryValues);
              if (targets.length === 0) {
                  return res.json({ deleted: 0 });
              }

              db.transaction(() => {
                  for (const target of targets as any[]) {
                      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(target.id);
                  }
              })();

              audit.log('CUSTOM_ENDPOINT_DELETE', {
                  actor: (req as any).userUuid || 'anonymous',
                  actor_type: (req as any).userUuid ? 'human' : 'anonymous',
                  resource: `${table}`,
                  action: 'delete',
                  outcome: 'success',
                  ip_address: req.ip,
                  user_agent: req.headers['user-agent'] || '',
                  details: { endpoint: path, table, affected_count: targets.length }
              });

              return res.json({ deleted: targets.length });
          }

      } catch (e: any) {
          if (e.message === 'RLS_VIOLATION') {
              return res.status(403).json({ error: 'Row-Level Security policy violation' });
          }
          res.status(500).json({ error: e.message });
      }
  });

  externalApi.get('/:table', validateTargetTable, (req, res) => {
      const table = (req as any).safeTable;
      const rlsFilter = applyRls(table, 'SELECT', req);
      const isSSE = req.headers.accept && req.headers.accept.includes('text/event-stream');

      if (isSSE) {
          if (rlsFilter === '0=1') return res.status(403).json({ error: 'Violates row-level security policy' });
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();
          res.write(`data: ${JSON.stringify({ type: 'connected', table })}\n\n`);

          const listener = (eventData: any) => res.write(`data: ${JSON.stringify(eventData)}\n\n`);
          const eventName = `table_change_${table}`;
          realtimeEmitter.on(eventName, listener);
          req.on('close', () => realtimeEmitter.off(eventName, listener));
      } else {
          try {
              rlsContext.run({ userUuid: (req as any).userUuid || null, username: (req as any).username || null }, () => {
                  const { whereClause: queryWhere, values: queryValues } = parseQueryFilters(req.query);
                  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : null;
                  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : null;
                  const order_by = req.query.order_by ? String(req.query.order_by).replace(/[^a-zA-Z0-9_]/g, '') : null;
                  const dir = req.query.dir && String(req.query.dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

                  let sql = `SELECT * FROM ${table} WHERE (${rlsFilter}) AND (${queryWhere})`;
                  const params = [...queryValues];

                  if (order_by) {
                      sql += ` ORDER BY ${order_by} ${dir}`;
                  }

                  if (limit !== null && !isNaN(limit)) {
                      sql += ` LIMIT ?`;
                      params.push(limit);
                      if (offset !== null && !isNaN(offset)) {
                          sql += ` OFFSET ?`;
                          params.push(offset);
                      }
                  }

                  const rows = db.prepare(sql).all(...params);
                  res.json(rows);
              });
          } catch (e: any) {
              res.status(500).json({ error: e.message });
          }
      }
  });

  externalApi.post('/:table', validateTargetTable, (req, res) => {
      const table = (req as any).safeTable;
      const rlsFilter = applyRls(table, 'INSERT', req);
      
      const data = req.body;
      const keys = Object.keys(data).map(k => k.replace(/[^a-zA-Z0-9_]/g, ''));
      const values = Object.values(data);
      const marks = keys.map(() => '?').join(',');

      if (keys.length === 0) {
          return res.status(400).json({ error: 'No fields provided for insertion' });
      }
      
      try {
          rlsContext.run({ userUuid: (req as any).userUuid || null, username: (req as any).username || null }, () => {
              const isBypassed = (req as any).apiKey.type === 'private';
              
              if (isBypassed) {
                  const result = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${marks})`).run(...values);
                  realtimeEmitter.emit(`table_change_${table}`, {
                      action: 'INSERT',
                      data: { id: result.lastInsertRowid, ...data }
                  });
                  return res.json({ success: true, id: result.lastInsertRowid });
              }

              if (rlsFilter === '0=1') {
                  throw new Error('RLS_VIOLATION');
              }

              // Transaction-based policy check
              const lastId = db.transaction(() => {
                  const result = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${marks})`).run(...values);
                  const lastId = result.lastInsertRowid;
                  
                  const check = db.prepare(`SELECT 1 FROM ${table} WHERE rowid = ? AND (${rlsFilter})`).get(lastId);
                  if (!check) {
                      throw new Error('RLS_VIOLATION');
                  }
                  
                  realtimeEmitter.emit(`table_change_${table}`, {
                      action: 'INSERT',
                      data: { id: lastId, ...data }
                  });
                  return lastId;
              })();

              res.json({ success: true, id: lastId });
          });
      } catch (e: any) {
          if (e.message === 'RLS_VIOLATION') {
              res.status(403).json({ error: 'Violates row-level security policy for INSERT' });
          } else {
              res.status(500).json({ error: e.message });
          }
      }
  });

  externalApi.patch('/:table', validateTargetTable, (req, res) => {
      const table = (req as any).safeTable;
      const rlsSelectFilter = applyRls(table, 'SELECT', req);
      const rlsUpdateFilter = applyRls(table, 'UPDATE', req);

      const { whereClause, values: filterValues } = parseQueryFilters(req.query);
      const data = req.body;
      const keys = Object.keys(data).map(k => k.replace(/[^a-zA-Z0-9_]/g, ''));
      const updateValues = Object.values(data);
      
      if (keys.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
      }

      const setClause = keys.map(k => `${k} = ?`).join(', ');

      try {
          rlsContext.run({ userUuid: (req as any).userUuid || null, username: (req as any).username || null }, () => {
              const isBypassed = (req as any).apiKey.type === 'private';

              if (isBypassed) {
                  const result = db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${whereClause}`).run(...updateValues, ...filterValues);
                  return res.json({ success: true, changes: result.changes });
              }

              if (rlsUpdateFilter === '0=1') {
                  throw new Error('RLS_VIOLATION');
              }

              const changes = db.transaction(() => {
                  const targetRows = db.prepare(`SELECT rowid AS carabase_rowid, * FROM ${table} WHERE (${whereClause}) AND (${rlsSelectFilter}) AND (${rlsUpdateFilter})`).all(...filterValues) as any[];
                  
                  if (targetRows.length === 0) {
                      throw new Error('RLS_VIOLATION_OR_NOT_FOUND');
                  }

                  const result = db.prepare(`UPDATE ${table} SET ${setClause} WHERE (${whereClause}) AND (${rlsSelectFilter}) AND (${rlsUpdateFilter})`).run(...updateValues, ...filterValues);

                  for (const row of targetRows) {
                      const check = db.prepare(`SELECT 1 FROM ${table} WHERE rowid = ? AND (${rlsUpdateFilter})`).get(row.carabase_rowid);
                      if (!check) {
                          throw new Error('RLS_UPDATE_CHECK_VIOLATION');
                      }
                  }

                  for (const row of targetRows) {
                      realtimeEmitter.emit(`table_change_${table}`, {
                          action: 'UPDATE',
                          data: { ...row, ...data }
                      });
                  }

                  return result.changes;
              })();

              res.json({ success: true, changes });
          });
      } catch (e: any) {
          if (e.message === 'RLS_VIOLATION' || e.message === 'RLS_VIOLATION_OR_NOT_FOUND' || e.message === 'RLS_UPDATE_CHECK_VIOLATION') {
              res.status(403).json({ error: 'Violates row-level security policy for UPDATE or rows not found' });
          } else {
              res.status(500).json({ error: e.message });
          }
      }
  });

  externalApi.delete('/:table', validateTargetTable, (req, res) => {
      const table = (req as any).safeTable;
      const rlsSelectFilter = applyRls(table, 'SELECT', req);
      const rlsDeleteFilter = applyRls(table, 'DELETE', req);

      const { whereClause, values: filterValues } = parseQueryFilters(req.query);

      try {
          rlsContext.run({ userUuid: (req as any).userUuid || null, username: (req as any).username || null }, () => {
              const isBypassed = (req as any).apiKey.type === 'private';

              if (isBypassed) {
                  const result = db.prepare(`DELETE FROM ${table} WHERE ${whereClause}`).run(...filterValues);
                  return res.json({ success: true, changes: result.changes });
              }

              if (rlsDeleteFilter === '0=1') {
                  throw new Error('RLS_VIOLATION');
              }

              const changes = db.transaction(() => {
                  const targetRows = db.prepare(`SELECT rowid AS carabase_rowid, * FROM ${table} WHERE (${whereClause}) AND (${rlsSelectFilter}) AND (${rlsDeleteFilter})`).all(...filterValues) as any[];
                  
                  if (targetRows.length === 0) {
                      throw new Error('RLS_VIOLATION_OR_NOT_FOUND');
                  }

                  const result = db.prepare(`DELETE FROM ${table} WHERE (${whereClause}) AND (${rlsSelectFilter}) AND (${rlsDeleteFilter})`).run(...filterValues);

                  for (const row of targetRows) {
                      realtimeEmitter.emit(`table_change_${table}`, {
                          action: 'DELETE',
                          data: row
                      });
                  }

                  return result.changes;
              })();

              res.json({ success: true, changes });
          });
      } catch (e: any) {
          if (e.message === 'RLS_VIOLATION' || e.message === 'RLS_VIOLATION_OR_NOT_FOUND') {
              res.status(403).json({ error: 'Violates row-level security policy for DELETE or rows not found' });
          } else {
              res.status(500).json({ error: e.message });
          }
      }
  });

  app.use('/rest/v1', publicApiGuard, externalApi);

  const storageApi = express.Router();
  storageApi.use(authenticateDataApi);

  storageApi.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const id = uuidv4();
    try {
      db.prepare('INSERT INTO _carabase_storage (id, original_name, filename, mime_type, size) VALUES (?, ?, ?, ?, ?)').run(id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
      res.json({ success: true, id, filename: req.file.filename });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Apply rate limiter and kill switch to all /storage/v1 routes
  app.use('/storage/v1', publicApiGuard);

  // Public direct file retrieval route (mounted before auth router for anonymous sharing)
  app.get('/storage/v1/file/:id', (req, res) => {
     try {
       const row = db.prepare('SELECT * FROM _carabase_storage WHERE id = ?').get(req.params.id) as any;
       if (!row) return res.status(404).json({ error: 'File not found' });
       const filePath = path.join(storageDir, row.filename);
       if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File physically missing' });
       res.setHeader('Content-Type', row.mime_type);
       res.sendFile(filePath);
     } catch(e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  // ShellProxy Rate Limiter State
  const shareRateLimitMap = new Map<string, { count: number; resetTime: number }>();

  // ShellProxy Public Membrane route
  app.get('/storage/v1/share/:share_hash', (req, res) => {
     const { share_hash } = req.params;
     // Membrane Guard: Validates share_hash length (64 chars hex) to drop scanners
     if (!share_hash || !/^[a-f0-9]{64}$/i.test(share_hash)) {
        return res.status(404).end(); // Silent drop
     }

     try {
       const row = db.prepare(`
          SELECT s.*, file.filename, file.original_name, file.mime_type, file.size 
          FROM _carabase_storage_shares s
          JOIN _carabase_storage file ON s.storage_id = file.id
          WHERE s.share_hash = ?
            AND (s.expires_at IS NULL OR s.expires_at > datetime('now'))
       `).get(share_hash) as any;

       if (!row) return res.status(404).end();

       // Proxy Share Rate Limiting (100 req / minute per IP + Share Hash)
       const ip = req.ip || req.socket.remoteAddress || 'unknown';
       const rateLimitKey = `${ip}_${share_hash}`;
       const now = Date.now();
       let record = shareRateLimitMap.get(rateLimitKey);
       
       if (!record || now > record.resetTime) {
         record = { count: 0, resetTime: now + 60000 };
       }
       if (record.count >= 100) {
         return res.status(429).end(); // Silent drop on rate limit
       }
       record.count++;
       shareRateLimitMap.set(rateLimitKey, record);

       // Increment Analytics
       db.prepare(`UPDATE _carabase_storage_shares SET access_count = access_count + 1 WHERE id = ?`).run(row.id);

       const filePath = path.join(storageDir, row.filename);
       if (!fs.existsSync(filePath)) return res.status(404).end();

       const isBrowser = req.headers.accept?.includes('text/html');

       if (isBrowser) {
         const isImage = row.mime_type.startsWith('image/');
         const isVideo = row.mime_type.startsWith('video/');
         
         const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CaraBase Share | ${row.original_name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
  <div class="max-w-4xl w-full bg-slate-900 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden flex flex-col items-center">
    <div class="w-full p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
      <div class="flex items-center gap-3 overflow-hidden pr-4">
        <svg class="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <div class="text-slate-300 font-mono text-sm truncate">${row.original_name}</div>
      </div>
      <a href="/storage/v1/share/${share_hash}" download="${row.original_name}" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 shrink-0 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        <span class="hidden sm:inline">Download</span>
      </a>
    </div>
    <div class="p-4 sm:p-10 w-full flex justify-center items-center bg-slate-950/50 min-h-[400px]">
      ${isImage ? `<img src="/storage/v1/share/${share_hash}" alt="${row.original_name}" class="max-w-full max-h-[65vh] rounded-xl shadow-2xl object-contain border border-slate-800">` : 
        isVideo ? `<video controls src="/storage/v1/share/${share_hash}" class="max-w-full max-h-[65vh] rounded-xl shadow-2xl border border-slate-800"></video>` : 
        `<div class="text-slate-500 text-center"><svg class="w-20 h-20 mx-auto mb-6 opacity-30 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg><p class="text-2xl font-medium text-slate-300 mb-2">No Preview Available</p><p class="text-sm font-mono text-slate-500">${(row.size / 1024 / 1024).toFixed(2)} MB • ${row.mime_type}</p></div>`
      }
    </div>
    <div class="w-full text-center py-5 border-t border-slate-800 text-slate-600 text-xs tracking-[0.2em] uppercase font-bold bg-slate-900">
      CaraBase <span class="opacity-50 font-normal">Proxy Membrane</span>
    </div>
  </div>
</body>
</html>`;
         res.setHeader('Content-Type', 'text/html');
         res.send(html);
       } else {
         // CRITICAL: Prevent execution of malicious HTML payloads directly inline via headers
         res.setHeader('Content-Type', row.mime_type);
         res.setHeader('Content-Disposition', 'inline'); // Ensure it plays nice with image tags
         res.setHeader('X-Content-Type-Options', 'nosniff');
         res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
         res.sendFile(filePath);
       }
     } catch(e: any) {
       console.error('[ShellProxy] Error fetching share:', e);
       res.status(404).end();
     }
  });

  app.use('/storage/v1', storageApi);

  systemApi.get('/storage', requireRole('admin'), (req, res) => {
      try {
          const files = db.prepare('SELECT * FROM _carabase_storage ORDER BY created_at DESC').all();
          res.json(files);
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.post('/storage/upload', requireRole('admin'), upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const id = uuidv4();
      try {
        db.prepare('INSERT INTO _carabase_storage (id, original_name, filename, mime_type, size) VALUES (?, ?, ?, ?, ?)').run(id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
        res.json({ success: true, id, filename: req.file.filename });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
  });

  systemApi.delete('/storage/:id', requireRole('admin'), (req, res) => {
      try {
          const row = db.prepare('SELECT * FROM _carabase_storage WHERE id = ?').get(req.params.id) as any;
          if (row) {
             const filePath = path.join(storageDir, row.filename);
             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
             db.prepare('DELETE FROM _carabase_storage WHERE id = ?').run(req.params.id);
          }
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.get('/storage/shares', requireRole('admin'), (req, res) => {
      try {
          const shares = db.prepare(`
             SELECT s.id, s.storage_id, s.share_hash, s.created_at, s.expires_at, s.access_count,
                    file.original_name, file.mime_type, file.size
             FROM _carabase_storage_shares s
             JOIN _carabase_storage file ON s.storage_id = file.id
             ORDER BY s.created_at DESC
          `).all();
          res.json(shares);
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.post('/storage/:id/shares', requireRole('admin'), express.json(), (req, res) => {
      try {
          const { id } = req.params;
          const { expires_at } = req.body;
          
          const file = db.prepare('SELECT id FROM _carabase_storage WHERE id = ?').get(id);
          if (!file) return res.status(404).json({ error: 'Storage asset not found' });

          const share_id = uuidv4();
          const share_hash = crypto.randomBytes(32).toString('hex');
          
          db.prepare('INSERT INTO _carabase_storage_shares (id, storage_id, share_hash, expires_at) VALUES (?, ?, ?, ?)').run(share_id, id, share_hash, expires_at || null);
          
          res.json({ success: true, share_hash, expires_at });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.delete('/storage/shares/:hash', requireRole('admin'), (req, res) => {
      try {
          db.prepare('DELETE FROM _carabase_storage_shares WHERE share_hash = ?').run(req.params.hash);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.get('/settings', requireRole('admin'), (req, res) => {
      try {
          const rows = db.prepare("SELECT key, value FROM system_settings WHERE key IN ('cors_origins', 'api_enabled', 'rate_limit_per_minute')").all() as any[];
          const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
          res.json({ success: true, data: settings });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.patch('/settings', requireRole('admin'), express.json(), (req, res) => {
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

  systemApi.get('/audit-logs', requireRole('superadmin'), (req, res) => {
      try {
          const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500').all();
          res.json(logs);
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.get('/policies', requireRole('admin'), (req, res) => {
      try {
          const policies = db.prepare('SELECT * FROM _carabase_policies').all();
          res.json(policies);
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.post('/policies', requireRole('admin'), (req, res) => {
      const { table_name, action, definition } = req.body;
      const id = uuidv4();
      try {
          db.prepare('INSERT INTO _carabase_policies (id, table_name, action, definition) VALUES (?, ?, ?, ?)').run(id, table_name, action, definition);
          res.json({ id, table_name, action, definition });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.delete('/policies/:id', requireRole('admin'), (req, res) => {
      try {
          db.prepare('DELETE FROM _carabase_policies WHERE id = ?').run(req.params.id);
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.get('/endpoints', requireRole('admin'), (req, res) => {
      try {
          const endpoints = db.prepare('SELECT * FROM _carabase_custom_endpoints ORDER BY created_at DESC').all();
          res.json(endpoints);
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.post('/endpoints', requireRole('admin'), (req, res) => {
      const { name, path, method, table_name, schema } = req.body;
      const id = uuidv4();
      try {
          db.prepare('INSERT INTO _carabase_custom_endpoints (id, name, path, method, table_name, schema) VALUES (?, ?, ?, ?, ?, ?)').run(
              id, name, path, method, table_name, JSON.stringify(schema)
          );

          audit.log('ENDPOINT_CREATED', {
              actor: (req as any).userUuid,
              actor_type: 'human',
              resource: id,
              action: 'create',
              outcome: 'success',
              ip_address: req.ip,
              user_agent: req.headers['user-agent'] || '',
              details: { name, path, method, table_name }
          });

          res.json({ id, name, path, method, table_name, schema });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  systemApi.delete('/endpoints/:id', requireRole('admin'), (req, res) => {
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

  app.use('/api/system', systemApi);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    // Prevent Vite from intercepting any /api, /storage, or /rest routes that were not matched
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/storage') || req.path.startsWith('/rest')) {
        return res.status(404).json({ error: 'Not Found' });
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/storage') || req.path.startsWith('/rest')) {
        return res.status(404).json({ error: 'Not Found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Global Error Handler (Harden the Shell) ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Global Error Boundary]', err);
    
    // Log fatal errors to audit_logs if db is available
    try {
       const auditLogger = createAuditLogger(db);
       auditLogger.log('SYSTEM_FATAL_ERROR', {
         actor: 'system',
         actor_type: 'system',
         resource: 'backend',
         action: 'crash',
         outcome: 'failure',
         ip_address: req.ip || req.socket.remoteAddress || 'unknown',
         user_agent: req.headers['user-agent'] || '',
         details: { message: err.message, path: req.path }
       });
    } catch (auditErr) {
       console.error('[Audit Logger Failed in Error Boundary]', auditErr);
    }

    res.status(500).json({ error: 'Internal Server Error' });
  });

  // Generate a session ID for uptime tracking
  const sessionId = uuidv4();

  const HOST = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');

  const server = app.listen(PORT, () => {
    console.log(`\n[Database] Checking migrations...`);
    console.log(`[Database] Migrations complete.`);
    console.log(`\n🔑 System auth and REST routes ready.`);
    console.log(`🦞 CaraBase API running on port ${PORT}`);
    console.log(`   Local API URL: http://localhost:${PORT}`);

    // Log SYSTEM_START for uptime tracking
    audit.log('SYSTEM_START', {
      action: 'system_start',
      outcome: 'success',
      details: { session_id: sessionId, port: PORT }
    });

    // Start automated SQLite backup schedule
    startBackupSchedule(db);
  });

  // Graceful Shutdown Hook
  function handleShutdown(signal: string) {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    
    try {
      audit.log('SYSTEM_SHUTDOWN', {
        action: 'shutdown',
        outcome: 'success',
        details: { signal, session_id: sessionId }
      });
    } catch (err: any) {
      console.error('[Shutdown Log Error]', err.message);
    }

    try {
      db.close(); // Close SQLite database handles immediately to preserve data integrity
      console.log('[Database] 🗄️ Database connections closed securely.');
    } catch (dbErr: any) {
      console.error('[Database Close Error]', dbErr.message);
    }

    // Force exit immediately after db close to release the port for the next tsx-watch spawn
    console.log('[Server] Releasing port and exiting.');
    process.exit(0);
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
