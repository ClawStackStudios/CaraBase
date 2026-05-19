import type { Database } from 'better-sqlite3-multiple-ciphers';

export function createAuditLogger(db: Database) {
  return {
    log(eventType: string, params: {
      actor?: string;
      actor_type?: string;
      action: string;
      outcome: string;
      resource?: string;
      ip_address?: string;
      user_agent?: string;
      details?: any;
    }) {
      try {
        db.prepare(`
          INSERT INTO audit_logs (
            timestamp, event_type, actor, actor_type, resource,
            action, outcome, ip_address, user_agent, details
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new Date().toISOString(),
          eventType,
          params.actor || null,
          params.actor_type || null,
          params.resource || null,
          params.action,
          params.outcome,
          params.ip_address || null,
          params.user_agent || null,
          params.details ? JSON.stringify(params.details) : null
        );
      } catch (err: any) {
        console.error('[AUDIT LOG ERROR]', err.message);
      }
    }
  };
}
