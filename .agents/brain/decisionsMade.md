# Decisions Made

## PR Priority: Fix Security Before Dependency Churn — 2026-10-01 18:15
**Context**: 7 open PRs exist in the repo: one critical SQL injection fix (PR #13) and six dependency updates (#9-#12, #16, #17).
**Options considered**:
- Option A: Merge dependabot PRs first to get latest dependencies into main.
- Option B: Merge PR #13 (Sentinel SQL injection fix) first, then resolve dependency bumps against hardened main.
**Chosen**: Option B
**Why**: Felt reason: Security fixes should never wait behind dependency churn; PR #13 is surgical (+6/-1), verified green, and stabilizes the core schema builder.
**Confidence**: high — All CI gates pass; security invariant is non-negotiable.
**Outcome**: Dispatched instruction to merge PR #13 as Step 1.
**Pattern reference**: New pattern — first instance.

## Brain Architecture Migration: Self vs Environment Split — 2026-10-01 18:34
**Context**: User requested migration from legacy memory-bank structure to modern Antigravity Brain architecture via `/migrate-to-brain`.
**Options considered**:
- Option A: Retain flat memory-bank directory.
- Option B: Execute 5-phase migration splitting Self (`brain/`) from Environment (`brain/project/`).
**Chosen**: Option B
**Why**: Felt reason: Modern brain cleanly isolates internal working narrative from external world state, avoiding cognitive drift across sessions.
**Confidence**: high — Workflow executed cleanly, committed with full reference updates.
**Outcome**: Migrated to `.agents/brain/` with clean git tree.
**Pattern reference**: New pattern — first instance.

## Sentinel Security Subagent Architecture & Jules Handoff — 2026-10-01 22:55
**Context**: Lucas requested a dedicated sub-agent `Sentinel` tailored to CaraBase security, fixing ONE issue (< 50 lines) and planting TODOs for Jules on secondary findings.
**Options considered**:
- Option A: Generic security agent prompt without repo-specific commands or invariants.
- Option B: Deeply tailored agent with CaraBase toolchain (`npm test`, `npm run lint`, `npm run build`), key prefix invariants (`hu-`, `api-`, `lb-`), SQLite/SQLCipher boundaries, and structured Jules TODO handoff protocol.
**Chosen**: Option B
**Why**: Felt reason: An agent without repository-specific invariants generates hallucinated commands and superficial changes; grounding Sentinel in CaraBase's exact boundaries guarantees verified, high-signal security contributions.
**Confidence**: high — Specification tested against repository structure, verification gates passed.
**Outcome**: Created `.agents/agents/sentinel/agents.md` and registered via `define_subagent`.
**Pattern reference**: New pattern — first instance.
