import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db, { rlsContext } from '../db.js';
import {
    authenticateDataApi,
    applyRls,
    validateTargetTable,
    parseQueryFilters,
    publicApiGuard
} from '../middleware/dataAuth.js';
import { realtimeEmitter } from '../utils/realtime.js';
import { audit } from '../utils/audit.js';

const router = express.Router();
router.use(publicApiGuard);
router.use(authenticateDataApi);

// catch-all for /custom/:path(*)
router.all('/custom/:path(*)', async (req, res) => {
    const path = req.params.path;
    const method = req.method.toUpperCase();

    try {
        const endpoint = db.prepare('SELECT * FROM _carabase_custom_endpoints WHERE path = ? AND method = ?').get(path, method) as any;
        if (!endpoint) {
            return res.status(404).json({ error: `Custom endpoint not found for path: /custom/${path} and method: ${method}` });
        }

        const schema = JSON.parse(endpoint.schema);
        const table = endpoint.table_name;

        if (!/^[a-zA-Z0-9_]+$/.test(table)) {
            return res.status(400).json({ error: 'Invalid table name pattern in endpoint configuration.' });
        }

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

        if (method === 'GET') {
            let columnsList = '*';
            if (schema.columns && Array.isArray(schema.columns) && schema.columns.length > 0) {
                columnsList = schema.columns.map((c: string) => c.replace(/[^a-zA-Z0-9_]/g, '')).join(', ');
            }

            const rlsSelectFilter = applyRls(table, 'SELECT', req);
            const { whereClause: queryWhere, values: queryValues } = parseQueryFilters(req.query);

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

            let paginationSql = '';
            if (schema.pagination) {
                const limit = parseInt(req.query.limit as string) || schema.defaultLimit || 10;
                const offset = parseInt(req.query.offset as string) || 0;
                paginationSql = ' LIMIT ? OFFSET ?';
                allValues.push(limit, offset);
            }

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

router.get('/:table', validateTargetTable, (req, res) => {
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

router.post('/:table', validateTargetTable, (req, res) => {
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

router.patch('/:table', validateTargetTable, (req, res) => {
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

router.delete('/:table', validateTargetTable, (req, res) => {
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

export default router;
