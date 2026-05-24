# CaraBase: The Lobsterized©™ BaaS

> **Brand:** ClawStack Studios©™  
> **Status:** Production-Ready

CaraBase is an open-source, full-stack, SQLite-backed Database-as-a-Service, meant to provide a self-hosted, hyper-lightweight alternative to massive cloud platforms like Supabase.

It strips away the bloat of distributed microservices, relying instead on the incredible power of a single-file SQLite database running in WAL mode, paired with a blisteringly fast Node/Express backend and a beautiful React frontend.

The ultimate goal? **Supabase-level ergonomics**—Instant REST APIs, Row-Level Security, physical Storage, and Realtime SSE streaming—without the infrastructure headache.

## Why CaraBase?

Many projects don't need a sprawling, multi-node PostgreSQL cluster. For local tooling, internal dashboards, and medium-scale applications, SQLite is often more than enough. CaraBase wraps SQLite in a secure, opaque-token ecosystem.

- **Instant SQLite Backend:** Tables are real SQLite tables. Data persists instantly via `better-sqlite3`.
- **Dynamic Schema Editor:** Create any table shapes, types, and constraints right from the dashboard.
- **REST APIs Built-In:** Your data is accessible immediately over `/rest/v1/...`
- **Role Level Security (RLS):** Fine-grained SQLite `WHERE` clause logic injected directly into API reads/writes based on the type of API key used to query.
- **Secure File Storage & Membrane Shares:** Upload and manage physical files. Create secure, expiring public links via cryptographic `share_hash`.
- **SuperAdmin Dashboard:** Built-in environment-gated admin portal (`/admin`) for comprehensive system monitoring, uptime tracking, and sovereign metadata auditing.

## The Lobsterized©™ Ethos

This architecture is governed by strict invariants:
1. **Never trust the seams:** Every incoming API request passes through rigorous middleware.
2. **Build the floor before the ceiling:** Ensure the underlying SQLite query binds and permissions check out before rendering the UI.
3. **Data Sovereignty:** The SuperAdmin dashboard tracks system health and access metrics without ever peeking into user data contents.

Ready to dive in? Check out the [Architecture & Philosophy](architecture.md).
