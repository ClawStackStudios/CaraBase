# Jules Knowledge & Memory Integration

This document contains structured, high-density declarative memory units for **Google Jules**. Jules can synthesize and ingest these units directly into its persistent memory system.

---

## Git & Repository Topology

- Never force-reset, rebase root, or force-push the main branch. Commit 540a887 on main contains the complete repository with 160+ files.
- When resolving multiple pull requests or merge conflicts, create separate clean commits for distinct concerns (security patches, Docker updates, dependency bumps) rather than a giant squash commit.
- Always remove temporary shell scripts (e.g., fix_*.sh, patch_*.sh) and clean up git conflict markers (<<<<<<<, =======, >>>>>>>) before committing or building Docker images.
- Always verify file presence before planning deletions or refactors by running `git ls-tree -r --name-only HEAD`.

---

## Server Architecture & Database Core

- The project is a Node.js (TypeScript) web server using Express and better-sqlite3-multiple-ciphers for its encrypted SQLite database.
- The SQLite database resides in `./data/carabase.sqlite`, running in WAL mode with automatic daily non-blocking backup snapshots.
- System tables use the `_carabase_` prefix (e.g., `_carabase_api_keys`, `_carabase_policies`) and are permanently isolated from generic `/rest/v1` routes.
- Dynamic SQL generation in schema-building or query endpoints must sanitize every table name, column name, and column data type through `safeIdent()` to prevent SQL injection.
- In `server.ts` `/tables` schema creation, column definitions must use `const safeType = c.type ? safeIdent(String(c.type)) : 'TEXT';` while preserving `primaryKey`, `unique`, `nullable`, and `defaultValue` column modifiers.

---

## Docker & Container Runtime

- The `Dockerfile` uses a 3-stage build based on `node:25-bookworm` (builder), `node:25-bookworm` (prod-deps), and `node:25-bookworm-slim` (runner).
- Docker container builds require `python3`, `make`, and `g++` installed via `apt-get` in the builder and prod-deps stages for native compilation of `better-sqlite3-multiple-ciphers`.
- The container entrypoint script `docker/entrypoint.sh` dynamically configures PUID/PGID user permissions and data directory ownership.

---

## Testing, Verification, & CI Pipeline

- To run tests, use `npm test` (`node tests/suite.cjs`). To lint code, use `npm run lint`. To build the main project, use `npm run build`.
- The project contains an SDK in the `sdk/` directory, which requires its own setup and must be built before E2E tests: `cd sdk && npm ci && npm run build`.
- E2E tests (`npm test`) require the development server to be actively running on port 5353 first (e.g., by running `npm run scuttle:dev-start &` beforehand), and stopped with `npm run scuttle:stop`.
- GitHub Actions CI (`.github/workflows/ci.yml`) validates all pull requests via three parallel gates: `Lint & Build`, `E2E Suite`, and `Docker Build`.
- Loopback IP addresses (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) are permanently exempted from `authLimiter` middleware to protect test-suite and healthcheck stability.

---

## Security & Access Control

- CaraBase uses three distinct API token tiers: Human Sessions (`hu-`), Service/Public Keys (`ls-` / `api-`), and Sandboxed Agent Keys (`lb-`).
- Agent keys (`lb-`) have strict Row-Level Security (RLS) enforcement and are completely barred from accessing system tables or admin endpoints.
- SuperAdmin sessions are volatile in-memory Maps with a rolling 20-minute TTL, destroyed immediately upon server restart.
- The SuperAdmin dashboard renders health and system stats, but strictly forbids browsing table rows or file content to maintain zero-knowledge data sovereignty.
- Plaintext admin tokens are never transmitted: the client computes SHA-256 via WebCrypto (`crypto.subtle.digest`) and the server validates via `timingSafeCompare()`.

---

## Component Granularity Guidelines

- Target file granularity is ~250 lines of code per file, with a hard ceiling of 500 lines. Files exceeding 500 lines (e.g., `server.ts`, `TableEditor.tsx`) must be decomposed into modular feature directories or sub-routers.
