# Jules Task Plan: CaraBase Architecture & Hardening

## Overview
This task plan outlines the immediate refactoring and hardening milestones for CaraBase. All changes must respect Lucas's architectural constraints (separation-by-feature, target ~250 lines per file, 500 lines hard ceiling) and pass all three verification gates (`npm run lint`, `npm run build`, `npm test`).

---

## Task 1: Decompose Monolithic `server.ts`
- **Current State**: `server.ts` is 1,644 lines (over 3x the 500-line hard ceiling). It contains inline implementations of schema management, table CRUD, indexes, foreign keys, views, triggers, telemetry, backups, storage, and custom endpoints.
- **Goal**: Decompose `server.ts` down to `< 250` lines by extracting route groups into dedicated modular routers under `src/server/routes/`.
- **Target Structure**:
  - `src/server/routes/schemaRouter.ts`: Table creation, column management, index creation, foreign keys, views, triggers.
  - `src/server/routes/maintenanceRouter.ts`: Telemetry, volume wipe, and backup management (`/backups`, `/backups/trigger`, `/backups/download`, `/backups/import`).
  - `src/server/routes/queryRouter.ts`: Superadmin raw query execution (`/query`) with guard checks.
  - `src/server/routes/realtimeRouter.ts`: SSE subscription connection handling (`/api/realtime`).
- **Acceptance Criteria**:
  - `server.ts` is under 250 lines of clean Express server bootstrap code.
  - All existing routes remain 100% backward-compatible.
  - `npm run lint` and `npm run build` pass without errors.
  - `npm test` passes all E2E assertions.

---

## Task 2: Decompose Monolithic `src/pages/TableEditor.tsx`
- **Current State**: `src/pages/TableEditor.tsx` is 1,513 lines. It bundles table sidebar navigation, schema editing, data grid with pagination/sorting, row insert/edit drawer, index modal, and foreign key modal into a single file.
- **Goal**: Decompose `TableEditor.tsx` into modular feature components under `src/features/table-editor/`.
- **Target Components** (each target ~150-250 lines):
  - `src/features/table-editor/components/TableSidebar.tsx`: Searchable list of SQLite tables and create table button.
  - `src/features/table-editor/components/TableDataGrid.tsx`: Responsive data grid, sorting headers, pagination controls, inline row actions.
  - `src/features/table-editor/components/TableSchemaTab.tsx`: Column listings, constraints (PK, NOT NULL, DEFAULT), add column form.
  - `src/features/table-editor/components/TableRowDrawer.tsx`: Slide-out panel for inserting and editing table rows.
  - `src/features/table-editor/components/TableIndexesModal.tsx`: Index inspection, creation, and deletion modal.
  - `src/features/table-editor/components/TableFkModal.tsx`: Foreign key inspection and migration modal.
- **Acceptance Criteria**:
  - `src/pages/TableEditor.tsx` acts solely as an orchestrator under 200 lines.
  - No sub-component exceeds 300 lines.
  - UI retains full feature parity and styling.

---

## Task 3: Storage Membrane Validation & Hardening
- **Location**: Storage upload handling (`upload.single('file')`).
- **Goal**: Prevent unconstrained storage abuse, orphaned files, and malicious payload injection.
- **Requirements**:
  - Enforce maximum upload size limit (e.g. 50MB default configurable via `MAX_UPLOAD_SIZE_MB`).
  - Add magic-byte / file extension validation to reject dangerous executables.
  - Unlink `req.file.path` in catch block if database metadata insertion fails to avoid orphaned storage leaks.

---

## Task 4: Fix SQLite WAL Journal Corruption on Backup Restore
- **Location**: `server.ts` (`POST /api/system/backups/import`) & `src/server/utils/backup.ts`.
- **Goal**: Prevent stale WAL and shared memory replay over newly imported databases.
- **Requirements**:
  - Delete `carabase.sqlite-wal` and `carabase.sqlite-shm` immediately after `db.close()` prior to copying the imported backup file over `carabase.sqlite`.
  - Delete partial 0-byte destination files in `doTriggerBackup` if `VACUUM INTO` encounters an error mid-flight.

---

## Task 5: Prevent Phantom Realtime SSE Events & Add Busy Timeout
- **Location**: `server.ts` (REST mutation routes) & `src/server/db.ts`.
- **Goal**: Ensure database mutations and real-time event broadcasting remain strictly atomic and lock-resilient.
- **Requirements**:
  - Defer `realtimeEmitter.emit` until after `db.transaction()` completes and commits, preventing phantom events if RLS checks fail or the transaction rolls back.
  - Configure `db.pragma('busy_timeout = 5000')` in `src/server/db.ts` to prevent immediate `SQLITE_BUSY` exceptions during concurrent writes or backups.

---

## Task 6: Frontend Lifecycle & Navigation Stability
- **Location**: `src/components/ui/CommandPalette.tsx`, `src/context/ToastContext.tsx`, `src/pages/Backups.tsx`, `src/pages/TableEditor.tsx`.
- **Goal**: Eliminate memory leaks, unmanaged timers, and race hazards in the React application.
- **Requirements**:
  - Guard against division by zero in `CommandPalette.tsx` arrow navigation when search results are empty (`filteredCommands.length === 0`).
  - Manage toast timers with a ref map in `ToastContext.tsx` and clear timeouts on unmount and dismissal.
  - Clear `window.location.reload()` timeout in `Backups.tsx` on unmount to avoid delayed reloads after route navigation.
  - Add `AbortController` signal to `fetchTableData` and `fetchTables` in `TableEditor.tsx` to cancel in-flight requests and prevent race conditions when switching tables.

---

## Task 7: SDK Error Normalization & Reconnect Resilience
- **Location**: `sdk/src/QueryBuilder.ts`, `sdk/src/RealtimeClient.ts`.
- **Goal**: Ensure the TypeScript SDK handles non-JSON responses and network disconnects gracefully.
- **Requirements**:
  - Check `response.status === 204` and `Content-Type` before calling `response.json()` in `QueryBuilder.ts` to preserve HTTP status codes and prevent JSON syntax errors on reverse-proxy HTML pages.
  - Implement exponential backoff reconnection with jitter in `RealtimeClient.ts` and clean up `activeSubscriptions` on connection drop.

---

## Verification Gates
Before opening or submitting any PR:
1. `npm run lint` (`tsc --noEmit`) must exit with code 0.
2. `npm run build` (Vite frontend + esbuild server bundle) must succeed cleanly.
3. `npm test` (`node tests/suite.cjs`) must pass all integration checks against the live server.

