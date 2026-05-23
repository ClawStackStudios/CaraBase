import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import cookieParser from 'cookie-parser';

// Use the new db and auth router
import db, { rlsContext } from './src/server/db.js';
import authRouter from './src/server/routes/auth.js';
import agentKeysRouter from './src/server/routes/agentKeys.js';
import adminRouter from './src/server/routes/admin.js';
import { createAuditLogger } from './src/server/utils/auditLogger.js';
import { requireAuth } from './src/server/middleware/auth.js';
import { requireRole } from './src/server/middleware/requireRole.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const realtimeEmitter = new EventEmitter();

async function startServer() {
  const audit = createAuditLogger(db);
  const app = express();
  app.set('trust proxy', 1);
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
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/info', (req, res) => res.json({ name: 'CaraBase', version: '2.0.0' }));

  // --- Mount Auth & Agent Key Routers ---
  app.use('/api/auth', authRouter);
  app.use('/api/agent-keys', agentKeysRouter);
  app.use('/api/admin', adminRouter);

  // --- System API: Internal dashboard management ---
  const systemApi = express.Router();
  systemApi.use(requireAuth);

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

  systemApi.post('/query', requireRole('admin'), (req, res) => {
    const { query, method = 'all', params = [] } = req.body;
    try {
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
    const prefix = type === 'public' ? 'pk_' : 'ls-';
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
    let apiKey = (req.headers['apikey'] as string) || (req.query.apikey as string);
    let sessionToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.startsWith('pk_') || token.startsWith('ls-')) {
        apiKey = token;
      } else {
        sessionToken = token;
      }
    }

    try {
      if (sessionToken) {
        if (sessionToken.startsWith('api-')) {
          const hashedToken = crypto.createHash('sha256').update(sessionToken).digest('hex');
          const tokenRow = db.prepare('SELECT * FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL').get(hashedToken) as any;
          if (tokenRow) {
            const isExpired = new Date(tokenRow.expires_at) < new Date();
            if (!isExpired) {
              if (tokenRow.owner_type === 'human') {
                (req as any).userUuid = tokenRow.owner_key;
                const userRow = db.prepare('SELECT username FROM users WHERE uuid = ?').get(tokenRow.owner_key) as any;
                if (userRow) {
                  (req as any).username = userRow.username;
                }
                if (!apiKey) {
                  (req as any).apiKey = { type: 'private' };
                }
              } else if (tokenRow.owner_type === 'agent') {
                const agentRow = db.prepare('SELECT user_uuid, name FROM agent_keys WHERE api_key_hash = ? AND is_active = 1').get(tokenRow.owner_key) as any;
                if (agentRow) {
                  (req as any).userUuid = agentRow.user_uuid;
                  (req as any).username = `agent:${agentRow.name}`;
                }
              }
            }
          }
        } else if (sessionToken.startsWith('hu-')) {
          const keyHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
          const userRow = db.prepare('SELECT uuid, username FROM users WHERE key_hash = ?').get(keyHash) as any;
          if (userRow) {
            (req as any).userUuid = userRow.uuid;
            (req as any).username = userRow.username;
            if (!apiKey) {
               (req as any).apiKey = { type: 'private' };
            }
          }
        }
      }

      if (apiKey) {
        const apiKeyRow = db.prepare('SELECT * FROM _carabase_api_keys WHERE key = ?').get(apiKey) as any;
        if (!apiKeyRow) {
           return res.status(401).json({ error: 'Invalid API Key' });
        }
        (req as any).apiKey = apiKeyRow;
      }

      if (!(req as any).apiKey) {
          return res.status(401).json({ error: 'Missing API Key or Valid Dashboard Session' });
      }

      next();
    } catch (e: any) {
      res.status(500).json({ error: 'Authentication Error: ' + e.message });
    }
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

  app.use('/rest/v1', externalApi);

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
              actor: (req as any).userSession.user_uuid,
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
                  actor: (req as any).userSession.user_uuid,
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

  // Generate a session ID for uptime tracking
  const sessionId = uuidv4();

  const server = app.listen(PORT, '0.0.0.0', () => {
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
