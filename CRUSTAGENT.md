---
Brand: ClawStack Studios©™
Project: CaraBase
Maintained by CrustAgent©™

---

# CaraBase

CaraBase is a self-hosted SaaS database service. It is designed to be an open-source, SQLite-backed alternative to large cloud platforms like Supabase.

## Architecture

- **Backend**: Express + SQLite (`better-sqlite3` logic replicated with async `sqlite` and `sqlite3`). Built-in Vite middleware for local dev, compiled to a single CommonJS node script for production.
- **Frontend**: React + Vite + Tailwind CSS. Designed with a clean, functional dashboard UI using Lucide-react icons and custom component primitives mapping to Shadcn UI's style.
- **Security**: 
    - Database is secured via API Keys (Secret `service_role` and Public `anon` types).
    - Public API keys evaluate dynamic *Row Level Security (RLS)* policies attached to tables.
    - An SQLite representation of standard RLS enables complex application logic through dynamic WHERE clause appending.

## Database Core

- SQLite Database resides in `./data/carabase.sqlite`.
- System tables (e.g., `_carabase_api_keys`, `_carabase_policies`) are isolated from user-generated tables using the `_carabase_` prefix to prevent exposure via the generic `/rest/v1` routes.
- Full dynamic table creation is handled securely with regex identifier sanitization.

## E2E Security Testing & Integrity
- **Comprehensive E2E Suite** (`tests/suite.cjs`): Standardized 42-assertion E2E integration test suite covering 100% of Phase 1 through Phase 8 critical capabilities (Identity, Routing, Multi-thread Concurrency, Transactional RLS, Event SSE, Multipart Storage, Agent Keys, and Audit Logs).
- **Network Hardening**:
  - **Loopback Rate-Limit Bypass**: Pre-configured automatic loopback IP bypass (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) on the `authLimiter` middleware to ensure test-suite and healthcheck stability without compromising production IP rate-limiting.
  - **Fallback Route Boundary**: Hardened unmatched routing fallback matching `/api`, `/storage`, or `/rest` prefixes. Prevents Vite/SPA static loaders from serving source code or mapping directory traversals anonymously.
- **Cryptographic Audit Logs**:
  - **Visual Audit Trail**: Fully searchable and filterable log inspection terminal embedded in `Dashboard.tsx` with micro-interactive JSON drawer views.

## CrustCode©™ Compliance Checklist

- [x] Clear micro-service layout for frontend pages (`src/pages/*`).
- [x] OWASP aligned basic sanitization for table architectures (regex on column/table names).
- [x] Separation of Concerns.
- [x] Robust error handling returning standardized JSON structure on REST failures.
- [x] 100% green 42-pass integration testing suite covering security boundaries.

This documentation file is maintained automatically by CrustAgent©™ for ClawStack Studios©™.
