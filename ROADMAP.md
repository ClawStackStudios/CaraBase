---
roadmap_version: 2.0.0
last_updated: 2026-05-23
current_position: "Phase 2: Access Control, Operations & Public Access — Task 08: Global Toast & UI Feedback System"
statistics:
  description: "CaraBase is a LAN-first, self-hosted SQLite database platform — a robust, personal alternative to Supabase. Its goal is to provide the core features everyone actually uses (Auth, RLS, Storage, Real-time, and REST APIs) in a single Docker container, backed by a clean dashboard UI."
  features_completed: "█████████░ 68% (Core Engine, Auth, RLS, SSE, Storage, REST API Builder, Table Editor, Docker)"
  features_in_progress: "░░░░░░░░░░ 0%"
---

# CaraBase Master Roadmap

> Maintained by CrustAgent©™ for ClawStack Studios©™

---

## Completed Milestones Archive
*(Locked. Hardened. Secured. These ship.)*

| Milestone | Status |
|---|---|
| Core SQLite abstraction & dynamic schema migrations | ✅ |
| Dark Mode dashboard UI with circular reveal toggle | ✅ |
| ClawKeys Authentication, Session management, Audit Logging | ✅ |
| System vs. External route isolation & strict middleware chain | ✅ |
| Transactional Row-Level Security (RLS) engine — full CRUD | ✅ |
| Visual Custom REST API Generator (GET/POST/PUT/DELETE) | ✅ |
| Server-Sent Events (SSE) — live database mutation broadcasts | ✅ |
| File Storage with anonymous public URL sharing | ✅ |
| Multi-write DB transactions, server-side validation, confirmation dialogs | ✅ |
| Docker & Docker Compose deployment with SQLite volume mounts | ✅ |
| 50-assertion E2E integration test suite (Phases 1–9) | ✅ |
| UI/UX Alignment (Landing, Auth Flow, Dashboard, Settings, & Sidebar) | ✅ |
| SuperAdmin Dashboard (Metadata, Uptime, Audit Logging, Volatile Sessions) | ✅ |
| Table Editor Viewer Grid & Introspection Drawer | ✅ |
| Table Editor Client Sorting, Search, & Debounced Sidebars | ✅ |
| Table Editor Live Row Inserting, Editing, & Validated JSON Drawer | ✅ |
| Table Editor Optimistic Row Deletion & Dialog Hooks | ✅ |
| Table Editor Visual Schema ALTER/DROP Column Controllers | ✅ |
| Table Editor E2E Test Coverage expansion in suite.cjs | ✅ |

---

## System Design Rule

This roadmap uses a deterministic 3-Phase structure. Each Phase contains exactly 6 tasks, representing the complete forward roadmap from current position to a shippable, self-hosted Supabase replacement.

---

```
------------------ Current Position ------------------
Phase 2 → Access Control, Operations & Public Access
------------------------------------------------------
```

---

## Phase 1: The Table Editor — Core Data Management

> **Phase Feature Set Overview:**
> This phase delivers the most important missing piece of the Supabase experience: the ability to see, explore, and directly manipulate your data inside the dashboard. Success here means a user can point CaraBase at any SQLite database, immediately see its contents in a live grid, edit schemas visually without writing SQL, and manipulate rows directly from the UI. This is the bridge between "API platform" and "full database product."

---

- [x] **Task 01: Dynamic Data Viewer Grid**

  **Description:** In `src/pages/TableEditor.tsx`, implement a live data viewer that fetches rows from the `/rest/v1/:table` endpoint using the current user's system session token. Render data in a high-fidelity, scrollable table grid with sticky column headers. The grid should display column names as headers and all rows as cells. The private key (which bypasses RLS) must be used for system-level dashboard queries. Paginate results with a configurable page size (default: 25 rows) and add Prev/Next controls. Display a loading skeleton while fetching and an empty state illustration if the table has no data.

  > **Success Criteria:** Selecting any table in the sidebar renders its rows in the grid within 300ms. Page controls correctly offset the query. Empty tables display a clean empty-state message. The private key is used for the query — not the public key.

---

- [x] **Task 02: Client-Side Column Sorting & Search**

  **Description:** Enhance the data viewer grid with interactive column headers. Clicking a column header should toggle between ASC and DESC sort order, re-fetching data from `/rest/v1/:table?order_by=<col>&dir=ASC|DESC`. Display a directional arrow indicator on the active sort column. Add a global text search input above the grid that filters the currently loaded page of rows client-side across all visible string columns. Add a table name search input to the left sidebar to filter the list of tables by name. The sidebar input should be debounced at 250ms.

  > **Success Criteria:** Clicking a column header updates the sort indicator and re-fetches sorted data from the backend. The global search input immediately narrows visible rows. The sidebar search narrows the table list correctly. No full page re-renders — state is managed locally within the component.

---

- [x] **Task 03: Interactive Row Insertion & Editing**

  **Description:** Implement a slide-in drawer or modal panel that allows users to insert new rows and edit existing rows. For insertion, the drawer should dynamically generate form fields based on the current table's column schema — introspected from `PRAGMA table_info(<table>)` via a new system API call `GET /api/system/tables/:table/schema`. Each field should use the appropriate input type (text, number, checkbox for boolean, datetime-local for timestamps). On submit, the form POSTs to `/rest/v1/:table` using the private key, and the grid refreshes. For editing, clicking a row opens the same drawer pre-populated with the row's current values, and submits a PATCH to `/rest/v1/:table?<primary_key>=eq.<value>`.

  > **Success Criteria:** A "Insert Row" button opens the drawer with correct dynamically-generated fields. Submitting a valid form inserts a row and updates the grid without a full page reload. Clicking a row opens the drawer pre-populated with its data. Submitting updates the row correctly via PATCH. Validation errors from the server are displayed inline.

---

- [x] **Task 04: Row Deletion with Confirmation**

  **Description:** Add a delete action to each row in the data viewer grid. A trash icon at the end of each row should open a confirmation dialog (reusing the existing `ConfirmDialog` component) before issuing a `DELETE /rest/v1/:table?<primary_key>=eq.<value>` request via the private key. On confirmation, remove the row from the local grid state immediately (optimistic UI) and confirm with the backend. If the backend returns an error, restore the row and display an error toast.

  > **Success Criteria:** Clicking the trash icon shows a confirmation dialog containing the row's primary key for clarity. Confirming removes the row from both the UI and the database. Cancelling leaves the row untouched. A backend error on delete triggers a toast and restores the row in the grid.

---

- [x] **Task 05: Visual Schema Management**

  **Description:** Build a Schema Editor panel within the Table Editor page, toggled from the header (e.g., a "Schema" tab alongside the "Data" tab). The Schema view should introspect the table structure using `PRAGMA table_info` and display each column with its name, type, constraints (PK, NOT NULL, DEFAULT), and a delete action. Allow users to add new columns via an inline form (name, type, constraints). Adding a column should issue an `ALTER TABLE <name> ADD COLUMN <col> <type>` query via `POST /api/system/query`. Column deletion should issue a `DROP COLUMN` query (where SQLite supports it) with a confirmation dialog. The "Create New Table" flow should also support constraint definitions (UNIQUE, NOT NULL, DEFAULT) from the creation form.

  > **Success Criteria:** Schema tab renders all columns with correct types and constraints. Adding a valid column updates the schema view immediately. Attempting to delete a PRIMARY KEY column is blocked with an explanatory error. The Create Table form accepts and applies column constraints correctly.

---

- [x] **Task 06: Table Editor E2E Test Coverage**

  **Description:** Extend `tests/suite.cjs` with a dedicated **Phase 10: Table Editor Integration** block. Using the existing private key credentials from Phase 2 setup, write assertions that cover: (1) creating a new test table with typed columns via the system API, (2) inserting a row via the REST API private key, (3) fetching and verifying the row appears in the REST response, (4) patching (updating) the row and confirming the change, (5) deleting the row and confirming 0 rows are returned, (6) confirming the table schema is readable via the `PRAGMA table_info` system route. All 6 assertions must pass cleanly against a running `npm run dev:server` instance.

  > **Success Criteria:** `node tests/suite.cjs` outputs `Phase 10: Table Editor Integration` with 6 green passes. Overall suite count increases to 56 assertions, all passing.

---

## Phase 2: Access Control, Operations & Public Access

> **Phase Feature Set Overview:**
> This phase secures CaraBase as a production-grade, public-ready platform. It introduces granular role-based access control for multi-user dashboard governance, standardizes the UI feedback system across all async operations, implements automated database backup and recovery, and formalizes Cloudflare Tunnel support as a first-class citizen — making the LAN-first philosophy and optional public access a coherent, documented feature of the product.

---

- [x] **Task 07: Role-Based Access Control (RBAC)**

  **Description:** Introduce a `role` field to the `users` system table (values: `superadmin`, `admin`, `viewer`). `superadmin` has unrestricted access to all system APIs. `admin` can manage tables, keys, policies, and storage but cannot manage users. `viewer` can only access the Table Editor data view in read-only mode. Enforce these roles in the backend middleware chain by checking `(req as any).userSession.role` after authentication and before routing to any `systemApi` handler. Define a `requireRole(minRole)` middleware factory in `src/server/middleware/`. Update the setup wizard to assign the first registered user the `superadmin` role automatically.

  > **Success Criteria:** A `viewer` token cannot access `POST /api/system/keys`, `DELETE /api/system/tables`, or any write system endpoint — returns `403 Forbidden`. An `admin` token can create keys and tables but cannot manage users. A `superadmin` token has unrestricted access. The setup wizard auto-assigns the `superadmin` role to the initial user.

---

- [x] **Task 08: Global Toast & UI Feedback System**

  **Description:** Implement a centralized `ToastContext` in `src/context/ToastContext.tsx` that provides a `useToast()` hook. The hook exposes `toast.success(msg)`, `toast.error(msg)`, and `toast.info(msg)` methods. Toasts should render in a fixed bottom-right stack with smooth slide-in and auto-dismiss (4 seconds) animations. Replace all existing inline error `alert()` calls and ad-hoc error state patterns across the dashboard (TableEditor, RLS, ApiBuilder, Storage, APIKeys pages) with standardized `useToast()` calls. Add a `disabled` + spinner state to all primary action buttons during async operations to prevent duplicate submissions.

  > **Success Criteria:** No `alert()` calls remain in any frontend TSX file. All API errors surface as red toasts. All successful mutations surface as green toasts. All submit buttons are disabled and show a spinner during pending operations. Toasts auto-dismiss after 4 seconds and can be manually dismissed by clicking.

---

- [x] **Task 09: Automated SQLite Backup Engine**

  **Description:** Implement a scheduled backup system in `server.ts` using `node-cron` (or a lightweight equivalent). Every 24 hours, copy the SQLite database file to a `./data/backups/` directory using SQLite's `.backup()` API to ensure a consistent snapshot. Filename format: `carabase-backup-<ISO8601-date>.sqlite`. Retain the 5 most recent backups and delete older ones automatically. Make the backup directory and retention count configurable via `BACKUP_DIR` and `BACKUP_RETENTION_COUNT` environment variables (with documented defaults). Expose a `GET /api/system/backups` endpoint (superadmin only) listing available backups, and a `POST /api/system/backups/trigger` endpoint to manually trigger an immediate backup.

  > **Success Criteria:** The backup cron job creates a valid `.sqlite` copy on schedule. Manual trigger via `POST /api/system/backups/trigger` creates a backup within 5 seconds. `GET /api/system/backups` returns a list of backup filenames and their sizes. Retention policy removes backups beyond the configured count. Backup files are readable and not corrupt (can be opened by `better-sqlite3`).

---

- [x] **Task 10: Cloudflare Tunnel Integration & Public Access**

  **Description:** Document and validate first-class Cloudflare Tunnel support as an officially supported deployment pattern. Create a `docs/cloudflare-tunnel.md` guide with copy-paste setup instructions (installing `cloudflared`, creating a tunnel, pointing it to `localhost:5252`). Add `CLOUDFLARE_TUNNEL_URL` as an optional environment variable. When set, the server should include the tunnel URL in health check responses (`GET /api/health`) and reference it in the storage public URL generation logic — so that uploaded files return the public tunnel URL instead of the LAN IP. Update `README.md` and `docker-compose.yml` to document the optional tunnel configuration.

  > **Success Criteria:** `GET /api/health` returns `{"tunnelUrl": "<CLOUDFLARE_TUNNEL_URL>"}` when the env var is set. Storage file upload returns a public URL using the tunnel URL instead of the LAN address when the var is set. `docs/cloudflare-tunnel.md` contains complete, accurate, copy-paste-ready setup instructions. The feature degrades gracefully — omitting the tunnel URL from responses when the var is not set.

---

- [x] **Task 11: Public Shareable Asset Deep Links**

  **Description:** Extend the storage system to support rich public deep-link URLs for assets. When an asset is uploaded and marked as public, generate a canonical share URL in the format `/storage/v1/share/:assetId`. When that URL is visited in a browser (detected by `Accept: text/html` header), serve a minimal, self-contained HTML preview page that shows the asset (image, video, or a download card for other types) with the file name, upload date, and a "Download" button. When visited by a non-browser client (API/curl), serve the raw file. This enables Joplin-style or Immich-style public sharing directly from the CaraBase dashboard.

  > **Success Criteria:** Uploading a file and marking it public generates a `/storage/v1/share/:id` URL. Visiting the URL in a browser renders an HTML preview page with the asset displayed. A `curl` request to the same URL returns the raw file binary. The preview page renders correctly for images, and shows a download card for non-image types.

---

- [x] **Task 12: Operations E2E Test Coverage**

  **Description:** Extend `tests/suite.cjs` with **Phase 11: Access Control & Operations**. Write assertions covering: (1) a viewer-role token is rejected from a write system endpoint with `403`, (2) an admin-role token can create a table but is rejected from user management endpoints, (3) `POST /api/system/backups/trigger` creates a backup file and returns success, (4) `GET /api/system/backups` lists at least one backup, (5) the storage share URL returns `200` with `Content-Type: text/html` when called with `Accept: text/html`, (6) the storage share URL returns the raw binary when called without an HTML accept header.

  > **Success Criteria:** `node tests/suite.cjs` outputs `Phase 11: Access Control & Operations` with 6 green passes. Overall suite count increases to 62 assertions, all passing.

---

## Phase 3: Developer Ecosystem & SDK

> **Phase Feature Set Overview:**
> This phase completes CaraBase's transformation from a dashboard tool into a full developer platform. It ships the CaraBase JS/TS client SDK — enabling any frontend or agent to integrate with CaraBase exactly as they would with Supabase — and adds advanced SQLite-specific visual tooling (Foreign Keys, Views, Triggers) that makes CaraBase genuinely more powerful than Supabase for database-centric developers. Success here means a developer can swap `createClient(SUPABASE_URL, KEY)` for `createClient(CARABASE_URL, KEY)` and have their app work.

---

- [x] **Task 13: CaraBase JS/TS Client SDK**

  **Description:** Create a standalone `sdk/` directory at the project root containing a lightweight TypeScript library: `carabase-js`. The SDK must expose a `createClient(url, apiKey)` factory that returns a client object with: `.from('<table>').select('col1, col2')`, `.from('<table>').insert({...})`, `.from('<table>').update({...}).eq('col', val)`, `.from('<table>').delete().eq('col', val)`, `.storage.upload(file)`, `.storage.getPublicUrl(path)`, and `.realtime.subscribe('<table>', callback)` (wrapping the existing SSE endpoint). The SDK should be publishable as an npm package and buildable with `tsup`. Write a usage guide in `sdk/README.md`.

  > **Success Criteria:** `createClient(url, key).from('users').select('*')` returns the correct rows. `insert`, `update`, and `delete` correctly mutate data. `.realtime.subscribe` opens an SSE connection and calls `callback` when a mutation fires on the target table. The SDK compiles with `tsc --noEmit` without errors. `sdk/README.md` contains proper usage documentation.

---

- [x] **Task 14: Advanced Schema Features — Foreign Keys & Indexes**

  **Description:** Extend the Schema Editor (Task 05) with Foreign Key and Index management. In the Schema view, add a "Foreign Keys" section that reads from `PRAGMA foreign_key_list(<table>)` and renders each FK relationship (column → referenced table → referenced column). Add an "Add Foreign Key" form. Since SQLite requires table recreation for FK additions, the backend should implement the safe table-copy-and-rename migration pattern in a new `POST /api/system/tables/:table/fk` route. Add an "Indexes" section reading from `PRAGMA index_list(<table>)` allowing users to create new indexes (`CREATE INDEX`) and drop existing ones.

  > **Success Criteria:** The Schema view displays existing Foreign Keys and Indexes for any table. Adding a Foreign Key via the UI results in the correct FK being present in the recreated table (verified by `PRAGMA foreign_key_list`). Creating an index via the UI results in it appearing in `PRAGMA index_list`. Dropping an index via the UI removes it.

---

- [x] **Task 15: Database Views & Triggers**

  **Description:** Add a "Views" section to the dashboard sidebar navigation. Build a `src/pages/Views.tsx` page that lists all user-defined SQLite views (`SELECT name FROM sqlite_master WHERE type='view'`). Allow users to create new views by writing SQL in a code editor input (using a minimal embedded editor or a `<textarea>` with monospace styling), previewing the result, and submitting `CREATE VIEW`. Allow deleting views with a confirmation dialog (`DROP VIEW`). Add a "Triggers" section following the same pattern — listing, creating (`CREATE TRIGGER`), and deleting triggers, with a readonly preview of the trigger body.

  > **Success Criteria:** The Views page lists all existing SQLite views. Creating a valid `CREATE VIEW` statement creates the view and it appears in the list. Deleting a view removes it from `sqlite_master`. The Triggers page lists all existing triggers. Creating a trigger via the UI creates it in the database. Deleting a trigger removes it.

---

- [x] **Task 16: SDK Integration Examples & Migration Guide**

  **Description:** Create a `docs/` directory containing complete, runnable integration examples. Write `docs/react-integration.md` showing a full React component that uses `carabase-js` to fetch, display, and mutate table data — with RLS-aware public key patterns demonstrated. Write `docs/realtime-example.md` showing a live-updating list component using `.realtime.subscribe`. Write `docs/supabase-migration.md` as a comprehensive side-by-side migration guide covering client initialization, CRUD operations, storage, and real-time. All code examples must be syntactically valid and tested against a local CaraBase instance.

  > **Success Criteria:** All three documentation files exist and contain complete, working code examples. The Supabase migration guide covers client init, all CRUD operations, storage upload/download, and real-time subscriptions. The React integration example can be copy-pasted into a new Vite app and function correctly against a running CaraBase instance.

---

- [x] **Task 17: Final E2E Suite & Ecosystem Validation**

  **Description:** Extend `tests/suite.cjs` with **Phase 12: Developer Ecosystem** assertions: (1) `GET /api/system/views` lists the sqlite_master views, (2) creating a view via the system API makes it queryable, (3) the SDK's `createClient().from('table').select('*')` correctly returns data (test by importing the compiled SDK in a Node CJS script), (4) the SDK's `.realtime.subscribe` receives an event payload within 2 seconds of a test insert, (5) the SQL Editor endpoint `POST /api/system/sql` executes a valid query and returns rows, (6) the SQL Editor endpoint rejects a `DROP TABLE` on a system table. Update `CRUSTAGENT.md` files to reflect final system topology.

  > **Success Criteria:** `node tests/suite.cjs` outputs `Phase 12: Developer Ecosystem` with 6 green passes. Overall suite count reaches 68 assertions, all passing. `npm run lint` exits with code 0. All documentation and CRUSTAGENT files are up to date.
## Feature Proposals

- [x] **Task 18: Proxy Share Rate Limiting & Analytics**

  **Description:** With the new ShellProxy membrane, public assets can be hit by anyone with the link. To prevent abuse and provide visibility, we should add an `access_count` integer to the `_carabase_storage_shares` table that increments on every `GET /storage/v1/share/:hash`. Furthermore, we should implement IP-based or global rate-limiting specifically for the public membrane (e.g., max 100 requests per minute per share hash) to prevent DDoS attacks from taking down the CaraBase instance. The Storage Shares Settings panel would then display the total access count for each share, allowing admins to see which public assets are the most popular.

- [x] **Task 19: Dashboard Polish & Supabase UX Alignment**

  **Description:** Perform a comprehensive UI/UX pass to align the CaraBase dashboard more closely with the Supabase dashboard experience. Key improvements: (1) Add breadcrumb navigation showing the current database > table context. (2) Add a global keyboard shortcut system (`⌘K` / `Ctrl+K`) that opens a command palette (list of tables, pages, and actions). (3) Add a "SQL Editor" page (`src/pages/SqlEditor.tsx`) with a `<textarea>` code editor for writing and executing arbitrary SQL queries against the database (superadmin only), with results displayed in a data grid below. (4) Ensure the sidebar collapsibility is persistent across page reloads via `localStorage`.

  > **Success Criteria:** Breadcrumbs correctly reflect the current navigation context. `⌘K` / `Ctrl+K` opens the command palette. The SQL Editor executes a query and renders results in a grid. Invalid SQL displays a formatted error. The sidebar collapse state is persisted across page reloads. No visual regressions on existing pages.

- [x] **Task 20: Guided Wizard & Visual Abstraction Layer (The Lobster Guides)**

  **Description:** Abstract complex database operations (RLS, Schema creation, API generation) into guided, multi-step visual wizards to bridge the gap for beginner users. Instead of raw SQL inputs, the dashboard will offer "Lobster Guides". 
  1. **Table Wizard:** "What kind of data are you storing?" (e.g., Posts, Profiles) -> Auto-generates standard schemas with UUIDs and timestamps.
  2. **RLS Wizard:** "Who should see this data?" Visual toggles for (a) Public, (b) Authenticated Users Only, (c) Only the Creator. The wizard generates the underlying SQLite invisible-ink policies (`author_id = @user_id`) without the user writing a single line of SQL.
  3. **Integration Wizard:** After table and RLS creation, the wizard outputs the exact `carabaseFetch()` or SDK React code required for the frontend, complete with the user's specific `ls-` Public Key already injected.

  > **Success Criteria:** A beginner can create a secured table, apply an RLS policy, and copy a working React frontend code snippet entirely through visual wizard buttons without ever viewing or typing raw SQL or API headers.

---

## Phase 4: Android SDK Native Ecosystem

> **Phase Feature Set Overview:**
> The expansion of CaraBase into a true cross-platform Backend-as-a-Service. This phase delivers `carabase-android`, a Kotlin-native SDK that abstracts the `/rest/v1` API, real-time SSE streams, and authentication into a fluent, type-safe library. 
> 
> **Core Grounding:** "Android SDK Native support for CaraBase"
> **Core Invariant:** "Features around security, not security around features." Security must be the default, invisible membrane. Zero settings leakage. Tokens must be handled by the SDK internally using Android hardware-backed security, eliminating the developer's ability to accidentally leak credentials.

---

- [x] **Task 21: Native Kotlin REST & Auth Membrane**

  **Description:** Build the core networking layer using Ktor or Retrofit + Kotlin Coroutines. Implement a `CaraBaseClient` singleton that accepts the base URL and the `lb-` (Lobster Key). **Security Invariant:** The client must enforce an internal Interceptor that automatically attaches the `Authorization: Bearer <key>` header to every outbound `/rest/v1` request. The developer should never have to manually construct a header. 
  
  > **Success Criteria:** The SDK can initialize `CaraBase.init(URL, KEY)`. A raw internal `get()` call reaches the server and returns 200 OK. The API key is strictly scoped to the internal network interceptor and never exposed in public SDK properties (zero leakage).

---

- [x] **Task 22: Hardware-Backed Encrypted Token Storage**

  **Description:** When the SDK processes human user logins (exchanging `hu-` for `api-` tokens), the resulting ephemeral session token must be stored securely. Do NOT use plaintext `SharedPreferences`. Implement an `EncryptedSessionStorage` class utilizing the Android `EncryptedSharedPreferences` (part of AndroidX Security) backed by the Android Keystore system. 
  
  > **Success Criteria:** Tokens are automatically saved and retrieved during SDK operations. Extracting the app's XML data via ADB root reveals only AES-256-GCM encrypted ciphertext, ensuring the "security around invariants" principle holds natively on the device.

---

- [x] **Task 23: Fluent Type-Safe Query Builder**

  **Description:** Build the developer-facing querying API. Implement Kotlin builder patterns matching the `carabase-js` SDK syntax: `carabase.from("table").select("*").eq("column", "value")`. Use Kotlin generics and kotlinx.serialization to automatically map JSON responses into Kotlin data classes. **Security Invariant:** The query builder must strictly serialize URL parameters to prevent malformed query injection on the client side before it even hits the CaraBase server.
  
  > **Success Criteria:** A developer can execute `val users: List<User> = carabase.from("users").select().execute()` and receive fully parsed, type-safe Kotlin objects. The IDE provides autocomplete for builder methods.

---

- [x] **Task 24: Native Coroutine SSE Real-Time Manager**

  **Description:** Implement `carabase.realtime.subscribe("table")`. Use Kotlin `Flow` to manage the Server-Sent Events (SSE) stream. The manager must run on a background `Dispatchers.IO` thread, automatically parse the `data:` payload from the CaraBase server, and emit Kotlin data classes. It must inherently handle connection drops and automatically attempt exponential backoff reconnection without the developer writing retry logic.
  
  > **Success Criteria:** Subscribing to a table opens a persistent HTTP connection. Modifying the table via the dashboard triggers a Flow emission in the Android app instantly. Turning off WiFi and turning it back on results in the SDK automatically re-establishing the SSE stream without developer intervention.

---

- [x] **Task 25: Storage API & Multi-Part Uploader**

  **Description:** Implement `carabase.storage.upload(filename, byteArray)`. The SDK must handle the `multipart/form-data` chunking natively. It must also provide `carabase.storage.getPublicUrl(path)` which correctly appends the Cloudflare Tunnel URL if the server configuration dictates it, ensuring public assets resolve seamlessly in Android `ImageView` or Glide/Coil loaders.
  
  > **Success Criteria:** A developer can pass an Android `Uri` or `ByteArray` to the SDK and it successfully POSTs to `/storage/v1/upload`. The returned public URL loads correctly in a native Android UI component.