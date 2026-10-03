# SQL Editor

While the Table Editor provides a convenient visual interface for most tasks, sometimes you need the raw power of unrestrained SQL execution.

The **SQL Editor** (`/sql`) is a dedicated sandbox for executing raw queries against your SQLite database directly from the browser.

> [!WARNING]
> **SuperAdmin Isolation**
> The SQL Editor executes directly against the system database connection. It completely bypasses all Row-Level Security (RLS) constraints. As such, the SQL Editor is strictly guarded by the `requireRole('superadmin')` backend middleware. It is only accessible if you log in via `/admin-login` with your `ADMIN_TOKEN`. The UI hides this entirely from standard users.

## Features

- **Execution Engine:** Write any valid SQLite syntax (`SELECT`, `INSERT`, `UPDATE`, `CREATE TABLE`, `DROP`, `PRAGMA`, etc.).
- **Data Grid Results:** Successfully executed queries automatically render their results in an interactive data grid below the editor.
- **Error Formatting:** Syntax errors or constraint violations from the SQLite engine are caught and formatted cleanly below the editor, making debugging swift.

## Common Use Cases

The SQL Editor is particularly useful for tasks that cannot be accomplished purely through the visual Table Editor:

- Writing complex `JOIN` queries across multiple tables.
- Running aggregate functions (`SUM`, `COUNT`, `AVG`).
- Performing bulk data migrations or updates.
- Executing `PRAGMA` commands to inspect SQLite internals.
- Creating Views, Indexes, and Triggers (see the [Views, Indexes, & Triggers](/views-indexes-triggers) guide).
