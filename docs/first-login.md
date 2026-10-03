# First Login and Roles

When you first launch CaraBase, it is completely empty. How you perform your first login depends entirely on whether you provided an `ADMIN_TOKEN` during startup.

## The `superlobster` User

CaraBase requires a system-level user to bridge the gap between the SuperAdmin Dashboard (system operations) and the Data API (table operations). This user is affectionately known as the **SuperLobster**.

### Scenario A: You provided an `ADMIN_TOKEN` (Recommended)

If you started your server with an `ADMIN_TOKEN` in your environment variables, CaraBase automatically provisions the `superlobster` account in the background.

1. Navigate to `http://localhost:5353`.
2. You will be redirected to the **Setup Wizard**.
3. You will be prompted to enter your Admin Token.
4. Once completed, you will be in the SuperAdmin Dashboard.

![Screenshot: SuperAdmin Login Screen Placeholder](/placeholders/login-screen.png)

**What happens to the first human?**
Because the `superlobster` was automatically created, it took the 1st slot in the database. When the first human signs up via the public `/setup` route or your application's registration page, they will automatically be assigned the standard `viewer` role.

### Scenario B: You omitted the `ADMIN_TOKEN`

If you did *not* provide an `ADMIN_TOKEN`, the SuperAdmin Dashboard (`/admin-login`) is **completely disabled and inaccessible** (it will return a 503 error).

Instead, CaraBase falls back to a legacy bootstrapping mechanism:
1. Navigate to `http://localhost:5353/setup`.
2. Create an account with a username and a generated ClawKey.
3. Because the database is entirely empty (count = 0), CaraBase will grant this **first registering human** the `superadmin` role.

> [!CAUTION]
> If you expose a CaraBase instance to the internet without an `ADMIN_TOKEN` and without registering the first user yourself, a malicious actor could find your `/setup` page, register, and steal the `superadmin` role. Always use an `ADMIN_TOKEN` in production.

## User Roles Overview

CaraBase uses a strict Role-Based Access Control (RBAC) system for humans interacting with the Data API:

| Role | Permissions | Best For |
|---|---|---|
| `superadmin` | Unrestricted bypass. Can read, insert, update, and delete all rows in all tables, ignoring Row-Level Security (RLS) policies. | You, the developer. |
| `admin` | Unrestricted bypass (same as `superadmin`), but cannot manage system-level tables or other users' roles. | Trusted administrators. |
| `editor` | Subject to RLS policies. | Trusted users who need broader access. |
| `viewer` | Subject to RLS policies. The default role for all new human signups (if count > 0). | Standard end-users of your application. |

## The Dashboard Split

CaraBase provides two different UI dashboards, enforcing a strict boundary between System configurations and Data interactions:

1. **The SuperAdmin Dashboard (`/admin-login`)**: Authenticates using the `ADMIN_TOKEN`. Here you manage table schemas, indexes, storage buckets, RLS policies, server backups, and system audit logs. It uses volatile memory sessions that wipe on server restart.
2. **The Data Dashboard (Default)**: Authenticates using a Human ClawKey (`hu-`). Here you interact with the *contents* of your tables (like a spreadsheet), but you cannot alter the table schemas themselves. 
