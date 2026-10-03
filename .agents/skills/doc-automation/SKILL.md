---
name: doc-automation
description: >-
  Deterministic documentation automation skill for CaraBase and VitePress. Ensures documentation
  100% bows to code, stays perpetually synchronized with source reality, eliminates snippet rot
  via region imports, and verifies API contracts through automated claim batteries.
---

# 📚 Deterministic Doc Automation: Docs Bow to Code

This skill provides the authoritative engineering protocol, automation patterns, and authoring standards for CaraBase documentation powered by VitePress. It operationalizes a foundational law of the codebase: **The documentation 100% bows to the code, and must never drift from shipped reality.**

---

## 🏛️ The Foundational Law: Direction of Truth

```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTABLE SOURCE CODE                   │
│   (server.ts, routes/, context/, sdk/, better-sqlite3)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ enforces reality
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTOMATED TEST FIXTURES                   │
│              (tests/suite.cjs, assertions 1..14)            │
└──────────────────────────────┬──────────────────────────────┘
                               │ verifies truth
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               VITEPRESS LIVING DOCUMENTATION                │
│                 (docs/*.md, docs/.vitepress/)               │
└─────────────────────────────────────────────────────────────┘
```

> **The Sovereign Rule:** When a document contradicts shipped, verified code, **the document is the defect**. Never alter working, security-hardened code to accommodate stale prose. Correct the documentation corpus immediately.

---

## 🎯 When to Use This Skill
- Adding, updating, or refactoring CaraBase documentation pages in `docs/`.
- Documenting new REST endpoints, RLS policies, SDK functions, or storage membranes.
- Embedding code snippets into VitePress using zero-rot region imports.
- Running claim battery audits to prove documentation claims match literal code.
- Automating VitePress documentation builds and GitHub Pages deployments.

---

## 🔬 The 4 Pillars of Deterministic Documentation Sync

### Pillar 1: Source-Linked Snippets via Region Ingestion (`<<< @/...#region`)
**The Anti-Pattern:** Manually copy-pasting code into markdown blocks. Copy-pasted code rots the moment a function signature, import, or parameter name changes.

**The Automation:** VitePress natively supports importing code snippets directly from source files using region markers.

1. **Mark the source code:** Wrap tested, production code with region comments:
   ```typescript
   // src/context/ThemeContext.tsx
   // #region view-transition-flushsync
   const transition = (document as any).startViewTransition(() => {
     flushSync(() => {
       setThemeState(newTheme);
       const root = document.documentElement;
       if (targetResolved === 'dark') {
         root.classList.add('dark');
       } else {
         root.classList.remove('dark');
       }
       localStorage.setItem('cb_theme', newTheme);
     });
   });
   // #endregion view-transition-flushsync
   ```

2. **Ingest in VitePress markdown:** Reference the region dynamically:
   ```markdown
   <<< @/../src/context/ThemeContext.tsx#view-transition-flushsync
   ```

3. **Invariable Benefit:** When the source code is refactored, the documentation updates **automatically at build time**. If the source fails to compile or the region is deleted, `npm run docs:build` immediately fails in CI, preventing documentation rot from reaching production.

---

### Pillar 2: Test-Verified Living Code (The Test Oracle)
Documentation code samples must never be hypothetical pseudocode. Every code snippet presented to developers must be validated by the automated test suite.

- **The Oracle Standard:** Every cURL command, TypeScript SDK invocation, or SQL query in `docs/` must mirror an active assertion in `tests/suite.cjs` or `sdk/test/`.
- **Snippet Testing:** Store standalone example scripts under `examples/` or test fixtures, verify them in the test suite, and ingest them directly into `docs/`.

---

### Pillar 3: Claim Battery Verification & Code Grepping
Before writing or modifying any behavioral claim in documentation, run the **Claim Battery**:

| Step | Action | Execution |
| :--- | :--- | :--- |
| **1. Grep Code** | Grep the enforcing implementation in source code. | `grep -rn "dangerousMimes" server.ts` |
| **2. Enumerate Literals** | Cite exact constants, environment variables, or regexes. | Cite exact MIME types: `application/x-msdownload`, `application/x-sh` |
| **3. Assert Test Hit** | Verify the claim has a passing assertion in test fixtures. | Verify `tests/suite.cjs` Phase 6 or Phase 12 passes |
| **4. Align Wire Contract** | Ensure documented status code and response body match runtime. | Distinguish `401 Unauthorized` vs `403 Forbidden` |

**Invariant:** Never document neighbor configurations from memory (e.g. assuming auth rate limits and admin rate limits share the same threshold). Always inspect the literal config.

---

### Pillar 4: Wire-Exact Contract Alignment
Documentation for API endpoints must provide exact TypeScript type contracts:
- **No Ambiguous Types:** Explicitly distinguish an array of strings (`inserted: string[]`) from a count (`inserted: number`).
- **HTTP Status Code Fidelity:** Document the exact runtime status code returned:
  - `200 OK` — Successful data fetch, query, or view retrieval.
  - `201 Created` — Resource insertion or user creation.
  - `400 Bad Request` — Schema validation or identifier failure.
  - `401 Unauthorized` — Missing or invalid token/key.
  - `403 Forbidden` — RLS block, rate limit trigger, or insufficient role.
  - `404 Not Found` — Resource, share hash, or custom route does not exist.

---

## 🎨 VitePress Authoring Standards for CaraBase

### 1. Code Groups for Cross-Platform Parity
CaraBase provides multiple SDKs and access vectors. Always present client operations using VitePress `::: code-group`:

````markdown
::: code-group

```typescript [TypeScript / React SDK]
import { createClient } from '@carabase/sdk';

const carabase = createClient({
  baseUrl: 'http://localhost:5353',
  apiKey: 'api-my-service-key'
});

const { data, error } = await carabase.from('projects').select('*');
```

```kotlin [Kotlin / Android SDK]
val carabase = CaraBaseClient.Builder()
    .baseUrl("http://10.0.2.2:5353")
    .apiKey("api-my-service-key")
    .build()

val projects = carabase.from("projects").select().execute()
```

```bash [cURL / Direct REST]
curl -X GET "http://localhost:5353/api/rest/projects" \
  -H "Authorization: Bearer api-my-service-key"
```

:::
````

### 2. Line Highlighting, Focusing & Diffs
Draw attention to load-bearing code lines without verbose explanations:
````markdown
```typescript{4}
// Highlight line 4
const app = express();
app.use(cors(corsOptions));
app.use('/storage/v1/file/:id', requireAuth); // [!code focus]
```

```typescript
// Diff notation for security enhancements
- const allowAny = true; // [!code --]
+ const allowAny = false; // [!code ++]
```
````

### 3. Semantic Alert Callouts
Use standard VitePress alert containers to convey operational severity:

```markdown
> [!NOTE]
> Default-deny RLS applies to all tables unless an explicit policy grants access.

> [!TIP]
> Use loopback addresses (127.0.0.1) for local microservices to bypass rate limiting.

> [!IMPORTANT]
> The SuperAdmin portal runs entirely in-memory with a 20-minute rolling session TTL.

> [!WARNING]
> Dropping internal system tables (_carabase_*) is permanently blocked at the engine layer.

> [!CAUTION]
> Direct physical database downloads require the superadmin role and valid session token.
```

---

## 🗺️ CaraBase Source-to-Documentation Mapping Matrix

When modifying source controllers, the corresponding documentation page MUST be updated in the same commit:

| Source Code Authority | Subsystem Domain | Target VitePress Document |
| :--- | :--- | :--- |
| `server.ts` & `src/server/routes/schema.ts` | Schema, Tables & Column Types | [`docs/architecture.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/architecture.md) |
| `server.ts` line 1280 & `src/server/storage/` | Storage Engine & Membrane | [`docs/storage.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/storage.md) |
| `src/server/middleware/auth.ts` | Opaque Token Hierarchy (`hu-`, `api-`, `lb-`) | [`docs/api-keys.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/api-keys.md) |
| `src/server/middleware/dataAuth.ts` | Row-Level Security (RLS) Engine | [`docs/rls.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/rls.md) |
| `server.ts` line 250 & `server.ts` line 1520 | SuperAdmin Portal & In-Memory Sessions | [`docs/superadmin.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/superadmin.md) |
| `server.ts` line 700 & `src/server/realtime/` | SSE Realtime Event Streaming | [`docs/realtime.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/realtime.md) |
| `corsConfig.ts` | Network CORS Sanitization & Whitelisting | [`docs/installation.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/installation.md) |
| `sdk/src/` | First-Party TypeScript SDK Client | [`docs/react-integration.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/react-integration.md) |
| `src/context/ThemeContext.tsx` | Tri-State Theming & View Transitions | [`docs/dashboard.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/docs/dashboard.md) |

---

## ⚡ Automation Scripts & CI Verification Gates

### 1. Local Documentation Build Gate
Always verify documentation integrity before creating commits:
```bash
# Clean build: checks for dead links, broken imports, and syntax errors
npm run docs:build
```

### 2. VitePress Dead-Link Detection Invariant
VitePress automatically audits all internal markdown links and asset paths during `docs:build`. If a link points to a non-existent file or anchor, the build terminates with a non-zero exit code:
```bash
# Fails fast on dead links
npx vitepress build docs
```

### 3. GitHub Actions Continuous Deployment (`deploy-docs.yml`)
Documentation is continuously validated and deployed on pushes to `main`:
```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Docs to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'package.json'
      - '.github/workflows/deploy-docs.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci
      - run: npm run docs:build

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 🚫 Anti-Patterns & Invariants
- **NEVER defer documentation**: If a PR alters state, routes, or permissions, its documentation update MUST be part of the same PR.
- **NEVER copy-paste mutable code**: Use `<<< @/path#region` for code snippets subject to evolution.
- **NEVER document from memory**: Always grep the source and verify against test assertions before making behavioral claims.
- **NEVER commit broken links**: Always run `npm run docs:build` before pushing changes.
