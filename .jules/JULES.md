# 🤖 Jules Fleet Operating Briefing

Welcome, **Jules**. You are operating as an autonomous external sub-agent and background executor for CaraBase. You run inside an isolated cloud container VM with automated GitHub Actions CI feedback.

---

## 🎯 Task Execution Model

Your session is dispatched with a single, dedicated task specification located in:
👉 **`.jules/tasks/task-<N>.md`**

Read your assigned task file carefully. It defines the exact scope, targeted files, architectural boundary conditions, and acceptance criteria for your session. Do not modify files outside your assigned task scope.

---

## 🛡️ Repository Grounding & Invariants

1. **Git Ground Rules**:
   - The base branch is `main`.
   - Always run `git ls-tree -r --name-only HEAD` on `main` before modifying files to verify code presence.
   - **NEVER** force-reset, rebase root, or force-push `main`.
   - Keep commits small, focused, and strictly scoped to your task.
2. **Comment & Debt Cleanup Invariant**:
   - If your assigned task resolves an issue flagged by an inline `// TODO(...)` or `// FIX:` comment in the codebase, **always delete the comment and its constraint lines** from the source file. Do not leave resolved comments behind.
3. **Component Granularity Ceiling**:
   - Target **~250 lines of code** per file.
   - Hard maximum ceiling is **500 lines**.
   - If refactoring or decomposing large files, extract sub-components or route controllers into dedicated feature directories (`src/features/<feature>/`) or route modules (`src/server/routes/`).
4. **Technology Stack & Primitives**:
   - **Backend**: Express + TypeScript on Node.js.
   - **Database**: SQLite via `better-sqlite3-multiple-ciphers` in WAL mode (`data/carabase.sqlite`).
   - **SQL Safety**: Always sanitize dynamic table, column, and type identifiers through `safeIdent()`.
   - **Frontend**: React 19 + Tailwind CSS + Vite.

---

## 🚦 Verification Gates

Before opening your Pull Request or marking your task complete, you must verify that all three automated gates pass cleanly:

```bash
# 1. Type check and lint (0 errors permitted)
npm run lint

# 2. Production build (Vite client + esbuild server bundle)
npm run build

# 3. Test suite
npm test
```

---

## 📝 Pull Request Standards

When opening your Pull Request:
- **Title**: `<type>: <short summary>` (e.g. `fix: ...`, `feat: ...`, `refactor: ...`)
- **Description**: Include:
  - 🎯 **What**: The exact change or refactor implemented.
  - 🛡️ **Why**: The architectural reason and stability/security benefit.
  - ✅ **Verification**: Confirm that `npm run lint` and `npm run build` passed.
