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

// Mutex: serialize concurrent triggers (cron + manual API) so retention can
// never interleave with an in-flight VACUUM INTO on the same directory.
let backupChain: Promise<unknown> = Promise.resolve();

/**
 * Parse the creation timestamp embedded in a backup filename.
 * Filesystem birthtime is unreliable (epoch 0 on some mounts), so the
 * filename — `carabase-backup-<ISO8601-with-dashes>.sqlite` — is the source of truth.
 */
function parseBackupTimestamp(filename: string): Date {
  const match = filename.match(/^carabase-backup-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.sqlite$/);
  if (!match) return new Date(0);
  return new Date(`${match[1]}T${match[2]}:${match[3]}:${match[4]}.${match[5]}Z`);
}

/**
 * Triggers an immediate SQLite backup using VACUUM INTO (preserves encryption PRAGMAs).
 * Concurrent invocations are serialized; retention never deletes the fresh backup.
 */
export function triggerBackup(db: Database.Database): Promise<BackupInfo> {
  const run = backupChain.then(() => doTriggerBackup(db));
  // Keep the chain alive even when a trigger fails, so later triggers still run.
  backupChain = run.catch(() => undefined);
  return run;
}

async function doTriggerBackup(db: Database.Database): Promise<BackupInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `carabase-backup-${timestamp}.sqlite`;
  const destFile = path.join(BACKUP_DIR, filename);

  try {
    // Perform the SQLite native backup using VACUUM INTO to preserve encryption PRAGMAs
    if (fs.existsSync(destFile)) {
       fs.unlinkSync(destFile); // VACUUM INTO fails if target exists
    }
    db.prepare(`VACUUM INTO ?`).run(destFile);

    // Enforce retention policy — explicitly protect the file we just created
    enforceRetentionPolicy(filename);

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
 * Ordering uses the timestamp embedded in each filename — lexicographic order
 * equals chronological order for this fixed-width format, and unlike
 * fs birthtime it is reliable across filesystems.
 */
export function getBackupsList(): BackupInfo[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('carabase-backup-') && f.endsWith('.sqlite'))
    .sort()
    .reverse(); // newest first

  return files.map(filename => {
    const filePath = path.join(BACKUP_DIR, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      sizeBytes: stats.size,
      createdAt: (parseBackupTimestamp(filename) || stats.birthtime).toISOString()
    };
  });
}

/**
 * Deletes older backups to maintain the retention count.
 * @param currentFilename The just-created backup — always exempt from deletion.
 */
function enforceRetentionPolicy(currentFilename?: string) {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const backups = getBackupsList();

  if (backups.length > BACKUP_RETENTION_COUNT) {
    const toDelete = backups.slice(BACKUP_RETENTION_COUNT);
    for (const backup of toDelete) {
      // Never delete the backup this very call just created.
      if (currentFilename && backup.filename === currentFilename) continue;
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
