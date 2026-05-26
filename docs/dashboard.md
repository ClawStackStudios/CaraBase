# Advanced Dashboard Tools

CaraBase is designed not just as a silent backend, but as a robust visual interface for the Orchestrated Reef Scuttler. The SuperAdmin Dashboard is equipped with enterprise-grade tooling to ensure you can build, query, and migrate your database without leaving the browser.

## 1. Global Command Palette (`⌘K`)

The CaraBase dashboard features a global, keyboard-driven navigation system. 

By pressing `Cmd + K` (or `Ctrl + K` on Windows/Linux), you immediately summon the Command Palette from any page.

### Features:
- **Fuzzy Search:** Type the name of any table (e.g., `users`, `posts`) to instantly jump to its Table Editor view.
- **Action Shortcuts:** Jump straight to critical pages like "API Keys", "Storage", or "Policies" without touching the mouse.
- **Efficiency:** The palette maintains focus and supports standard Arrow Key and Enter navigation, allowing power users to navigate the entire platform seamlessly.

## 2. Raw SQL Editor

While the Table Editor provides a beautiful visual grid for managing rows, there are times when you need the raw power of unrestrained SQL execution. 

Located at `/sql`, the **SQL Editor** is a dedicated sandbox for the SuperAdmin:
- **Execution Engine:** Write any valid SQLite syntax (`SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`, `DROP`, etc.).
- **Data Grid Results:** Successfully executed queries automatically render their results in an interactive data grid below the editor.
- **Error Formatting:** Syntax errors or constraint violations from the SQLite engine are caught and formatted cleanly below the editor, making debugging swift.

> [!WARNING]
> **SuperAdmin Isolation**
> The SQL Editor executes directly against the system database connection. It completely bypasses Row-Level Security (RLS) constraints. As such, the `/api/system/sql` endpoint is strictly guarded by the `requireAdmin` middleware. Agent Keys (`lb-`) and API Tokens (`api-`) will instantly trigger a `403 Forbidden` if they attempt to access it.

## 3. The "Lobster Guides" (Visual Wizards)

For users who want to scaffold infrastructure without writing raw SQL, the dashboard provides Guided Wizards.

### Setup Wizard
The Setup Wizard bridges the gap between raw infrastructure and working applications. It visually walks you through creating architecture:
1. **Table Scaffolding:** Visually define columns and types.
2. **RLS Generation:** Using visual toggles (e.g., "Only the Creator", "Public"), the wizard automatically generates the invisible-ink SQLite policies (`author_id = @user_id`) without requiring you to write a single line of SQL.

## 4. The Connect Integrator

Once your tables are scaffolded and secured, you need to connect your frontend. The **Connect Modal** (located in the top right of the dashboard header) serves as your integration hub.

When you select an active table, the Connect Integrator dynamically generates two distinct integration paths:

### Direct API Connection
For environments without the CaraBase SDK, this path generates raw `fetch()` snippets. 
- It dynamically injects the correct `/rest/v1/{table}` route.
- It automatically appends your specific `ls-` Public Key into the headers.

### Framework Client
For modern frameworks (Next.js, Vite, React Native), this path provides the exact SDK initialization logic required.
- **Client Components:** Snippets for standard browser usage (`createClient()`).
- **Server Components (SSR):** Specific snippets for Next.js Server Actions and API Routes, handling cookie injection and middleware bindings natively.
