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

## CrustCode©™ Compliance Checklist

- [x] Clear micro-service layout for frontend pages (`src/pages/*`).
- [x] OWASP aligned basic sanitization for table architectures (regex on column/table names).
- [x] Separation of Concerns.
- [x] Robust error handling returning standardized JSON structure on REST failures.

This documentation file is maintained automatically.
