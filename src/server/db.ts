import Database from 'better-sqlite3-multiple-ciphers';
import path from 'path';
import fs from 'fs';
import { AsyncLocalStorage } from 'async_hooks';

export const rlsContext = new AsyncLocalStorage<{ userUuid: string | null; username: string | null }>();


const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'carabase.sqlite'); // keep filename from app
const encryptionKey = process.env.DB_ENCRYPTION_KEY;

function openDatabase(): Database.Database {
  const db = new Database(dbPath);

  if (encryptionKey) {
    db.pragma(`key = '${encryptionKey}'`);

    try {
      db.pragma('user_version');
    } catch (e) {
      console.log('[DB] Detected unencrypted database — migrating to encrypted...');
      db.close();
      encryptExistingDatabase(dbPath, encryptionKey);
      const encrypted = new Database(dbPath);
      encrypted.pragma(`key = '${encryptionKey}'`);
      return encrypted;
    }
  } else {
    console.warn('[DB] WARNING: DB_ENCRYPTION_KEY is not set — database is unencrypted at rest.');
  }

  return db;
}

function encryptExistingDatabase(dbPath: string, key: string) {
  const tempPath = dbPath + '.tmp';
  const plain = new Database(dbPath);
  plain.exec(`
    ATTACH DATABASE '${tempPath}' AS encrypted KEY '${key}';
    SELECT sqlcipher_export('encrypted');
    DETACH DATABASE encrypted;
  `);
  plain.close();
  fs.renameSync(tempPath, dbPath);
  console.log('[DB] Database encrypted successfully.');
}

const db = openDatabase();

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Register custom PostgreSQL/Supabase equivalent SQL functions
db.function('auth_uid', () => {
  const store = rlsContext.getStore();
  return store?.userUuid || null;
});

db.function('auth_role', () => {
  const store = rlsContext.getStore();
  return store?.userUuid ? 'authenticated' : 'anon';
});

db.function('auth_username', () => {
  const store = rlsContext.getStore();
  return store?.username || null;
});

// Initialize schema
try {
  // Graceful migration to add role to existing users table
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer'").run();
} catch (e) {
  // Ignore error if column already exists or table doesn't exist yet
}

db.exec(`
  -- Legacy carabase tables
  CREATE TABLE IF NOT EXISTS _carabase_api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('public', 'private')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS _carabase_policies (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')),
    definition TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS _carabase_storage (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS _carabase_storage_shares (
    id          TEXT PRIMARY KEY,
    storage_id  TEXT NOT NULL,
    share_hash  TEXT NOT NULL UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME,
    FOREIGN KEY(storage_id) REFERENCES _carabase_storage(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_storage_shares_hash ON _carabase_storage_shares(share_hash);
  CREATE TABLE IF NOT EXISTS _carabase_custom_endpoints (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    path        TEXT NOT NULL,
    method      TEXT NOT NULL,
    table_name  TEXT NOT NULL,
    schema      TEXT NOT NULL, -- JSON config containing pagination, filtering, columns, and validation
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ClawKeys standard users table
  CREATE TABLE IF NOT EXISTS users (
    uuid       TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    key_hash   TEXT NOT NULL UNIQUE,    -- SHA-256 hash of ClawKey
    role       TEXT NOT NULL DEFAULT 'viewer',
    created_at TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_key_hash ON users(key_hash);

  -- ClawKeys standard agent_keys table
  CREATE TABLE IF NOT EXISTS agent_keys (
    id              TEXT PRIMARY KEY,
    user_uuid       TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    api_key_hash    TEXT NOT NULL UNIQUE,  -- SHA-256 hash of agent key
    permissions     TEXT NOT NULL,         -- JSON: { canRead: true, canWrite: false }
    expiration_type TEXT NOT NULL,         -- 'never', '30d', '90d', '1y'
    expiration_date TEXT,                  -- ISO string
    rate_limit      INTEGER,               -- req/minute for this agent
    is_active       INTEGER DEFAULT 1,     -- 0 = revoked
    created_at      TEXT NOT NULL,
    last_used       TEXT,                  -- Track usage
    revoked_at      TEXT,                  -- When revoked
    revoked_by      TEXT,                  -- Who revoked it
    revoke_reason   TEXT,                  -- Why revoked
    FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_keys_hash ON agent_keys(api_key_hash);
  CREATE INDEX IF NOT EXISTS idx_agent_keys_user ON agent_keys(user_uuid, is_active);

  -- ClawKeys standard session tokens table
  CREATE TABLE IF NOT EXISTS api_tokens (
    key           TEXT PRIMARY KEY,        -- api-{32 chars}, plaintext (short-lived)
    token_hash    TEXT NOT NULL UNIQUE,   -- SHA-256 for revocation lookup
    owner_key     TEXT NOT NULL,          -- uuid or agent_key_hash
    owner_type    TEXT NOT NULL,          -- 'human' or 'agent'
    created_at    TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    revoked_at    TEXT                    -- NULL = valid, set = revoked
  );

  CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);
  CREATE INDEX IF NOT EXISTS idx_api_tokens_expires_at ON api_tokens(expires_at);

  -- ClawKeys standard audit logs table
  CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   TEXT NOT NULL,
    event_type  TEXT NOT NULL,            -- AUTH_SUCCESS, AUTH_FAILURE, AGENT_KEY_CREATED, etc.
    actor       TEXT,                     -- User UUID or agent ID
    actor_type  TEXT,                     -- 'human' or 'agent'
    resource    TEXT,                     -- Resource ID being acted upon
    action      TEXT NOT NULL,            -- 'login', 'create', 'revoke', etc.
    outcome     TEXT NOT NULL,            -- 'success' or 'failure'
    ip_address  TEXT,
    user_agent  TEXT,
    details     TEXT                      -- JSON: { reason: '...', ... }
  );

  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
  CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);

  -- System settings key-value store (for admin retention config etc.)
  CREATE TABLE IF NOT EXISTS system_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  INSERT OR IGNORE INTO system_settings (key, value, updated_at) VALUES 
    ('cors_origins', '', CURRENT_TIMESTAMP),
    ('api_enabled', 'true', CURRENT_TIMESTAMP),
    ('rate_limit_per_minute', '100', CURRENT_TIMESTAMP);
`);

// Run database migrations
import { runMigrations } from './utils/migrations';
try {
  runMigrations(db);
} catch (e: any) {
  console.error('[CaraBase DB] Fatal error running migrations:', e.message);
  process.exit(1);
}

export default db;
