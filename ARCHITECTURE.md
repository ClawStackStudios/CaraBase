# System Architecture

> Maintained for ClawStack Studios©™

CaraBase is a self-hosted, SQLite-backed Database-as-a-Service providing an open-source, full-stack alternative to massive cloud platforms like Supabase. It pairs an Express Node.js engine with a modern React 19 / Vite SPA frontend, backed by hardware-isolated SQLite databases with Row-Level Security, Realtime event streaming, and cryptographic file membranes.

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

## 🔑 Token & Identity Hierarchy

CaraBase rejects raw JWT ambiguity in favor of deterministic, prefix-routed opaque tokens validated using `crypto.timingSafeEqual()`:

| Token Prefix | Identity Type | RLS Behavior | System API Access |
| :--- | :--- | :--- | :--- |
| `hu-` | Human ClawKey identity | Implicit private bypass | Full administrative access |
| `api-` | Ephemeral session token | Evaluated per user session | Gated by assigned user role |
| `lb-` | Delegated Agent Key | Sandboxed RLS context | **Strictly blocked** from `/api/system` & `/api/admin` |
| `ls-p-` | Private Master Key | Bypasses all RLS checks | Backend server integrations only |
| `ls-` | Public Anonymous Key | **Strict default-deny RLS** | Public client queries (`/rest/v1`) |

---

## 🛡️ Storage Membrane & Dual-Serve Architecture

Files uploaded through `/api/system/storage/upload` pass through Multer with strict MIME rejection (`application/x-msdownload`, `application/x-executable`, `application/x-sh`).

Public sharing uses the **ShellProxy Membrane**:
1. Files receive a 64-character SHA-256 cryptographic `share_hash`.
2. Raw `storage_id` bypass attempts return `404 Not Found`.
3. Expired links (`share_expires_at < CURRENT_TIMESTAMP`) fail closed with `404 Not Found`.
4. **Dual-Serve Content Negotiation**:
   - Request with `Accept: text/html` renders a responsive, styled Tailwind preview card with file metadata.
   - Standard requests or downloads stream the raw binary with `X-Content-Type-Options: nosniff`.

---

## 📚 Living Documentation Architecture

Documentation strictly bows to executable code reality following our **[Doc Automation](.agents/skills/doc-automation/SKILL.md)** protocol:
- **Zero-Rot Region Ingestion**: VitePress imports live, tested code snippets via `<<< @/...#region` comments.
- **The Test Oracle**: All documented endpoints, payloads, and queries mirror assertions in `tests/suite.cjs` (108/108 passing).
- **Keep a Changelog 1.1.0**: Project milestones adhere to strict 4-digit Semantic Versioning (`vX.Y.Z.W`) in `CHANGELOG.md`.
