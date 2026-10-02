---
description: Lobsterized Sovereign Protocol — cryptographic sovereignty, zero-knowledge isolation, agent capability boundaries, and Reef Modernist UI directives for the ShellGuard secrets vault.
---

# 🦞 Rule: Lobsterized©™ & ShellGuard Sovereign Protocol

**Core Stance:** I am building and maintaining Lobsterized sovereign software. I prioritize user cryptographic sovereignty, zero-knowledge isolation, and explicit agent capability boundaries over convenience or cloud centralization.

---

## Objective

This rule defines the inviolable security, encryption, authorization, and UI design constraints for the ShellGuard codebase. Every implementation decision **MUST** be evaluated against these directives before code is written. These are not guidelines — they are structural invariants that preserve the zero-knowledge security model.

---

## 🔐 Cryptographic & Auth Directives

### Key Hierarchy Enforcement

**MUST** enforce the three-tier key system with strict separation:

| Type | Format | Purpose | Storage Rule |
|:-----|:-------|:--------|:-------------|
| `hu-` key | `hu-` + 64 hex chars | Human root master key. Identity + ShellCryption seed. | Client-generated. **NEVER** transmit plaintext to server. Send only `SHA-256(hu-)` for login. |
| `api-` token | `api-` + 32 hex chars | Short-lived session bearer token. | Store ONLY in `sessionStorage`. Never persist to `localStorage`. Purge immediately on lock, logout, or session expiry. |
| `lb-` key | `lb-` + 64 hex chars | Lobster / Agent scoped token. Granular permissions, expiry, rate limits. | Revocable in 1 click without affecting human sessions. Hashed server-side. |

### Client-Side ShellCryption©™

**MUST** encrypt all vault items, secure notes, SSH keys, and custom fields client-side using AES-256-GCM.

- **MUST** always bind encryption to item-scoped AAD namespaces:
  - `vault_pearls:{id}`
  - `vault_pearls_totp:{id}`
  - `vault_pearls_custom:{id}`
  - `vault_secure_notes:{id}`
  - `vault_secure_notes_custom:{id}`
  - `vault_ssh_keys:{id}`
  - `vault_ssh_keys_custom:{id}`
  - `vault_secure_attachments:{id}`
- **NEVER** double-encrypt: Exclude client ciphertexts (`custom_fields`, `secret`, `totp_secret`, `content`, `key_value`, `file_data`) from server-side `metadataGuard.ts` re-encryption.
- **SHOULD** use Web Crypto API when available (`crypto.subtle`); **MUST** fall back to pure TypeScript `webCryptoFallback.ts` on plain HTTP LAN origins where `crypto.subtle` is undefined.
- **MUST** use `Blob` + `URL.createObjectURL(blob)` for file downloads instead of `data:` URIs on insecure HTTP origins where Chromium blocks the latter.

### Memory Zeroization

**MUST** on lock or logout:
- Purge `shellKey` from React state immediately.
- Clear all decrypted plaintext secrets (`VaultItem[].secret`, `VaultItem[].totp_secret`, `CustomField.value` for hidden fields) from in-memory state.
- Destroy `sessionStorage` entries (`sg_api_token`, `sg_nav_intent`).

---

## 🛡️ Backend & Data Directives

### Tenant Isolation

**MUST** scope every SQLite query with `WHERE owner_uuid = ?` (or parameterized equivalent). A missing ownership clause is a catastrophic security failure — multi-tenant leakage is the highest-severity bug in the system.

### SQL Safety

**MUST** use 100% parameterized SQL bindings. **NEVER** concatenate strings into queries, even for "simple" or "trusted" values.

### Timing-Attack Immunity

**MUST** use constant-time byte/character comparison (`constantTimeCompare()` from `src/server/utils/crypto.ts`) for:
- Key-hash verification during token issuance.
- Admin token authentication.
- Any other security-sensitive string comparison.

**NEVER** use `===` for security token comparison.

### CORS Hardening

- `CORS_ORIGIN` **MUST** match the configured frontend origin.
- Wildcards (`*`) are **strictly prohibited**.
- `corsConfig.ts` **MUST** be environment-aware (production vs development).

### LAN Origin Resilience

When `crypto.subtle` is unavailable (plain HTTP LAN IPs like Unraid):
- `webCryptoFallback.ts` **MUST** transparently polyfill SHA-256, HMAC-SHA256, HKDF, and AES-GCM-256.
- `shellCryption.ts` **MUST** detect `crypto.subtle` availability and fall back to the TypeScript engine.
- `crypto.ts` **MUST** handle `crypto.randomUUID` being undefined with multi-tier fallback: native → `getRandomValues` v4 UUID → `Math.random` v4 UUID (last resort).

---
## 🤖 Agent Capability Directives

### Permission Mapping

When implementing or modifying Lobster Key routes, **MUST** follow this verb-to-permission mapping:

| HTTP Verb | Permission Required |
|:---------|:--------------------|
| `GET` | `canRead` |
| `POST` | `canWrite` |
| `PUT` / `PATCH` | `canEdit` |
| `DELETE` | `canDelete` |

**MUST** additionally gate sensitive operations with `requireHuman()`:
- Key rotation / Lobster Key minting (`/api/agent-keys`).
- Account deletion.
- Profile modification (`/api/auth/me`, `/api/auth/profile`).
- Settings modification (`/api/settings/:key`).

---

## 🎨 UI & Design Directives (Reef Modernist)

### Theme Tokens

**MUST** always use CSS Custom Properties for dual-mode (dark/light) support:

| Token | Usage |
|:------|:------|
| `--bg-base` | Main background |
| `--bg-surface` | Elevated surfaces (cards, modals, sidebars) |
| `--text-main` | Primary body text |
| `--text-muted` | Secondary / label text |
| `--border-subtle` | Divider and border lines |

### Master-Detail Layout

**MUST** respect the three-pane navigation model:
```
SidebarFolderTree → ItemListPane → ItemDetailPane
```
- Sidebar: navigation, pod tree, filter controls.
- List pane: scrollable item list with search, quick actions, multi-select.
- Detail pane: full item view on desktop; slide-up sheet on mobile (< lg).

### Modal Ergonomics

**MUST** follow these constraints for all modals (e.g. `ItemFormModal`, `PodModal`, `ConfirmDialog`):
- Fixed dialog height: `h-[90vh] md:h-[85vh]`.
- Spacious width: `max-w-3xl`.
- Pinned header and footer (no scroll with the body).
- Internal scrolling: `overflow-y-auto custom-scrollbar`.

### Dropup Menus

When action submenus appear near the bottom of a viewport:
- **MUST** expand upward: `bottom-full mb-2`.
- **MUST** include click-outside backdrop dismissal.
- **SHOULD** use `AnimatePresence` for smooth entry/exit.

### Custom Fields UX

**MUST** render custom field types according to Reef Modernist conventions:

| Type | Render Behavior |
|:-----|:----------------|
| 📝 **Text** | Label, plaintext value, one-click copy button. |
| 🔒 **Hidden** | Label, masked value (`••••••••`), eye toggle reveal, one-click copy button. |
| ☑️ **Checkbox** | Label, boolean status chip (`☑ Enabled` / `☐ Disabled`). |
| 🔗 **Linked** | Label, `Linked to [Property]` badge, dynamically resolved value (password/username/url/notes), copy button. TOTP-linked fields render `TotpDisplay` with live 30s countdown. |

---

## ⛔ Inviolable Anti-Patterns (The "NEVER" List)

These are **hard blocks** — code that violates any of these **MUST** be rejected in review:

- ❌ `NEVER` send a `hu-` human root key to any backend endpoint.
- ❌ `NEVER` store authentication tokens in `localStorage`.
- ❌ `NEVER` execute a database query without `owner_uuid` tenant scoping.
- ❌ `NEVER` use raw string concatenation in SQL queries.
- ❌ `NEVER` double-encrypt client ciphertexts under server `DB_ENCRYPTION_KEY`.
- ❌ `NEVER` introduce hardcoded default pods or categories.
- ❌ `NEVER` use non-constant-time equality (`===`) for security tokens.
- ❌ `NEVER` expose decrypted secret values in API responses — server stores only opaque ShellCryption blobs.
- ❌ `NEVER` register client-encrypted columns (`secret`, `custom_fields`, `totp_secret`, `content`, `key_value`, `file_data`) in `metadataGuard.ts`.
- ❌ `NEVER` render a partially masked secret — masks must cover the ENTIRE value (every character → `•`). Leading/trailing cleartext in a "masked" state is a leak, not a UX affordance. (Masking algorithms that preserve prefixes/suffixes are rejected in review.)
- ❌ `NEVER` call the `hu-` identity key "ShellKey" in user-facing copy or docs — it is a **ClawKey** (canon: ClawKey / ShellCryption / LobsterKeys; see ARCHITECTURE § The ClawKey Method). "Human Key" may appear only as a documented legacy alias.
- ❌ `NEVER` rename cross-project contract identifiers (`deriveShellKey`, `shellKey`, `ShellKeyFallback`, envelope fields) — they are pinned by `project/shellcryption-spec.md` §2 and the companion's `crypto-spec.md`.

---

## Trigger Conditions

**MUST** activate this rule when:
- Adding or modifying any encryption / decryption code path.
- Implementing a new API route or modifying an existing one.
- Creating or altering database schema or queries.
- Designing or modifying UI components, especially modals, menus, or the vault layout.
- Introducing a new key type or authentication mechanism.
- Making changes that affect session lifecycle (login, lock, logout, expiry).

---

## Quality Assurance

Before merging any change governed by this rule, verify:
1. **Tenant isolation**: Every new or modified SQL query includes `WHERE owner_uuid = ?`.
2. **No plaintext keys on the wire**: `hu-` keys are never sent; only SHA-256 hashes.
3. **No localStorage tokens**: `sessionStorage` only for `sg_api_token`.
4. **Constant-time comparison**: `===` is not used for security tokens.
5. **No double encryption**: Client-ciphertext columns are not registered in `metadataGuard.ts`.
6. **Build and tests pass**: `npm test && npm run build` before merge.

---

*Maintained as a `.clinerules` invariant — violations are structural defects, not feature gaps.*
