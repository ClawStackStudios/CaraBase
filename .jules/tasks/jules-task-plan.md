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
- **Goal**: Prevent unconstrained storage abuse and malicious payload injection.
- **Requirements**:
  - Enforce maximum upload size limit (e.g. 50MB default configurable via `MAX_UPLOAD_SIZE_MB`).
  - Add magic-byte / file extension validation to reject dangerous executables.
  - Sanitize uploaded file names to prevent path traversal.

---

## Verification Gates
Before opening or submitting any PR:
1. `npm run lint` (`tsc --noEmit`) must exit with code 0.
2. `npm run build` (Vite frontend + esbuild server bundle) must succeed cleanly.
3. `npm test` (`node tests/suite.cjs`) must pass all integration checks against the live server.
