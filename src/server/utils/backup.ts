import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import Database from 'better-sqlite3-multiple-ciphers';

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'data', 'backups');
const BACKUP_RETENTION_COUNT = process.env.BACKUP_RETENTION_COUNT ? parseInt(process.env.BACKUP_RETENTION_COUNT, 10) : 5;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

/**
 * Triggers an immediate SQLite backup using the native .backup() API.
 * Automatically enforces retention policy by deleting oldest backups.
 */
export async function triggerBackup(db: Database.Database): Promise<BackupInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `carabase-backup-${timestamp}.sqlite`;
  const destFile = path.join(BACKUP_DIR, filename);

  try {
    // Perform the SQLite native backup using VACUUM INTO to preserve encryption PRAGMAs
    if (fs.existsSync(destFile)) {
       fs.unlinkSync(destFile); // VACUUM INTO fails if target exists
    }
    db.prepare(`VACUUM INTO ?`).run(destFile);

    // Enforce retention policy
    enforceRetentionPolicy();

    const stats = fs.statSync(destFile);
    return {
      filename,
      sizeBytes: stats.size,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Backup Engine] Failed to create backup:', error);
    throw new Error('Database backup failed.');
  }
}

/**
 * Returns a list of all current backups sorted by newest first.
 */
export function getBackupsList(): BackupInfo[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('carabase-backup-') && f.endsWith('.sqlite'));
  
  const backups: BackupInfo[] = files.map(filename => {
    const filePath = path.join(BACKUP_DIR, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      sizeBytes: stats.size,
      createdAt: stats.birthtime.toISOString()
    };
  });

  // Sort by created at descending (newest first)
  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Deletes older backups to maintain the retention count.
 */
function enforceRetentionPolicy() {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const backups = getBackupsList();

  if (backups.length > BACKUP_RETENTION_COUNT) {
    const toDelete = backups.slice(BACKUP_RETENTION_COUNT);
    for (const backup of toDelete) {
      const filePath = path.join(BACKUP_DIR, backup.filename);
      try {
        fs.unlinkSync(filePath);
        console.log(`[Backup Engine] Deleted old backup: ${backup.filename}`);
      } catch (err) {
        console.error(`[Backup Engine] Failed to delete old backup ${backup.filename}:`, err);
      }
    }
  }
}

/**
 * Starts the daily backup schedule.
 */
export function startBackupSchedule(db: Database.Database) {
  console.log(`[Backup Engine] Scheduled daily database backups (Retention: ${BACKUP_RETENTION_COUNT}).`);
  
  // Run at 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[Backup Engine] Initiating scheduled daily backup...');
    try {
      const info = await triggerBackup(db);
      console.log(`[Backup Engine] Backup successful: ${info.filename} (${(info.sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
    } catch (error) {
      console.error('[Backup Engine] Scheduled backup failed.');
    }
  });
}
