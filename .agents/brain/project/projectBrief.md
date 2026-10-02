# Project Brief: CaraBase

## Core Overview
CaraBase is a self-hostable, hyper-lightweight Database-as-a-Service (BaaS) and "Lobsterized©™" backend engineered by ClawStack Studios©™. It provides Supabase-level developer ergonomics (Instant REST APIs, Row-Level Security, Realtime SSE events, Storage Engine, SuperAdmin dashboard) with zero microservice bloat, backed by an embedded SQLite database running in WAL mode with SQLCipher encryption.

## Key Objectives
- **Hyper-Lightweight Self-Hosting**: Single Node.js server (`server.ts` / `dist/server.cjs`) + embedded SQLite database (`better-sqlite3-multiple-ciphers`).
- **Opaque Token Security**: Multi-tier authentication (`hu-` human, `api-` programmatic, `lb-` ephemeral sessions) with RBAC (`superadmin` > `admin` > `viewer`).
- **PinchPad Membrane Security**: Zero-trust tunnel compatibility, strict localhost binding (`127.0.0.1`), explicit CORS origins (no wildcards), Helmet CSP.
- **Agent-Native Granularity**: Strict component decomposition adhering to Lucas's rule: target ~250 lines per file, 500 lines hard ceiling.
- **Client SDKs**: Bundled TypeScript SDK (`sdk/`) and Android SDK (`sdk-android/`) for frictionless client app integration.

## Scope Boundaries
- **In Scope**:
  - Embedded SQLite data management with instant auto-generated REST APIs (`/api/rest/:table`).
  - Row-Level Security (RLS) enforcement via query transformation.
  - File storage with cryptographic `ShellProxy Membrane` and expiring `share_hash` links.
  - SuperAdmin web console (`/` React + Vite + Tailwind + Motion).
  - Background backups with retention policies.
- **Out of Scope**:
  - Heavy multi-container distributed orchestrations (PostgreSQL clusters, Redis clusters, Kafka).
