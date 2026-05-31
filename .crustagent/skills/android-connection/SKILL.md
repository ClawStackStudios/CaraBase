---
Skill: Android Server-Client Connection Topology & Security Handshake
Role: Systems Connectivity Agent
Description: The required operational constraints, topological mapping, and security handshake patterns for the CaraBase Android Admin Client and Node.js Server connection.
Maintained by: CrustAgent©™
---

# 🦞 CrustAgent©™ Skill: Android Connection Topology

This document outlines the inviolable rules for bridging the CaraBase Web Server and the native Android Admin Client. Any Agent interacting with these endpoints or the client-side network interceptors MUST read this document to understand the full topology.

## 🌉 Core Operating Principle: Map Both Sides of the Bridge

Before altering any code affecting the Admin API or the Android Client's network layer, you must map the topological impact. **Build the floor before the ceiling.**

If you change an endpoint on the server, you must verify the corresponding Jetpack Compose `ViewModel` and Retrofit `Client`. If you change the security headers, you must verify the server's middleware invariants.

### The Topology (Data Flow)
┌────────────────────────────────────────────────────────┐
│ Android Client (Retrofit/OkHttp)                       │
│   ↓ (AuthInterceptor injects `x-admin-session`)        │
│ CaraBase Server (`/api/admin/*`)                       │
│   ↓ (adminAuthLimiter: 5 req/15 min)                   │
│   ↓ (requireAdmin middleware)                          │
│   ↓ (Regex validation: 64-char Hex)                    │
│   ↓ (Context match: User-Agent & IP strict binding)    │
│ Endpoint Logic (Stats, Users, Audits)                  │
└────────────────────────────────────────────────────────┘

## 🔒 The Security Handshake & Invariants

These invariants are non-negotiable. They are the shell protecting the `SUPERLOBSTER` access.

### 1. The Authentication Gate (`POST /api/admin/auth`)
- **Limiter:** Hard-throttled to **5 attempts per 15 minutes** per IP.
- **Input:** Takes `{ adminToken: string }`. The client must NEVER log this plaintext token.
- **Output:** Returns a volatile, 64-character hex `sessionToken`.
- **Client Storage:** The Android client must securely hash and store this token in memory or an encrypted vault (`SecureIdentityVault`), never in plaintext `SharedPreferences`.

### 2. The Context-Bound Session
Sessions are not just a token; they are a bound context.
- **Server:** Stores `{ expiresAt, userAgent, ip }` in an isolated memory map.
- **Validation:** If the `User-Agent` or `IP` changes between requests (e.g., token stolen and replayed on a desktop browser), the session is **immediately destroyed** and an `ADMIN_UNAUTHORIZED` audit is triggered.

### 3. The `requireAdmin` Middleware (The Guard)
Every single request to `/api/admin/*` flows through here.
- Validates the token matches `/^[0-9a-f]{64}$/`.
- Performs a constant-time comparison (`crypto.timingSafeCompare`) to mitigate timing attacks.
- Issues a `401 Unauthorized` if any check fails, and triggers the throttled `auditLogger`.

## 🛠️ Usage Instructions for Agents

If you are tasked with adding a new feature that bridges the server and Android client:

1. **Server-Side Setup:**
   - Add your route to `src/server/routes/admin.ts`.
   - You MUST place it below the `api.use(requireAdmin)` middleware declaration.
   - Example: `api.get('/new-feature', (req, res) => { ... })`
   - Use `applyRls` or direct database `db.prepare()` with extreme caution, ensuring no multitenant data bleeds.

2. **Client-Side Setup (Android):**
   - Locate `CaraBaseClient.kt` or the respective Retrofit interface.
   - Define your endpoint: `@GET("api/admin/new-feature") suspend fun getFeature(): Response<...>`
   - Do NOT manually add headers. The `AuthInterceptor` automatically injects the `x-admin-session` into every request based on the vault's state.
   - Implement the Jetpack Compose `ViewModel` using a `StateFlow` to manage the Loading, Success, and Error states cleanly.

3. **Verify the Invariants:**
   - Does your new route expose sensitive information that a standard user shouldn't see?
   - Does the Android UI elegantly handle the `401 Unauthorized` (e.g., kicking the user back to the Login screen) if the context-bound session expires?
   - If an error occurs, is it safely logged to the server's audit trail without leaking the `ADMIN_TOKEN`?

## 🚨 Troubleshooting

- **429 Too Many Requests:** The `adminAuthLimiter` has triggered. Wait 15 minutes or flush the server memory.
- **401 Unauthorized (Immediate):** Ensure the Android Client's `User-Agent` hasn't dynamically changed, and verify the `x-admin-session` header is perfectly 64 hex characters.
- **Lost Connection:** Check if the Android Emulator is successfully routing `10.0.2.2` to the host machine's localhost environment variables.

> **Remember:** You don't own the codebase. The user does. But you own the quality of the translation layer—between their intention and the code's reality. Verify before you commit.
