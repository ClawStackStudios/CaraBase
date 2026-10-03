---
layout: doc
---

# Introduction to CaraBase

**The Core You Actually Use — Your LAN-First, Self-Hosted SQLite DBaaS.**

CaraBase is an open-source, SQLite-backed Database-as-a-Service (BaaS) designed for developers who want the developer experience of Supabase or Firebase, but with the simplicity, portability, and zero-config nature of a single-file SQLite database. 

It provides all the backend features you need to build modern applications—a dynamic REST API, Realtime subscriptions, Storage, and Row-Level Security—packaged into a single lightweight Docker container.

## What is CaraBase?

Many projects don't need a sprawling, multi-node PostgreSQL cluster. For local tooling, internal dashboards, and medium-scale applications, SQLite is often more than enough. CaraBase wraps SQLite in a secure, opaque-token ecosystem.

CaraBase provides a full suite of backend tools:

- **Database**: A robust SQLite database running in WAL mode with SQLCipher encryption at rest.
- **Dynamic REST API**: Instant REST endpoints (`/rest/v1/:table`) for your tables, plus a Custom API Builder.
- **Row-Level Security (RLS)**: Fine-grained SQLite `WHERE` clause logic injected directly into API reads/writes.
- **Storage**: A secure file storage engine with magic-bytes inspection, dangerous MIME guards, and cryptographic share links.
- **Realtime**: Live SSE event broadcasts synced with database mutations.
- **Dashboard**: A built-in SuperAdmin portal and Setup Wizard to manage tables, users, and system health.

## The Mental Model

CaraBase is designed around a strict separation of concerns, divided into two distinct planes:

1. **The System Plane (Admin Dashboard)**: Accessed via the browser at `/admin-login`. This is the control plane where you manage the server, configure settings, and view audit logs. It is protected by an in-memory volatile session using your `ADMIN_TOKEN`.
2. **The Data Plane (Your App)**: Accessed via the REST API or the client SDKs. This is where your application data lives. It is protected by standard user accounts and Row-Level Security (RLS) policies.

## The Three Doors of Access

When interacting with CaraBase, you will pass through one of three conceptual "doors" depending on your role:

1. **The SuperAdmin (The `ADMIN_TOKEN`)**: The highest level of access. Used to manage the CaraBase server itself. It bypasses all RLS policies and can provision the initial "SuperLobster" root user.
2. **The Agent (The `lb-` token)**: A programmatic access token with full or restricted permissions, designed for server-to-server communication or background workers.
3. **The Human (The `hu-` token)**: An end-user of your application. Humans authenticate with a username and password, and their data access is strictly governed by your Row-Level Security (RLS) policies.

## Next Steps

Ready to get started?

- [Quickstart (5-minute path)](/quickstart) - Launch CaraBase and build your first app.
- [Architecture Deep Dive](/architecture) - Learn how CaraBase works under the hood.
- [Client SDKs](/react-integration) - Connect your frontend app.
