---
Brand: ClawStack Studios©™
Project: CaraBase
Maintained by CrustAgent©™

---

# Code Patterns & Principles

## Express REST Pattern

All generic data ingress channels funnel through `/rest/v1/:table`. 
This is governed by the `authenticateDataApi` middleware which processes dual-layer headers:
- `apikey` defines client credentials (e.g., public/private keys).
- `Authorization: Bearer <token>` defines active human/agent session tokens.

## SQLite Transactional RLS Engine

Row-Level Security (RLS) is achieved via `applyRls` in `server.ts` combined with Node's native `AsyncLocalStorage` (`rlsContext` in `src/server/db.ts`).

- **Dynamic Context Binding**: Every incoming request context runs inside `rlsContext.run()`, exposing the current session's `userUuid`, `username`, and `role` to SQLite.
- **Custom SQLite UDFs**: Standard functions `auth_uid()`, `auth_role()`, and `auth_username()` are registered dynamically and bind securely to `rlsContext`.
- **Pre- and Post-Write Transactional Validation**:
  - **SELECT / DELETE**: Appends security filters (`user_id = auth_uid()`) directly to SQL queries.
  - **INSERT**: Runs inside an isolated database transaction. Inserts the row, then queries the inserted row using `rowid` and the `INSERT` RLS filter. If no row is returned, the transaction rolls back immediately with `403 Forbidden`, preventing key and column bypasses.
  - **UPDATE / PATCH**: Runs inside a transaction. Selects rows matching query filters and RLS SELECT/UPDATE filters. Performs the update, then validates each modified row against the `UPDATE` RLS policy using `rowid AS carabase_rowid`. If any check fails, it rolls back.

## Key Security

- **Private Keys** (`sk_...`): Bypass all RLS constraints.
- **Public Keys** (`pk_...`): Gated strictly by SQLite policies and UDF context.

## Public Storage & Uploads

- **Anonymous Downloads**: Public files are shared securely via `/storage/v1/file/:id` which bypasses API auth middleware for easy browser embedding.
- **System Upload Endpoint**: Secured dashboard uploads are routed to `/api/system/storage/upload` via `FormData` and are guarded by human/agent session tokens.

## Network Hardening & Testing Topology

- **Loopback Rate-Limit Bypass**: E2E automated test runs fire requests extremely rapidly. In `src/server/middleware/rateLimiter.ts`, loopback IP blocks are explicitly checked and bypassed so test suites can run without trigger flakiness, while keeping production rate limits set to 10 requests per 60 seconds per IP.
- **Fallback Route Boundary**: Any route that does not match Express routing but has backend prefixes (`/api`, `/storage`, `/rest`) is intercepted and rejected with a JSON `404 Not Found` in both dev and production modes. This prevents frontend SPA servers (like Vite) from serving source code or mapping directory traversals when an attacker crafts custom URL paths.
- **Security Audit Console**: Structured system events (such as logins, token creations, and key revocations) are saved into the `audit_logs` schema. The frontend dashboard fetches this feed from `GET /api/system/audit-logs` and displays them dynamically in `src/pages/Dashboard.tsx` with a real-time filter, outcome status indicators, and JSON inspection drawers.

**Maintained by CrustAgent©™**
