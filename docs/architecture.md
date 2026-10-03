# Architecture & Philosophy

CaraBase's architecture is a testament to the power of single-node simplicity. By avoiding the operational overhead of distributed PostgreSQL clusters, Kubernetes pods, and complex microservice meshes, CaraBase achieves exceptional throughput, hardware data isolation, and operational ease through SQLite and Express.

---

## 🏛️ Component Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 / Vite SPA)              │
│  ├── Dashboard & Security Audit Console (src/pages/Dashboard.tsx)      │
│  ├── Table Editor & Schema Designer (src/features/table-editor/)       │
│  ├── Visual REST API Builder (src/pages/ApiBuilder.tsx)                │
│  ├── ClawKeys & Identity Manager (src/features/settings/)              │
│  ├── Storage Membrane Explorer & File Shares (src/pages/Storage.tsx)   │
│  ├── SuperAdmin Portal & Metrics (src/components/admin/)               │
│  └── Tri-State Theme Engine with View Transition flushSync             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP /api/system (RBAC hu- / api-)
                                   │ HTTP /rest/v1 (RLS-enforced ls- / ls-p-)
                                   │ HTTP /storage/v1 (ShellProxy Membrane)
                                   │ EventSource /api/realtime (SSE Mutations)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        GATEWAY & MIDDLEWARE LAYER                      │
│  ├── Helmet Hardened Headers (HSTS, nosniff, frameAncestors 'self')    │
│  ├── Global Rate Limiter with Loopback Test Bypass (rateLimiter.ts)    │
│  ├── Strict Origin CORS Sanitization (corsConfig.ts)                   │
│  ├── Opaque Token Router & Timing-Safe Hashing (src/server/middleware) │
│  │     ├── hu-  : Human Master Key (ClawKey identity file)             │
│  │     ├── api- : Ephemeral Session Token (24h sliding TTL)            │
│  │     ├── lb-  : Agent Delegated Key (Sandboxed, no system APIs)      │
│  │     ├── ls-p-: Private Service Master Key (Bypasses RLS)            │
│  │     └── ls-  : Public Anon Key (Strict RLS evaluated)               │
│  ├── Multer Storage Gate (Strict dangerousMimes validation)            │
│  └── ShellProxy Membrane (64-char share_hash & dual-serve content)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ENGINE & DATA ACCESS LAYER                      │
│  ├── Role-Based Access Control (requireRole('admin' | 'superadmin'))   │
│  ├── Transactional RLS Engine with AsyncLocalStorage (rlsContext)      │
│  │     ├── Custom SQLite UDFs: auth_uid(), auth_role(), auth_username()│
│  │     └── Pre/Post-Write Rowid Transactional Validation (403 rollback)│
│  ├── Realtime SSE Event Broadcaster (src/server/realtime/)             │
│  ├── Custom Dynamic REST Route Interceptor (_carabase_endpoints)      │
│  └── Automated Backup Engine (carabase-backup-*.sqlite snapshots)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ better-sqlite3-multiple-ciphers
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        STORAGE & DATABASE LAYER (SQLite)               │
│  ├── WAL Mode Persistence (data/carabase.sqlite, -wal, -shm)           │
│  ├── SQLCipher AES-256 Encryption-at-Rest (DB_ENCRYPTION_KEY)          │
│  ├── System Tables (Hard-blocked from public REST routes):             │
│  │     ├── _carabase_api_keys        (Key hashes & permissions)        │
│  │     ├── _carabase_policies        (Dynamic RLS WHERE rules)         │
│  │     ├── _carabase_endpoints       (Dynamic custom API configs)      │
│  │     ├── _carabase_storage_files   (Physical file metadata)          │
│  │     └── _carabase_storage_shares  (Cryptographic share hashes)      │
│  ├── Operations & Telemetry Tables:                                    │
│  │     ├── system_settings           (Instance configuration)          │
│  │     └── audit_logs                (Cryptographic security trails)   │
│  └── User Application Tables (Dynamically generated & RLS-filtered)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Opaque Token Architecture

CaraBase rejects traditional stateless JWTs in favor of prefix-routed, stateful **Opaque Tokens**. Opaque tokens allow immediate, cryptographic revocation without waiting for client-side token expiration:

- **Human Keys (`hu-`)**: Permanent master secrets generated during setup; mapped to human identities.
- **Session Tokens (`api-`)**: Ephemeral tokens minted upon authentication with a sliding 24-hour TTL.
- **Agent Keys (`lb-`)**: Delegated credentials for autonomous agents; sandboxed and strictly blocked from accessing `/api/system/*` routes.
- **Private Master Keys (`ls-p-`)**: Backend service keys with administrative RLS bypass.
- **Public Anon Keys (`ls-`)**: Client keys bound to strict default-deny RLS policies.

All token comparisons use `crypto.timingSafeEqual()` to eliminate side-channel timing attack vectors.

---

## 💾 Why SQLite in WAL Mode?

CaraBase operates on SQLite running in **WAL (Write-Ahead Logging)** mode via `better-sqlite3-multiple-ciphers`:

1. **Zero External Daemon Dependencies**: The entire database lives in a single file (`data/carabase.sqlite`), eliminating separate database server administration.
2. **High-Throughput Concurrent Reads**: In WAL mode, read transactions never block write transactions, and write transactions never block read transactions.
3. **Atomic Transactional RLS**: Post-write rowid validation and UDF execution take place inside atomic SQLite transactions, rolling back instantly on policy violations.
4. **Encryption at Rest**: Databases are encrypted using SQLCipher AES-256 via the `DB_ENCRYPTION_KEY` environment variable.

---

## 🌐 Network Boundary Hardening

- **Fallback Route Boundary**: Any unhandled route matching `/api`, `/storage`, or `/rest` returns a strict JSON `404 Not Found`. This prevents SPA dev servers from serving client index HTML or exposing directory structures when non-existent endpoints are requested.
- **CORS Whitelist Sanitization**: The server enforces `CORS_ORIGINS` whitelists and actively rejects arbitrary domain reflections (`https://evil.com`) in both development and production modes.
- **Loopback Rate-Limit Bypass**: Pre-configured automatic loopback IP bypass (`127.0.0.1`, `::1`) on `authLimiter` ensures automated test runs (`npm test`) execute rapidly without triggering rate limiters.
