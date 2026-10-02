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
