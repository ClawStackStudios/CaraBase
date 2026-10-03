# Key Types & Prefixes

CaraBase abandons traditional JWT architectures in favor of a highly secure **Opaque Token Architecture**. Opaque tokens offer immediate, stateful revocation, preventing the window of vulnerability commonly associated with compromised stateless JWTs.

CaraBase employs specific string prefixes to strictly enforce boundary contexts at the middleware layer. Here is the complete taxonomy of keys you will encounter:

## The Key Taxonomy

### 1. Human Keys (`hu-`)
When a human user registers with CaraBase (e.g., via the client API), the system generates a private `hu-` secret.
- **Purpose:** Long-lived credential representing a human identity.
- **Storage:** The raw `hu-` secret is hashed upon creation (SHA-256) and only the hash is stored in the database (`users.key_hash`). You only see the raw key once.
- **Usage:** You do not use `hu-` keys to query data directly. You exchange them for an ephemeral `api-` session token.

### 2. Lobster Agent Keys (`lb-`)
CaraBase supports programmatic **Agent Delegation**. A human user can generate an `lb-` key (LobsterKey) via the API or Dashboard.
- **Purpose:** Server-to-server communication, background workers, or AI agents.
- **Scope:** Agent keys inherit the exact identity and Role of the human who created them. If an Agent Key modifies a row, the Row-Level Security (RLS) engine processes it as if the human user performed the action.
- **Storage:** Stored as a hash in `agent_keys.api_key_hash`.
- **Sandboxing:** Agent keys are strictly sandboxed by the `sandboxAgentKeys` middleware. Even if an agent key belongs to a `superadmin`, it is structurally blocked (`403 Forbidden`) from accessing system-level administration routes (like schema migrations or backups).

### 3. Session Tokens (`api-`)
This is the token you actually use in the `Authorization: Bearer` header to fetch data.
- **Lifecycle:** Clients call `POST /api/auth/token` providing their `hu-` or `lb-` secret. The server generates a 32-character `api-` token and returns it.
- **Revocation:** Because the hashes are stored in the `api_tokens` SQLite table, an `api-` token can be instantly invalidated via `POST /api/auth/revoke`.

### 4. Legacy Public Keys (`ls-`)
Public keys are designed to be embedded in front-end client applications.
- **Privileges:** Highly restricted. They arm the RLS engine but **cannot** read or write any data by default unless an RLS policy explicitly allows public access.
- **Storage:** Stored in plaintext in the `_carabase_api_keys` system table.

### 5. Legacy Private Keys (`ls-p-`)
Private keys are meant exclusively for secure backend environments.
- **Privileges:** God mode. They synthesize a `private` request context that completely bypasses all RLS policies.
- **Warning:** These keys should **never** be exposed to the client.

## The Authorization Header

When making a request to the REST API, you supply your session token in the Authorization header:

```http
GET /rest/v1/posts
Authorization: Bearer api-your-session-token
```

The `requireAuth` middleware validates the token:
1. It hashes the token and looks up the active session in `api_tokens`.
2. It queries the `users` (for humans) or `agent_keys` (for agents) table to resolve the underlying User UUID and Role (`viewer`, `admin`, `superadmin`).
3. It outputs an `AuthRequest` context that the RLS evaluator uses to execute policies.
