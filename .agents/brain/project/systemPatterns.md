# System Patterns & Architecture

## Topology
CaraBase combines an Express API server with a React single-page frontend:
- **Backend Entry**: `server.ts` compiled via esbuild to `dist/server.cjs`.
- **Frontend Entry**: `src/main.tsx` + `index.html` bundled via Vite into `dist/`.
- **Database Engine**: `better-sqlite3-multiple-ciphers` connected to `data/carabase.sqlite` with WAL mode and SQLCipher encryption (`DB_ENCRYPTION_KEY`).

## Architectural Patterns

### 1. Separation-by-Feature & Granularity
- Target ~250 lines per file; 500 lines is the hard ceiling.
- Each file represents an isolated, testable unit or component.

### 2. Opaque Token Auth Middleware
- Token prefixes determine scope:
  - `hu-`: Human user session tokens (mapped to users table).
  - `api-`: Programmatic API keys with granular scopes and table permissions.
  - `lb-`: Ephemeral session tokens.
- Role hierarchy: `superadmin` > `admin` > `viewer`.

### 3. Dynamic REST API & RLS Membrane
- Dynamic routing under `/api/rest/:table`.
- All table names and column names sanitized via `safeIdent` (alphanumeric + underscore).
- Column types sanitized via `safeIdent` (established by Sentinel PR #13).
- RLS injected into SQL `WHERE` clauses based on calling token identity.

### 4. Realtime Server-Sent Events (SSE)
- Client connects to `/api/realtime`.
- Mutations trigger event broadcasts to connected SSE subscribers filtered by table.

### 5. ShellProxy Membrane (Storage)
- Uploaded files stored in `data/storage/`.
- Downloads gated through expiring `share_hash` tokens.
- Dynamic MIME detection serving inline previews or binary attachments.

### 6. The 4 Universal Invariables (Topological Audit)
Every architectural boundary must resolve these four questions before modification:
1. **Where does state live?** (Ownership & Truth) — Protects consistency and bounds blast radius.
2. **Where does feedback live?** (Observability) — Informs error reporting, audit logs, and monitoring.
3. **What breaks if I delete this?** (Coupling & Fragility) — Defines blast radius and refactoring safety.
4. **When does timing work?** (Async & Ordering) — Eliminates race conditions and event sequence hazards.

### 7. Hardened Route Boundaries & Fallback Routing
- Fallback route handler specifically shields `/api`, `/storage`, and `/rest` paths from Vite/SPA catch-all routes to prevent source reflection or anonymous directory traversal.
- System tables are permanently isolated under the `_carabase_` prefix, completely unmapped from generic REST routes.

### 8. SuperAdmin Volatile In-Memory Sessions
- SuperAdmin access is guarded by `ADMIN_TOKEN`. Sessions live exclusively in volatile in-memory Maps with a 20-minute rolling TTL; process restarts immediately invalidate all sessions.
- Plaintext secrets are never transmitted: the client computes SHA-256 via WebCrypto (`crypto.subtle.digest`) and the server validates via `timingSafeCompare()`.
- Sovereign metadata principle: Dashboard renders health, audit metrics, and schema, but strictly forbids content browsing (table rows, file streams) to preserve zero-knowledge data sovereignty.

### 9. Tri-State Theme Engine & Radial View Transition
- **State Decoupling**: Frontend separates stored user preference (`theme`: `'light' | 'dark' | 'system'`) from runtime visual state (`resolvedTheme`: `'light' | 'dark'`).
- **Dynamic OS Subscription**: Active `matchMedia('(prefers-color-scheme: dark)')` listener triggers seamless theme adaptation when the OS changes modes.
- **Synchronous DOM Mutation with flushSync**: React 18/19 state updates and root `.dark` DOM class changes inside `document.startViewTransition()` are wrapped in `flushSync` to guarantee synchronous DOM commits before the browser takes its post-transition snapshot.
- **Dynamic Radial Clipping**: Radial reveal animations compute viewport hypotenuses from click coordinates, defaulting to screen center for accessibility/keyboard events.

### 10. Defensive Documentation Asset Bundling & Styling
- **Rollup Asset Bundler Boundary**: In VitePress, markdown image links referencing local absolute paths (`/placeholders/...`) are treated as static assets by Vite/Rollup and will cause production builds to crash if uncommitted. Remote placeholder URLs or committed assets in `docs/public/` must be used.
- **Universal Documentation Image Styling**: All images rendered inside markdown pages are globally governed by `.vp-doc img` in `custom.css` (auto-centered, `max-width: 100%`, `height: auto`, rounded corners, and brand border tokens) to ensure zero inline wrapper pollution and guaranteed responsive safety.

### 11. Read Introspection vs. Mutation Authorization Boundary
- **Baseline Authentication**: All internal system routes (`/api/system/*`) are authenticated globally via `systemApi.use(requireAuth, sandboxAgentKeys)`.
- **Introspection Availability**: Introspection endpoints (`GET /tables`, `/columns`, `/schema`, `/indexes`, `/foreign_keys`, `/rows`) are intentionally open to all authenticated roles (including `viewer`), allowing the frontend Table Editor to render schema structures and data safely.
- **Mutation Isolation**: Role escalation (`requireRole('admin')` or `requireRole('superadmin')`) is strictly reserved for mutating operations (`POST`, `DELETE`, `PATCH`). Locking read introspection to admin breaks non-admin dashboard sessions.

### 12. Prepared Statement Lifecycle in Better-SQLite3
- **Compilation Overhead**: In `better-sqlite3`, `db.prepare(...)` compiles SQL statements into native bytecode. Executing `db.prepare(...)` inside a `for` loop causes $O(N)$ repeated compilation overhead per row.
- **Hoisting Principle**: Statement compilation must be hoisted outside the loop ($O(1)$) into a reusable statement handle, calling `.run(...)` or `.get(...)` inside the iteration loop.

→ Consolidated to `long-term/patterns.md § docs-bow-to-code` (weight: 3, 2026-10-03)
→ Consolidated to `long-term/patterns.md § multi-agent-fleet-coordination` (weight: 4, 2026-10-09)


