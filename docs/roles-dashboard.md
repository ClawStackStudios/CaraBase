# Roles and the Dashboard Split

CaraBase enforces a strict architectural boundary between **System Operations** (configuring the server) and **Data Operations** (manipulating rows in your tables). This separation is reflected in both the roles system and the dual-dashboard UI.

## The Dual-Dashboard Isolation

CaraBase provides two distinct web interfaces, completely isolated from one another at the network and authentication layers:

### 1. The SuperAdmin Dashboard (`/admin-login`)
This is the system control plane.
- **Authentication:** Requires the `ADMIN_TOKEN` provided in your `.env` file.
- **Session Mechanics:** When you log in, the server generates a volatile session (`cb_admin_session` cookie). This session is kept purely in server memory (`Map<string, AdminSession>`) and expires after 20 minutes (sliding window). It is **never persisted to SQLite**, ensuring that a server restart instantly wipes all dashboard access.
- **Capabilities:** Schema creation (Table Editor), managing system configurations, viewing system audit logs, and managing users.
- **Boundary:** An `admin_session` cookie cannot be used to query data endpoints via the standard REST API.

### 2. The Data Dashboard (The default view)
This is your application's data plane, acting like a spreadsheet viewer for your tables.
- **Authentication:** Requires a standard user account and Human ClawKey (`hu-`). 
- **Session Mechanics:** Authenticates via the standard `api-` session token flow.
- **Capabilities:** Viewing, inserting, and deleting rows in tables—subject entirely to Row-Level Security (RLS). You cannot alter table schemas (columns/types) from this dashboard.
- **Boundary:** An `api-` token cannot access `/api/admin/*` system endpoints. 

## User Roles (RBAC)

When a human registers via the public API, they are assigned a role. This role dictates their baseline capabilities *before* RLS is evaluated.

| Role | System Capabilities | RLS Evaluation |
|---|---|---|
| `superadmin` | Can access system tables. | **Bypassed.** Can read/write all rows. |
| `admin` | Cannot manage other users' roles or system tables. | **Bypassed.** Can read/write all rows. |
| `editor` | None. | **Enforced.** Subject to user-defined policies. |
| `viewer` | None. | **Enforced.** Subject to user-defined policies. |

### The `superlobster` Bridge
To allow the System Administrator (who logs in with the `ADMIN_TOKEN`) to interact with the Data API as a `superadmin`, CaraBase provisions a special user at boot: the `superlobster`.

- UUID: `00000000-0000-4000-8000-superlobster`
- Role: `superadmin`
- Key Hash: The SHA-256 hash of the current `ADMIN_TOKEN`.

By projecting the `superlobster` into the `users` table, CaraBase ensures that all Data API hits strictly adhere to standard identity resolution, rather than hardcoding backend exceptions for the admin.
