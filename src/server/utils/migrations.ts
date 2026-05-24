import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export function runMigrations(db: any) {
  // 1. Create the migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _carabase_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, '../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  // 2. Read migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();

  for (const file of files) {
    const migrationName = file;

    // Check if migration has run
    const row = db.prepare('SELECT id FROM _carabase_migrations WHERE name = ?').get(migrationName);
    if (row) {
      continue; // Already ran
    }

    console.log(`[CaraBase Migrations] Running migration: ${migrationName}`);

    try {
      // Begin transaction for the migration
      const executeMigration = db.transaction(() => {
        const migrationPath = path.join(migrationsDir, file);
        // We use require to synchronously load the module
        const migration = require(migrationPath);
        
        if (migration.up && typeof migration.up === 'function') {
          migration.up(db);
        } else {
          console.warn(`[CaraBase Migrations] Warning: Migration ${migrationName} does not export an 'up' function.`);
        }

        // Record the migration
        db.prepare('INSERT INTO _carabase_migrations (name) VALUES (?)').run(migrationName);
      });

      executeMigration();
      console.log(`[CaraBase Migrations] Successfully ran ${migrationName}`);
    } catch (e: any) {
      console.error(`[CaraBase Migrations] FAILED to run migration ${migrationName}: ${e.message}`);
      throw e; // Stop further initialization!
    }
  }
}
