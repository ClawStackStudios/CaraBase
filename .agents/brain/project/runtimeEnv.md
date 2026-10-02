# Runtime Environment Contracts

## Toolchain Contracts
- **Node.js**: >= 22 (LTS bookworm-slim recommended for Docker runtime)
- **TypeScript**: 5.8.x
- **Build Tools**: Vite 6.x, esbuild 0.25.x
- **Database Engine**: SQLite 3 with SQLCipher extensions via `better-sqlite3-multiple-ciphers`

## Service & Port Primitives
- **Frontend Port**: `5454` (bound strictly to `127.0.0.1` in development)
- **Backend API Port**: `5353` (bound to `127.0.0.1` locally, accessible via reverse proxy in production)
- **Health Check Endpoint**: `GET http://127.0.0.1:5353/api/health`

## Storage & Database Primitives
- **SQLite Database Path**: `data/carabase.sqlite`
- **WAL Journaling**: `data/carabase.sqlite-wal` and `data/carabase.sqlite-shm`
- **Storage Directory**: `data/storage/`
- **Backups Directory**: `data/backups/`
- **Key Environment Variables**:
  - `PORT`: Server listen port (default 5353)
  - `NODE_ENV`: `development` | `production`
  - `DB_ENCRYPTION_KEY`: 64-char hex key for SQLCipher database encryption
  - `ADMIN_TOKEN`: Initial SuperAdmin bootstrap token
  - `CORS_ORIGINS`: Comma-separated allowed origins (no wildcard `*` allowed in production)
