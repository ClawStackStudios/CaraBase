import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import db, { rlsContext } from '../db.js';

export const authenticateDataApi = (req: Request, res: Response, next: NextFunction) => {
    let apiKey = (req.headers['apikey'] as string) || (req.query.apikey as string);
    let sessionToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.startsWith('ls-p-') || token.startsWith('ls-') || token.startsWith('pk_')) {
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
                  (req as any).apiKey = { type: 'session' };
                }
              } else if (tokenRow.owner_type === 'agent') {
                const agentRow = db.prepare('SELECT user_uuid, name FROM agent_keys WHERE api_key_hash = ? AND is_active = 1').get(tokenRow.owner_key) as any;
                if (agentRow) {
                  (req as any).userUuid = agentRow.user_uuid;
                  (req as any).username = `agent:${agentRow.name}`;
                  (req as any).keyType = 'agent'; // FIX: Ensure keyType is set for sandboxing
                }
                if (!apiKey) {
                  (req as any).apiKey = { type: 'session' };
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
            (req as any).keyType = 'human';
            if (!apiKey) {
               (req as any).apiKey = { type: 'session' };
            }
          }
        } else if (sessionToken.startsWith('lb-')) {
          const keyHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
          const agentRow = db.prepare('SELECT user_uuid, name, expiration_date FROM agent_keys WHERE api_key_hash = ? AND is_active = 1').get(keyHash) as any;
          if (agentRow) {
            const isExpired = agentRow.expiration_date && new Date(agentRow.expiration_date) < new Date();
            if (!isExpired) {
              (req as any).userUuid = agentRow.user_uuid;
              (req as any).username = `agent:${agentRow.name}`;
              (req as any).keyType = 'agent'; // FIX: Ensure keyType is set
              if (!apiKey) {
                 (req as any).apiKey = { type: 'session' };
              }
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

export const applyRls = (table: string, action: string, req: Request) => {
    const policies = db.prepare("SELECT * FROM _carabase_policies WHERE table_name = ? AND (action = ? OR action = 'ALL')").all(table, action);
    const apiKey = (req as any).apiKey;
    if (apiKey?.type === 'private') return '1=1';
    if (policies.length === 0) return '0=1';
    return '(' + policies.map((p: any) => '(' + p.definition + ')').join(' OR ') + ')';
};

export const validateTargetTable = (req: Request, res: Response, next: NextFunction) => {
    const table = req.params.table;
    if (!table || table.startsWith('_carabase_') || table.startsWith('sqlite_') || ['users', 'api_tokens', 'agent_keys', 'audit_logs'].includes(table)) {
         return res.status(403).json({ error: 'Forbidden table' });
    }
    (req as any).safeTable = table.replace(/[^a-zA-Z0-9_]/g, '');
    next();
};

export const parseQueryFilters = (query: any) => {
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

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const publicApiGuard = (req: Request, res: Response, next: NextFunction) => {
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
    next();
  }
};
