# Authentication & API Keys

CaraBase abandons traditional JWT architectures in favor of a highly secure **Opaque Token Architecture**. Opaque tokens offer immediate, stateful revocation, preventing the window of vulnerability commonly associated with compromised stateless JWTs.

## Key Types & Prefixes

CaraBase employs specific string prefixes to strictly enforce boundary contexts at the middleware layer.

### 1. Public Keys (`ls-`)
Public keys are designed to be embedded in front-end client applications (React, iOS, Android). 
- **Privileges:** Highly restricted. They **cannot** read or write any data by default.
- **Access Boundary:** Public key access is strictly governed by **Row-Level Security (RLS)** policies. If a table has no RLS policies, an `ls-` request will return zero rows or an explicit `403 Forbidden`.

### 2. Private LobsterService Keys (`ls-p-`)
Private keys are meant exclusively for secure backend environments (e.g., Node.js servers, edge functions).
- **Privileges:** God mode.
- **Access Boundary:** These keys completely bypass all RLS policies. They can read, write, and delete anything within user-defined tables. They should **never** be exposed to the client.

### 3. Human User Keys (`hu-`)
When a human user registers with CaraBase (e.g., via the client API), the system generates a private `hu-` secret.
- **Privileges:** Bound to the specific user's identity (`auth_uid()`).
- **Access Boundary:** This key acts as a permanent credential. The raw `hu-` secret is hashed upon creation and only the hash is stored in the database. 

### 4. Ephemeral Session Tokens (`api-`)
You do not use `hu-` or `lb-` keys to fetch data directly. Instead, you trade them for a temporary `api-` session token.
- **Lifecycle:** Clients call `POST /api/auth/token` providing their `hu-` secret. The server generates an `api-` token, stores its SHA-256 hash in the `api_tokens` table, and returns it to the client.
- **Revocation:** Because the hashes are stored in SQLite, an `api-` token can be instantly invalidated via `POST /api/auth/revoke`, immediately terminating access across the entire system.

## The Dual-Layer Middleware

When making a request to the REST API, you supply two headers:
```http
GET /rest/v1/posts
apikey: ls-live_your_public_key
Authorization: Bearer api-your-session-token
```

The `authenticateDataApi` middleware validates both:
1. It confirms the `apikey` is active. If it's an `ls-`, it arms the RLS engine.
2. It hashes the `Bearer` token and looks up the active session in `api_tokens`.
3. It resolves the underlying User UUID and Role (`viewer`, `admin`, `superadmin`), injecting them into the current request context for the RLS Evaluator.

## Agent Keys / LobsterKeys (`lb-`)

CaraBase supports programmatic **Agent Delegation**. A human user can generate an `lb-` key (LobsterKey).
- **Scope:** Agent keys inherit the identity of the human who created them. If an Agent Key modifies a row, the RLS engine processes it as if the human user performed the action.
- **Granular Permissions:** You can restrict an Agent Key to specific actions (e.g., `canRead: true`, `canWrite: false`).
- **Cross-User Isolation:** IDOR protections prevent User A from listing, modifying, or revoking Agent Keys created by User B.

