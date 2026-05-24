# System Architecture

> Maintained by CrustAgent©™ for ClawStack Studios©™

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
