# Administrator Setup & Access Control

CaraBase enforces a strict Role-Based Access Control (RBAC) topology to support multi-tenant, horizontally scalable Backend-as-a-Service (BaaS) applications. Central to this architecture is the **SuperLobster**, an omnipotent identity that possesses total control over the CaraBase instance.

## 1. Defining the `ADMIN_TOKEN`

The foundation of CaraBase's administrative security is the `ADMIN_TOKEN`. This is an environment variable defined in your `.env` file before booting the server.

```env
# .env
ADMIN_TOKEN=your_highly_secure_password_string
```

**What happens on boot?**
When the Node.js backend starts, it automatically reads the `ADMIN_TOKEN`, generates a SHA-256 cryptographic hash of it, and injects a permanent `superlobster` user into the database's `users` table. This user is permanently assigned the `superadmin` role. The plaintext token is never stored.

> [!WARNING]
> **Loss of the Admin Token**
> The `ADMIN_TOKEN` is the singular key to the kingdom. If you lose this token, you will lose the ability to log in as the SuperLobster and you will be unable to modify your database schema or manage system APIs via the UI.

## 2. The Dual-Dashboard Architecture

CaraBase is divided into two distinct portals, each serving a fundamentally different operational purpose. Your `ADMIN_TOKEN` grants access to both, but through different mechanisms.

### A. The Main BaaS Dashboard (`/dashboard`)

This is the primary application interface used to build schemas, write RLS policies, generate APIs, and browse data rows. 

Because CaraBase is a BaaS, standard human users (who sign up via the Setup Wizard or API) can log into this exact same dashboard to manage their own specific slices of data. To protect your infrastructure, the Main Dashboard strictly enforces roles:

- **The `viewer` Role (Standard Users):** Normal users only see the Dashboard overview, the Setup Wizard, their own RLS Policies, and Storage buckets. The Table Editor, SQL Editor, API Builder, and Backups tools are physically hidden from the UI and protected by `403 Forbidden` API gates.
- **The `superadmin` Role (SuperLobster):** To build tables and APIs, you must log in as the SuperLobster.

#### How to access the Main Dashboard as SuperLobster:
1. Navigate to `http://localhost:5454/admin-login` (or your equivalent production domain).
2. Do **not** use the standard `/login` route, which requires a generated ClawKey file.
3. Enter your raw `ADMIN_TOKEN` string into the password field and click Login.
4. You will be authenticated as the SuperLobster, granting you full visual access to the SQL Editor, Table Editor, and all infrastructure tools.

### B. The SuperAdmin Operations Portal (`/admin`)

The Operations Portal is a completely isolated interface focused purely on meta-observability. It does not contain tools to mutate data or build schemas. Instead, it provides oversight of the system's health.

#### How to access the Operations Portal:
1. Navigate to `http://localhost:5454/admin`.
2. Enter your `ADMIN_TOKEN`.

In this portal, you can view:
- **System Health:** CPU usage, memory consumption, and uptime.
- **Security Audit Logs:** A cryptographic trail of every systemic action (Logins, Schema changes, Agent Key generation).
- **Process Oversight:** Active sessions and user identifiers (though RLS prevents viewing their actual table data).

> [!NOTE]
> **In-Memory Volatile Sessions**
> Authentication for the `/admin` portal utilizes an in-memory session vault (Node.js Map) with a 20-minute rolling Time-To-Live. Restarting the server instantly invalidates all active sessions to the Operations Portal, providing an ultimate kill-switch in the event of compromised credentials.
