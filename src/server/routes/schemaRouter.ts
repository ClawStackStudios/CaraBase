import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();
router.use(requireAuth);

const safeIdent = (str: string) => str.replace(/[^a-zA-Z0-9_]/g, '');

router.get('/tables', (req, res) => {
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

router.post('/tables', requireRole('admin'), (req, res) => {
  const { tableName, columns } = req.body;
  if (!tableName || !Array.isArray(columns)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const safeTable = safeIdent(tableName);
  if (!safeTable) return res.status(400).json({ error: 'Invalid table name' });

  let colsDef = columns.map(c => {
    const name = safeIdent(c.name);
    const type = (c.type || 'TEXT').replace(/[^a-zA-Z0-9_() ]/g, '');
    let def = `${name} ${type}`;
    if (c.primaryKey) def += ' PRIMARY KEY';
    if (c.unique) def += ' UNIQUE';
    if (!c.nullable && !c.primaryKey) def += ' NOT NULL';
    if (c.defaultValue) def += ` DEFAULT '${String(c.defaultValue).replace(/'/g, "''")}'`;
    return def;
  }).join(', ');

  try {
    db.exec(`CREATE TABLE ${safeTable} (${colsDef})`);
    res.json({ success: true, table: safeTable });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tables/:name/columns', (req, res) => {
  const safeTable = safeIdent(req.params.name);
  try {
    const columns = db.prepare(`PRAGMA table_info(${safeTable})`).all();
    res.json(columns);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tables/:name/schema', (req, res) => {
  const safeTable = safeIdent(req.params.name);
  try {
    const columns = db.prepare(`PRAGMA table_info(${safeTable})`).all();
    res.json(columns);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tables/:name/indexes', (req, res) => {
  const safeTable = safeIdent(req.params.name);
  try {
    const indexes = db.prepare(`PRAGMA index_list(${safeTable})`).all() as any[];
    for (let idx of indexes) {
       idx.columns = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
    }
    res.json(indexes);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/tables/:name/indexes', requireRole('admin'), (req, res) => {
  const safeTable = safeIdent(req.params.name);
  const { indexName, columnName, isUnique } = req.body;
  if (!indexName || !columnName) return res.status(400).json({ error: 'Missing indexName or columnName' });

  const safeIndex = safeIdent(indexName);
  const safeCol = safeIdent(columnName);
  const uniqueStr = isUnique ? 'UNIQUE' : '';

  try {
    db.exec(`CREATE ${uniqueStr} INDEX ${safeIndex} ON ${safeTable} (${safeCol})`);
    res.json({ success: true, message: `Index ${safeIndex} created` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/tables/:name/indexes/:indexName', requireRole('admin'), (req, res) => {
  const safeIndex = safeIdent(req.params.indexName);
  try {
    db.exec(`DROP INDEX ${safeIndex}`);
    res.json({ success: true, message: `Index ${safeIndex} dropped` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/tables/:name/foreign_keys', (req, res) => {
  const safeTable = safeIdent(req.params.name);
  try {
    const fks = db.prepare(`PRAGMA foreign_key_list(${safeTable})`).all();
    res.json(fks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/tables/:name/fk', requireRole('admin'), (req, res) => {
  const safeTable = safeIdent(req.params.name);
  const { localColumn, foreignTable, foreignColumn, onDelete = 'RESTRICT', onUpdate = 'RESTRICT' } = req.body;

  if (!localColumn || !foreignTable || !foreignColumn) {
    return res.status(400).json({ error: 'Missing FK configuration' });
  }

  const safeLocalCol = safeIdent(localColumn);
  const safeForeignTab = safeIdent(foreignTable);
  const safeForeignCol = safeIdent(foreignColumn);

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

router.get('/views', requireRole('admin'), (req, res) => {
  try {
    const views = db.prepare(`SELECT name, sql FROM sqlite_schema WHERE type='view' AND name NOT LIKE 'sqlite_%'`).all();
    res.json(views);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/views', requireRole('admin'), (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query is required' });

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

router.delete('/views/:name', requireRole('admin'), (req, res) => {
  const safeName = safeIdent(req.params.name);
  try {
    db.exec(`DROP VIEW IF EXISTS "${safeName}"`);
    res.json({ success: true, message: `View ${safeName} dropped` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/triggers', requireRole('admin'), (req, res) => {
  try {
    const triggers = db.prepare(`SELECT name, sql FROM sqlite_schema WHERE type='trigger' AND name NOT LIKE 'sqlite_%'`).all();
    res.json(triggers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/triggers', requireRole('admin'), (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Query is required' });

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

router.delete('/triggers/:name', requireRole('admin'), (req, res) => {
  const safeName = safeIdent(req.params.name);
  try {
    db.exec(`DROP TRIGGER IF EXISTS "${safeName}"`);
    res.json({ success: true, message: `Trigger ${safeName} dropped` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
