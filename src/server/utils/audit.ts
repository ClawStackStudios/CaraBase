import db from '../db.js';
import { createAuditLogger } from './auditLogger.js';

/**
 * Global Audit Logger instance.
 */
export const audit = createAuditLogger(db);
