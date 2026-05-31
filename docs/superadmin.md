# SuperAdmin Operations

CaraBase provides a powerful built-in dashboard for monitoring system health, managing identities, and introspecting the database schema. This portal is strictly environment-gated.

## Environment Gating

To access the SuperAdmin dashboard (hosted at `/admin`), your `.env` file must define the `ADMIN_TOKEN` variable:
```env
ADMIN_TOKEN=your_secure_password
```

### The In-Memory Session Vault

Unlike typical applications that persist session tokens or JWTs to the database, the SuperAdmin dashboard relies on **In-Memory Volatile Sessions**.

1. The client sends their `ADMIN_TOKEN` via a login request.
2. The server mints an in-memory session (stored in a Node.js `Map()`) with a strict 20-minute sliding Time-To-Live (TTL).
3. The session ID is set as a secure, `httpOnly` cookie.

> [!IMPORTANT]
> **Ephemeral by Design**
> Because no session identifiers are ever written to SQLite, shutting down or restarting the Node server instantly destroys all active SuperAdmin sessions across the entire system. This prevents persistent token theft. A severed database cannot be reverse-engineered for admin access.

### Cryptographic Handshakes

The raw plaintext `ADMIN_TOKEN` is never transmitted over the network. 
1. When a user clicks "Login", the client-side `AdminContext.tsx` generates a SHA-256 hash of the password input using the browser's native `crypto.subtle.digest()`.
2. It transmits this hash.
3. The Express backend hashes its own `process.env.ADMIN_TOKEN` and performs a `crypto.timingSafeCompare()` against the client's payload.

This architecture entirely mitigates timing attack vectors and raw credential leaks.

## Sovereign Metadata Visibility

CaraBase takes Data Sovereignty seriously. The SuperAdmin Dashboard is designed to provide operational oversight without invading user privacy.

The dashboard UI allows you to view:
- System Health (RAM usage, Uptime)
- User Identities (UUIDs, Registered Usernames, and Role assignments)
- Schema Structures (Table names, Columns, RLS Policies)
- Automated Database Backups (File names, Sizes)
- The Security Audit Trail

The dashboard **strictly prohibits** viewing the content (rows) of user-defined tables. A SuperAdmin can see that `user_table_alpha` exists and has a `password` column, but they cannot query the rows through the UI.

## Cryptographic Audit Trail

Every major systemic event in CaraBase is immutably logged into the `audit_logs` schema. This includes:
- System Startup & Shutdown
- Human Registration
- Session Token Creation & Revocation
- Agent Key Creation
- Custom Dynamic API Registration & Deletion
- RLS Policy Modification

These logs can be searched, filtered, and expanded directly within the SuperAdmin dashboard for total system observability.

---

## The Dual-Dashboard Architecture & SuperLobster Identity

CaraBase is fundamentally designed as a Backend-as-a-Service (BaaS). To support this horizontally scalable model, CaraBase enforces a strict Role-Based Access Control (RBAC) topology across **two distinct dashboard interfaces**:

#### The `superadmin` Role (The SuperLobster)
To manage the database schema, write APIs, and handle backups, you must log into the Main Dashboard as the **SuperLobster**. 

The SuperLobster is an omnipotent identity automatically injected into the CaraBase database on boot. When the server starts, it reads the `ADMIN_TOKEN` from your `.env` file, hashes it, and maps it to a permanent `superlobster` user with `superadmin` privileges.

**To access the Main Dashboard as SuperLobster:**
1. Navigate to the specialized `/admin-login` route instead of `/login`.
2. Enter your raw `ADMIN_TOKEN` string.
3. The system will cryptographically verify the token, issue a session, and grant you full access to all structural tools (SQL Editor, Table Editor, Backups, API Builder, etc.).

**To access the SuperAdmin Operations Dashboard as SuperLobster:**
1. Navigate to the specialized `/admin` route instead of `/login`.
2. Enter your raw `ADMIN_TOKEN` string.
3. The system will cryptographically verify the token, issue a session, and grant you full access to all the tools you need to manage your app (system health, process management, user audits, and security metrics).

#### The SuperAdmin Operations Dashboard (`/admin`)
This is the original, isolated dashboard discussed above. It is used strictly for meta-level observability: system health, process management, user audits, and security metrics. It does not provide direct access to mutate data or schema. Authentication is handled ephemerally via in-memory sessions. 

#### The SuperAdmin Login Page (`/admin-login`)
This is the login page for the main dashboard when logged in as the SuperLobster. It is used to access the main dashboard and to log out of the main dashboard as the SuperLobster.

This is a separate login page from the /login page, which is used to log in as a standard user. The key used for the admin login page is the ADMIN_TOKEN from the .env file. In a production environment, the login page should be secured with https and ADMIN_TOKEN should be a strong, random string. 
The admin login page is not visible to standard users, and options in the main dashboard for SuperLobster are not visible to standard users.

---

### 2. The Main BaaS Dashboard (`/dashboard`)
This is the primary workspace where schemas are built, policies are defined, and data is managed. Because CaraBase supports multi-tenant applications, standard users can generate ClawKeys and log into this dashboard to manage their own specific slices of data (bound by Row Level Security). 

To prevent standard users from modifying the database schema or viewing systemic settings, the Main Dashboard enforces strict RBAC:

#### The `viewer` Role (Standard Users)
When a normal human user creates a ClawKey and logs into the main dashboard, they are assigned the `viewer` role. Their UI is heavily restricted to prevent structural modifications:
- **Allowed:** They can only access the **Dashboard** overview, the **Setup Wizard**, their **Policies** (to manage their own RLS conditions), and the **Storage Ecosystem** (for managing file buckets/shares).
- **Restricted:** They cannot see the Table Editor, SQL Editor, Triggers, Views, Indexes, API Builder, Keys, or Backups. If they attempt to forge API requests to these endpoints, the backend will reject them with a `403 Forbidden` error.
