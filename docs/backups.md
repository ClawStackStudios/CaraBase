# Backups and Restore

Because CaraBase is built on SQLite, your entire database is just a single file (`carabase.sqlite`). This makes backing up and restoring your data incredibly simple and portable.

## Automated Backups

CaraBase features a built-in automated backup system managed via the SuperAdmin dashboard. 

By default, backups are stored in the `./data/backups` directory on your server.

### Configuration
You can configure the backup behavior using environment variables in your `.env` file:
- `BACKUP_DIR`: The directory where backups are stored (Default: `./data/backups`).
- `BACKUP_RETENTION_COUNT`: The number of recent automated backups to keep before the oldest is deleted (Default: `5`).

### Triggering a Backup
From the SuperAdmin dashboard, navigate to the **Backups** tab and click **Create Backup**. The server will safely pause write transactions, copy the `carabase.sqlite` file, and resume operations seamlessly.

## Manual Backups (CLI)

Because the database is a single file, you can back it up manually from your host machine.

If you are using Docker Compose with the `./data` volume mounted:
```bash
cp ./data/carabase.sqlite ./data/backups/manual_backup_$(date +%F).sqlite
```

> [!IMPORTANT]
> If your database is encrypted (using `DB_ENCRYPTION_KEY`), the backup file is also encrypted. You **must** retain your `DB_ENCRYPTION_KEY` to restore the backup in the future.

## Restoring a Backup

To restore a backup, you must replace the active database file while the CaraBase server is stopped. 

1. **Stop the Server:** 
   ```bash
   docker compose down
   ```
2. **Backup your current state (just in case):**
   ```bash
   mv ./data/carabase.sqlite ./data/carabase.sqlite.old
   ```
3. **Copy the backup file into place:**
   ```bash
   cp ./data/backups/your_backup_file.sqlite ./data/carabase.sqlite
   ```
4. **Restart the Server:**
   ```bash
   docker compose up -d
   ```

> [!WARNING]
> **WAL and SHM Files**
> SQLite uses Write-Ahead Logging (`-wal`) and Shared Memory (`-shm`) files. When replacing `carabase.sqlite`, ensure you also delete or move any lingering `carabase.sqlite-wal` or `carabase.sqlite-shm` files in the `./data` directory, or SQLite may attempt to recover old data over your restored backup, leading to corruption.
