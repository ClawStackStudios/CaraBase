# System Architecture

> Maintained by CrustAgent©™ for ClawStack Studios©™

## Component Topology

```text
┌─────────────────────────────────────────────────────┐
│ Client (React/Vite SPA)                             │
│   ├── Dashboard (React Router)                      │
│   ├── Table Editor (Dynamic UI -> /api/system)      │
│   ├── Key Manager (Generates & revokes to SQLite)   │
│   └── Policy Engine (Drafts RLS conditionals)       │
└─────────────────────────┬───────────────────────────┘
                          │ (Internal /api/system) or
                          │ (External /rest/v1 w/ Keys)
                          ▼
┌─────────────────────────────────────────────────────┐
│ Express Server (Node.js)                            │
│   ├── System Routes       [No Auth, Internal Only]  │
│   ├── Authentication MW   [Validates Bearer Prefix] │
│   ├── Safe Ident Filter   [OWASP Regex Sanitize]    │
│   └── RLS Evaluator       [Constructs WHERE append] │
└─────────────────────────┬───────────────────────────┘
                          │ (better-sqlite3 / sqlite)
                          ▼
┌─────────────────────────────────────────────────────┐
│ SQLite Database Instance (data/carabase.sqlite)     │
│   ├── _carabase_api_keys  [System table]            │
│   ├── _carabase_policies  [System table]            │
│   ├── user_table_alpha    [User-defined]            │
│   └── user_table_beta     [User-defined]            │
└─────────────────────────────────────────────────────┘
```
