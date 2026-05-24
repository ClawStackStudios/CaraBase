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

- **Private Keys** (`ls-...`): Bypass all RLS constraints.
- **Public Keys** (`pk_...`): Gated strictly by SQLite policies and UDF context.

## Public Storage, Uploads & Shares (ShellProxy Membrane)

- **Anonymous Downloads**: Public files are shared securely via `/storage/v1/file/:id` which bypasses API auth middleware for easy browser embedding.
- **System Upload Endpoint**: Secured dashboard uploads are routed to `/api/system/storage/upload` via `FormData` and are guarded by human/agent session tokens.
- **ShellProxy Membrane**: File sharing is managed via cryptographic `share_hash` generation. The ShellProxy membrane strictly enforces access boundaries. It rejects bypass attempts using the raw `storage_id` and securely enforces `share_expires_at` expirations (silently returning 404 for expired links). 
- **Dual-Serve Capabilities**: Shared links adapt based on the client's `Accept` header. Browser requests (`text/html`) render a styled Tailwind preview interface, while automated systems receive raw binary streams with strict `X-Content-Type-Options: nosniff` security headers.

## Custom Dynamic REST API Engine

Custom dynamic API routes are built through the Visual API Builder (`src/pages/ApiBuilder.tsx`) and backed by the dynamic interceptor in the Express server.
- **Dynamic Routing**: Defined custom endpoints are persisted in `_carabase_endpoints`. The backend dynamically registers and matches incoming requests to `/rest/v1/custom/:path` against the active endpoint registry.
- **Visual Builder Schema**: Endpoint configurations map a unique path, action, HTTP method (GET, POST, PUT, DELETE), target table, and schema configurations (sorting, pagination, column selection).
- **Restricted Responses**: Response columns are sanitized dynamically on execution. Non-permitted fields (such as `key_hash` or unselected columns) are omitted before output to strictly maintain security barriers.
- **E2E Testing Suite**: Phase 9 test coverage enforces the system's dynamic interceptor, route registration, anonymous custom GET queries with public API keys, restricted column response sanitizations, and route deletion.

## Network Hardening & Testing Topology

- **Loopback Rate-Limit Bypass**: E2E automated test runs fire requests extremely rapidly. In `src/server/middleware/rateLimiter.ts`, loopback IP blocks are explicitly checked and bypassed so test suites can run without trigger flakiness, while keeping production rate limits set to 10 requests per 60 seconds per IP.
- **Fallback Route Boundary**: Any route that does not match Express routing but has backend prefixes (`/api`, `/storage`, `/rest`) is intercepted and rejected with a JSON `404 Not Found` in both dev and production modes. This prevents frontend SPA servers (like Vite) from serving source code or mapping directory traversals when an attacker crafts custom URL paths.
- **Security Audit Console**: Structured system events (such as logins, token creations, and key revocations) are saved into the `audit_logs` schema. The frontend dashboard fetches this feed from `GET /api/system/audit-logs` and displays them dynamically in `src/pages/Dashboard.tsx` with a real-time filter, outcome status indicators, and JSON inspection drawers.

## SuperAdmin Dashboard Engine

- **Stateless Volatile Sessions**: The SuperAdmin panel is gated by an `ADMIN_TOKEN` via `requireAdmin.ts`. Successful logins mint an in-memory session (with a 20-minute sliding TTL window) secured by an `httpOnly` cookie. No session IDs are persisted to disk; restarting the server globally terminates all admin sessions.
- **Client-Side Token Hashing**: The `AdminContext.tsx` handles SuperAdmin logins by generating a SHA-256 hash of the input token before transmission. The backend hashes its environment `ADMIN_TOKEN` and validates against the client payload using `timingSafeCompare()`, eliminating raw key transmissions and mitigating timing attack vectors.
- **Sovereign Metadata Visibility**: `AdminUserList` and `AdminDashboard` components are explicitly designed to monitor database health and operations (Users, Tables, RLS Policies, Database Size, Uptime tracking via boot/shutdown audit logs) without ever querying or exposing actual user table contents.

**Maintained by CrustAgent©™**
