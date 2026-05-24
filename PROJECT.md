---
**Brand**: ClawStack Studios©™  
**Orchestrator**: Lucas  
**Status**: Production-Ready (Phase 2 Complete)
---

# CaraBase: The Lobsterized©™ BaaS

---

## 🎯 The Vision
CaraBase was conceived as a self-hostable, hyper-lightweight alternative to massive cloud Database-as-a-Service (BaaS) platforms like Supabase. 

It strips away the bloat of distributed microservices, relying instead on the incredible power of a single-file SQLite database running in WAL mode, paired with a blisteringly fast Node/Express backend and a beautiful React frontend. The goal is to provide **Supabase-level ergonomics** (Instant REST APIs, RLS, Storage, and Realtime) without the infrastructure headache.

---

## 🏗️ Current Architectural State

CaraBase has evolved significantly from its initial prototype into a hardened, secure, and production-ready system. 

### Core Features:
1. **Instant SQLite Backend**: Tables are real SQLite tables. Data persists instantly via `better-sqlite3`.
2. **Opaque Token Security**: We abandoned traditional JWTs for a highly secure Opaque Token architecture (`hu-` keys for humans, `api-` keys for programmatic access, and `lb-` ephemeral session tokens).
3. **Role-Based Access Control (RBAC)**: Strict `superadmin` > `admin` > `viewer` hierarchies enforced at the middleware layer.
4. **Dynamic REST API**: Every table created is immediately accessible via `/api/rest/:table`, complete with auto-pagination and sorting.
5. **Row-Level Security (RLS)**: Fine-grained SQLite `WHERE` clause injection to lock down data access at the API boundary based on the key used.
6. **Realtime Subscriptions**: Built-in Server-Sent Events (SSE) for listening to table mutations in real-time.
7. **Storage Engine & ShellProxy Membrane**: Integrated physical file uploading with a cryptographic proxy membrane. Enables secure file sharing via expiring `share_hash` links, adapting dynamically to serve HTML previews or raw binary streams.
8. **Automated Backups**: A resilient, non-blocking `.backup()` engine that automatically snapshots the database daily and manages retention to prevent disk bloat.
9. **SuperAdmin Dashboard**: A beautiful, branded UI providing full introspection into system health, audit logs, user management, and schema editing.
10. **Custom Dynamic API Generator**: A visual builder to create custom REST routes mapped directly to underlying tables with predefined filters and column selections.

### Network & Membrane Security:
CaraBase implements the **PinchPad Security Blueprint**:
- **Zero-Trust Tunnels**: First-class support for Cloudflare Tunnels (`cloudflared`), allowing public internet access without opening any local LAN ports.
- **Strict CORS & Binding**: Dynamically binds to `127.0.0.1` locally to prevent LAN leakage, and enforces explicit CORS whitelists (`CORS_ORIGINS`) in production. No `*` wildcards.
- **Helmet CSP**: Strict Content Security Policies and frameguards protect against XSS and Clickjacking.

---

## 🚀 Where We Are Going (Phase 3 & Beyond)

With the foundational architecture locked and secured, the future of CaraBase revolves around **Integration, Extensibility, and Polish**:

1. **Client SDKs**: Developing a lightweight JavaScript/TypeScript SDK (`@carabase/client`) that mirrors the Supabase syntax (`carabase.from('users').select('*')`) to make connecting external apps frictionless.
2. **Webhooks & Triggers**: Allowing users to configure HTTP Webhooks that fire when specific table mutations occur (e.g., "Hit this external API when a new user registers").
3. **Advanced Policy Editor**: Evolving the RLS UI to make writing and testing complex SQLite security policies visually intuitive.
4. **Data Grid Enhancements**: Adding bulk editing, CSV import/export, and advanced filtering to the Table Editor UI.
5. **Multi-Tenant Scaffolding**: Ensuring CaraBase can scale gracefully if multiple distinct "Projects" need to be hosted on a single instance.

---

*Maintained by CrustAgent©™*