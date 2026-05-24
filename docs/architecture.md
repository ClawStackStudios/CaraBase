# Architecture & Philosophy

CaraBase's architecture is a testament to the power of single-node simplicity. By avoiding the complexities of distributed PostgreSQL and Kubernetes clusters, CaraBase achieves incredible speed and operational ease through SQLite and Express.

## Component Topology

```text
┌─────────────────────────────────────────────────────┐
│ Client (React/Vite SPA)                             │
│   ├── Dashboard (React Router)                      │
│   ├── Table Editor (Dynamic UI -> /api/system)      │
│   ├── Key Manager (Generates & revokes to SQLite)   │
│   ├── Policy Engine (Drafts RLS conditionals)       │
│   ├── Storage Explorer (Uploads & Membrane Shares)  │
│   └── SuperAdmin Dashboard (Dashboard, Users, Audit)│
└─────────────────────────┬───────────────────────────┘
                          │ (Internal /api/system) or
                          │ (External /rest/v1 w/ Keys) or
                          │ (ShellProxy /storage/v1/file) or
                          │ (SuperAdmin /api/admin)
                          ▼
┌─────────────────────────────────────────────────────┐
│ Express Server (Node.js)                            │
│   ├── System Routes       [No Auth, Internal Only]  │
│   ├── SuperAdmin Routes   [Volatile Session MW]     │
│   ├── Authentication MW   [Validates Bearer Prefix] │
│   ├── Storage Membrane    [Validates share_hash TTL]│
│   ├── Safe Ident Filter   [OWASP Regex Sanitize]    │
│   └── RLS Evaluator       [Constructs WHERE append] │
└─────────────────────────┬───────────────────────────┘
                          │ (better-sqlite3 / sqlite)
                          ▼
┌─────────────────────────────────────────────────────┐
│ SQLite Database Instance (data/carabase.sqlite)     │
│   ├── _carabase_api_keys  [System table]            │
│   ├── _carabase_policies  [System table]            │
│   ├── _carabase_storage_files [Physical asset refs] │
│   ├── _carabase_storage_shares [Membrane boundaries]│
│   ├── system_settings     [Admin Config table]      │
│   ├── audit_logs          [Security & DDL Audit]    │
│   └── user_table_alpha    [User-defined]            │
└─────────────────────────────────────────────────────┘
```

## The Express REST Pipeline

All generic data ingress channels funnel through `/rest/v1/:table`. This ingress is rigorously guarded by the `authenticateDataApi` middleware.

Instead of traditional JWTs, CaraBase utilizes an **Opaque Token Architecture**. The middleware processes dual-layer headers (`apikey` for public/private identification, and `Authorization: Bearer <token>` for active sessions). See [Authentication & API Keys](api-keys.md) for a deep dive.

## Why SQLite?

We chose SQLite operating in **WAL (Write-Ahead Logging)** mode because:
1. **Zero N+1 Configuration:** No external database servers to manage, tune, or upgrade.
2. **Blistering Concurrency:** In WAL mode, reads do not block writes, allowing high concurrency suitable for medium-scale web applications.
3. **Data Portability:** Your entire database, including system tables and metadata, exists in a single `data/carabase.sqlite` file. Backing up the system is as simple as running `.backup()`.

## Network Hardening

CaraBase is designed with a hostile network in mind:
- **Fallback Route Boundary:** Any unhandled route matching backend prefixes (`/api`, `/storage`, `/rest`) is intercepted with a JSON `404 Not Found`. This prevents SPA servers (like Vite) from serving source code or mapping directory traversals when an attacker crafts custom URL paths.
- **Strict CORS Verification:** CORS is tightly bound to explicitly configured whitelists (`CORS_ORIGINS`). It strictly rejects reflection of arbitrary domain origins (like `https://evil.com`), even in local development environments.
- **Loopback Rate-Limit Bypass:** E2E automated testing requires firing hundreds of requests per second. The `authLimiter` middleware automatically detects and bypasses loopback IPs (`127.0.0.1`), ensuring stability for test suites without compromising external production rate limits.
