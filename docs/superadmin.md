# SuperAdmin Portal & Audit

CaraBase provides a powerful built-in dashboard for monitoring system health, managing identities, and introspecting the database schema. This portal is strictly environment-gated to protect the core server.

## The In-Memory Volatile Session

To access the SuperAdmin dashboard (hosted at `/admin-login`), your `.env` file must define the `ADMIN_TOKEN`.

Unlike standard Data API sessions (`api-` tokens) which are saved in SQLite, the SuperAdmin dashboard relies on **In-Memory Volatile Sessions**.

1. The client sends a SHA-256 hash of their `ADMIN_TOKEN`.
2. The server compares it against the hashed `process.env.ADMIN_TOKEN` using a custom `timingSafeCompare` utility.
3. If valid, the server mints an in-memory session (stored in a Node.js `Map()`) with a strict 20-minute sliding Time-To-Live (TTL).
4. The session is bound to the client's `User-Agent`. Mismatches instantly destroy the session.

> [!IMPORTANT]
> **Ephemeral by Design**
> Because no session identifiers are ever written to SQLite, shutting down or restarting the Node server instantly destroys all active SuperAdmin sessions. A stolen database file cannot be reverse-engineered for admin access.

## Sovereign Metadata Visibility

CaraBase takes Data Sovereignty seriously. The dashboard is designed to provide operational oversight.

The dashboard UI allows you to view:
- System Health (RAM usage, Uptime)
- User Identities (UUIDs, Registered Usernames, and Role assignments)
- Schema Structures (Table names, Columns, RLS Policies)
- Automated Database Backups (File names, Sizes)
- The Security Audit Trail

## Cryptographic Audit Trail

Every major systemic event in CaraBase is immutably logged into the `audit_logs` schema. This includes:
- System Startup & Shutdown
- Human Registration
- Session Token Creation & Revocation
- Agent Key Creation
- Custom Dynamic API Registration & Deletion
- RLS Policy Modification

These logs can be searched, filtered, and expanded directly within the SuperAdmin dashboard for total system observability. To prevent DoS attacks via audit log flooding, unauthorized hits are aggressively throttled to 1 log per minute per IP.
