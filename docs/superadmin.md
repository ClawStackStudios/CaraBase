# SuperAdmin Operations

CaraBase provides a powerful built-in dashboard for monitoring system health, managing identities, and introspecting the database schema. This portal is strictly environment-gated.

## Environment Gating

To access the SuperAdmin dashboard (hosted at `/admin`), your `.env` file must define the `ADMIN_TOKEN` variable:
```env
ADMIN_TOKEN=your_secure_password
```

### Stateless Volatile Sessions

Unlike typical applications that persist session tokens or JWTs to the database, the SuperAdmin dashboard relies on **In-Memory Volatile Sessions**.

1. The client sends their `ADMIN_TOKEN` via a login request.
2. The server mints an in-memory session (stored in a Node.js `Map()`) with a strict 20-minute sliding Time-To-Live (TTL).
3. The session ID is set as a secure, `httpOnly` cookie.

Because no session identifiers are ever written to SQLite, shutting down or restarting the Node server instantly destroys all active SuperAdmin sessions across the entire system. This prevents persistent token theft.

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
