# Upgrading CaraBase

Because CaraBase stores all of your data, schemas, and configurations inside a single SQLite file (`data/carabase.sqlite`), upgrading to a new version is extremely straightforward.

## The Upgrade Process (Docker)

If you are running CaraBase via Docker Compose, follow these steps to upgrade to the latest version:

1. **Pull the latest image:**
   ```bash
   docker compose pull
   ```

2. **Recreate the container:**
   ```bash
   docker compose up -d
   ```

Docker will automatically stop the old container, remove it, and spin up the new one. Because your `./data` directory is mounted as a volume, the new container will instantly pick up your existing database file and resume operations.

## Automatic Migrations

CaraBase handles database schema migrations automatically. 

When the new server version boots up, it reads the `user_version` PRAGMA of your SQLite database. If the server detects that its internal schema (e.g., system tables like `_carabase_policies` or `audit_logs`) is newer than your database file, it will automatically execute the necessary `ALTER TABLE` statements before opening the HTTP port.

You do not need to run manual migration scripts.

## Rollbacks

If a new version causes issues and you need to roll back:

1. Update your `docker-compose.yml` to point to the specific previous image tag instead of `latest` (e.g., `ghcr.io/clawstackstudios/carabase:v1.2.0`).
2. Run `docker compose up -d`.

> [!WARNING]
> While downgrading the Docker image is easy, SQLite does not automatically "un-migrate" system tables. If the newer version applied a migration (e.g., added a new column to a system table), the older version of the code might not recognize it. Always create a manual backup of your `./data/carabase.sqlite` file before performing a major version upgrade.
