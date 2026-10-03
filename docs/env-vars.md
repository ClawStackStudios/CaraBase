# Environment Variables Reference

CaraBase is configured entirely via Environment Variables. This ensures that sensitive configurations are never hardcoded into your repository.

Below is a comprehensive list of all environment variables recognized by CaraBase.

## Core Settings

| Variable | Type | Required | Description |
|---|---|---|---|
| `PORT` | Number | Yes | The port the Node.js server will bind to (Default: `5353`). |
| `NODE_ENV` | String | No | Set to `production` to enforce secure behaviors and suppress stack traces. |
| `ADMIN_TOKEN` | String | Yes | The password required to access the SuperAdmin dashboard (`/admin-login`). |
| `DB_ENCRYPTION_KEY` | String | Yes | A 64-character hex string used to encrypt the SQLite database using SQLCipher. |

## Network & Security

| Variable | Type | Required | Description |
|---|---|---|---|
| `CORS_ORIGINS` | String | No | A comma-separated list of allowed domains for API requests (e.g., `https://app.com`). |
| `CLOUDFLARE_TUNNEL_URL` | String | No | The public URL of your Cloudflare tunnel. Used as a fallback for CORS if `CORS_ORIGINS` is not set, and used to generate absolute URLs for Share Hashes. |
| `ENFORCE_HTTPS` | Boolean | No | Set to `"true"` if running behind a reverse proxy handling SSL. Marks the SuperAdmin session cookie as `Secure`. |

## Storage & Backups

| Variable | Type | Required | Description |
|---|---|---|---|
| `STORAGE_DIR` | String | No | The physical path where uploaded files are saved (Default: `./data/storage`). |
| `BACKUP_DIR` | String | No | The physical path where automated backups are saved (Default: `./data/backups`). |
| `BACKUP_RETENTION_COUNT` | Number | No | The number of recent automated backups to keep (Default: `5`). |

## Rate Limiting

| Variable | Type | Required | Description |
|---|---|---|---|
| `RATE_LIMIT_GLOBAL_MAX` | Number | No | Max requests per IP per minute across the entire API (Default: `500`). |
| `RATE_LIMIT_AUTH_MAX` | Number | No | Max authentication attempts (login/register) per IP per minute (Default: `10`). |
| `RATE_LIMIT_STORAGE_MAX` | Number | No | Max share hash resolves per IP per minute (Default: `100`). |
