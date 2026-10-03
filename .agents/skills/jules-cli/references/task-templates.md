# 📋 Jules Task Archetype Templates

This reference provides reusable, battle-tested prompt and task specification templates for delegating work to Google Jules. Each archetype satisfies the 4-component atomic formula and CaraBase's architectural boundaries.

---

## 🧪 Archetype 1: Unit Test Scaffolding

Use this archetype when delegating comprehensive test coverage for backend controllers, utilities, or frontend hooks.

```markdown
# Task: Unit Test Scaffolding for [Module Name]

## Target Files
- Source: `src/[path/to/module.ts]`
- Test Target: `tests/[path/to/module.test.ts]`

## Task Objective
Author a comprehensive unit test suite covering normal execution, edge cases, and failure modes for `[Module Name]`.

## Architectural Constraints
1. Follow existing test conventions in `tests/suite.cjs` or Vitest / Jest patterns documented in `tests/`.
2. Do not modify public function signatures or exported types in `src/[path/to/module.ts]`.
3. Mock external database calls or network dependencies cleanly using local spies or in-memory SQLite fixtures.
4. Keep the test file modular and readable (target < 300 lines).

## Verification Redlines
- Run `npm test` and ensure all new and existing tests pass (100% green).
- Run `npm run lint` and verify 0 type errors or lint warnings.
```

---

## 🧩 Archetype 2: Monolithic Component Decomposition

Use this archetype when decomposing React components or backend controllers that exceed CaraBase's granularity ceiling (~250 lines target, 500 lines hard maximum).

```markdown
# Task: Decompose Monolithic Component [ComponentName.tsx]

## Target Files
- Monolith: `src/components/[ComponentName].tsx`
- Target Feature Directory: `src/features/[featureName]/components/`
- Target Hooks Directory: `src/features/[featureName]/hooks/`

## Task Objective
Decompose the monolithic `[ComponentName].tsx` file into focused sub-components and isolated custom hooks.

## Architectural Constraints
1. **Granularity Ceilings**: Every resulting file must stay strictly under **250 lines** of code (hard limit: 500 lines).
2. **Hook Isolation**: Extract data-fetching, state management, and side effects into dedicated hooks in `hooks/`.
3. **Props Preservation**: Maintain identical top-level component props so callers of `[ComponentName]` require zero modifications.
4. **Clean Imports**: Export the refactored root component through `src/features/[featureName]/index.ts`.

## Verification Redlines
- Run `npm run lint` to verify zero missing props, unused variables, or import errors.
- Run `npm run build` to verify Vite bundle compilation succeeds.
```

---

## 🔒 Archetype 3: Security Redline Remediation

Use this archetype when resolving vulnerabilities identified by Sentinel or code audits.

```markdown
# Task: Security Vulnerability Remediation - [Vulnerability Name]

## Target Files
- Vulnerable Module: `src/server/[path/to/file.ts]`

## Problem Statement
Audit identified a security issue in `src/server/[path/to/file.ts]` at lines [X-Y]: [Description of issue, e.g., missing authentication, unvalidated input, or unsafe shell invocation].

## Architectural Constraints
1. **Membrane Isolation**: Apply defensive validation at the entry boundary. Sanitize inputs before passing to downstream database or filesystem handlers.
2. **Comment Invariant**: Delete the associated inline `// TODO(security): ...` or `// FIX:` comment once the vulnerability is addressed.
3. **Zero Regression**: Do not alter legitimate request flows or break valid client responses.
4. **CI/CD Inviolability**: Do NOT touch `.github/workflows/**`.

## Verification Redlines
- Add a targeted regression test in `tests/` verifying the exploit payload is rejected (e.g. 401 Unauthorized or 400 Bad Request).
- Run `npm test`, `npm run lint`, and `npm run build`.
```

---

## 🧹 Archetype 4: Stale Comment & Dead Code Pruning

Use this archetype for background technical debt sweeps across modules.

```markdown
# Task: Prune Resolved TODOs and Stale Comments in [Module]

## Target Files
- `src/[path/to/module.ts]`

## Task Objective
Perform a targeted sweep of `src/[path/to/module.ts]` to remove obsolete `// TODO:` or `// FIX:` comments that have already been resolved, and remove unused variables or unreferenced imports.

## Architectural Constraints
1. **Behavioral Invariance**: Do NOT alter existing logic, return signatures, or control flow. This is a zero-semantic-change sweep.
2. **Only Prune Resolved Comments**: Only delete comments describing fixes or features that are already implemented. Preserve active, unresolved architectural reminders.
3. **Formatting**: Maintain existing indentation and code styling.

## Verification Redlines
- Run `npm run lint` to verify code style and imports.
- Run `npm test` and `npm run build` to confirm zero regressions.
```
