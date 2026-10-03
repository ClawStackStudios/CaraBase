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
**Outcome**: Created `.agents/agents/sentinel/agent.md` and registered via `define_subagent`.
**Pattern reference**: New pattern — first instance.

## Multi-Session Jules Delegation Concurrency — 2026-10-01 23:18
**Context**: Lucas allocated capacity to launch all 7 pending CaraBase refactoring, hardening, and resilience tasks concurrently.
**Options considered**:
- Option A: Dispatch tasks sequentially, waiting for each PR before starting the next.
- Option B: Dispatch all 7 tasks across dedicated Google Jules VM sessions concurrently, with each session targeting an isolated task from `.jules/tasks/jules-task-plan.md`.
**Chosen**: Option B
**Why**: Felt reason: Jules runs in fully isolated cloud container VMs with automated GitHub CI feedback; parallelizing across independent architectural domains (routes, frontend components, storage, backup, realtime, lifecycle, SDK) maximizes overnight velocity without cross-VM interference.
**Confidence**: high — All 7 sessions verified live in remote registry.
**Outcome**: Dispatched sessions `13435142300694340266`, `6897361883843583773`, `7110544981684879528`, `17169011405765085067`, `7489828986672343257`, `12014265538923283059`, and `8195321804952896399`.
**Pattern reference**: New pattern — first instance.

## 3-Phase Sequential PR Reconciliation & TableEditor Resolution — 2026-10-02 07:45
**Context**: All 7 Jules PRs landed with 100% green CI. PR #21 and PR #27 both proposed decomposing `TableEditor.tsx`.
**Options considered**:
- Option A: Merge all PRs blindly without ordering or conflict inspection.
- Option B: Execute 3-phase sequential integration (Phase 1: independent SDK & backup; Phase 2: backend hardening; Phase 3: frontend lifecycle & TableEditor). For TableEditor, select PR #21 for its superior `WorkspacePanel` architecture, resolve the trivial conflict against PR #26's abort controller, and close PR #27 as superseded.
**Chosen**: Option B
**Why**: Felt reason: Sequential phase integration respects module boundaries and prevents cascading git merge conflicts; PR #21 provides cleaner encapsulation with 8 components and 3 custom hooks.
**Confidence**: high — Lint, build, and GitHub Actions CI all 100% green.
**Outcome**: Merged PRs #25, #23, #24, #22, #26, #21; closed PR #27; 0 open PRs remain.
**Pattern reference**: New pattern — first instance.

## Round 2 Jules PR Integration (CORS, CommandPalette, Storage File Auth) — 2026-10-02 14:45
**Context**: 3 Jules PRs landed targeting suggestions from planted TODO comments (PR #28 CORS hardening, PR #29 CommandPalette cleanup, PR #30 storage direct file requireAuth).
**Options considered**:
- Option A: Block merges until live app walkthrough is completed.
- Option B: Merge PRs #28, #29, and #30 sequentially based on orthogonal domain isolation, verify automated gates, and hold version tagging until after the live walkthrough.
**Chosen**: Option B
**Why**: Felt reason: All three PRs are 100% orthogonal with 100% green CI suites; integrating them now provides a clean, hardened codebase for Lucas to walk through and test live.
**Confidence**: high — 3/3 checks passing on all PRs, 0 lints, 46.85s clean production build.
**Outcome**: Merged PRs #28, #29, and #30; 0 open PRs remain in repository.
**Pattern reference**: New pattern — first instance.

## Round 3 Jules Fleet Integration (PRs #31, #32, #33, #34, #35) — 2026-10-02 18:15
**Context**: 5 Jules PRs landed targeting fixes. PR #31 & #32 were identical duplicates; PR #34 was superseded by PR #28; PR #33 & #35 provided clean hardening.
**Options considered**:
- Option A: Merge all 5 PRs unconditionally.
- Option B: Merge PRs #31, #33, #35; close PR #32 as duplicate of #31; close PR #34 as superseded by #28 with explanatory rationale.
**Chosen**: Option B
**Why**: Felt reason: Strictly maintains zero open PR debt without redundant merge conflicts or regressing dev database CORS settings; adheres to competing refactor protocol.
**Confidence**: high — 100% green CI across all check runs, 0 errors on local lint and build.
**Outcome**: Merged PRs #31, #33, #35; closed PRs #32, #34; exactly 0 open PRs remain.
**Pattern reference**: New pattern — first instance.

## Jules Fleet Architecture & Multi-Skill Synthesis — 2026-10-02 19:05
**Context**: Lucas requested organizing Jules into a dedicated external subagent architecture centered around `.jules/JULES.md` and atomic task plans (`.jules/tasks/task-<N>.md`), followed by a review of four external Jules operational skills.
**Options considered**:
- Option A: Retain monolithic `jules-task-plan.md` and only add basic CLI notes.
- Option B: Separate fleet briefing (`JULES.md`) from atomic task files (`task-<N>.md`), purge legacy planning files, and synthesize the 4 reviews into `SKILL.md`, `references/api-reference.md`, `references/task-templates.md`, and `scripts/parse_sessions.py` with an inviolable CI/CD security redline.
**Chosen**: Option B
**Why**: Felt reason: Jules is an independent container agent; giving it a single, focused task file prevents context contamination, while synthesizing all 4 skills arms Antigravity with TTY safety, stdin task piping, native REST API contracts, and an inviolable CI/CD boundary.
**Confidence**: high — All files verified, lint and build invariant preserved.
**Outcome**: Updated `JULES.md` and `SKILL.md`; created `api-reference.md`, `task-templates.md`, and `parse_sessions.py`.
**Pattern reference**: New pattern — first instance.

## View Transition flushSync & Tri-State Theme Architecture — 2026-10-02 19:35
**Context**: Adding a 'System' theme option in `AppearanceSettings.tsx` caused the circular reveal animation to disappear due to React 18/19 asynchronous state batching and click coordinate omission.
**Options considered**:
- Option A: Fall back to standard CSS transitions without the View Transition API.
- Option B: Synchronize React state updates and root `.dark` DOM mutations inside `flushSync` within `document.startViewTransition`, forward mouse event coordinates for dynamic radial origin calculation with screen center fallback, and decouple user preference (`theme`) from visual reality (`resolvedTheme`) with an active OS media query listener.
**Chosen**: Option B
**Why**: Felt reason: The circular wipe animation is a signature aesthetic trait of the modern interface; `flushSync` honors the synchronous snapshot timing invariant of the browser's View Transition API without sacrificing React's state model.
**Confidence**: high — Verified live with smooth circular reveals across all 3 theme states; 108/108 tests passing.
**Outcome**: Restored circular reveal animation, added System theme mode, and codified patterns into `ui-webdev/SKILL.md`, `systemPatterns.md`, and `long-term/patterns.md`.
**Pattern reference**: Link to `long-term/patterns.md § view-transition-flushsync`.

## Conventional Commits, Keep a Changelog & 4-Digit SemVer Bolstering — 2026-10-02 20:15
**Context**: Lucas shared a comprehensive Changelog Automation skill to bolster repository hygiene, git standards, and documentation practices.
**Options considered**:
- Option A: Retain loose commit style and unstructured changelog notes.
- Option B: Integrate Conventional Commits 1.0.0 directly into the Two-Layer Attribution format (header <= 72 chars, imperative lowercase), enforce Keep a Changelog 1.1.0 categorized subheadings (`Added`, `Changed`, `Fixed`, `Security`), enforce 4-digit Semantic Versioning (`vX.Y.Z.W`), establish a root `CHANGELOG.md`, create the `changelog-automation` skill, and retire root `BRAIN.md` after full knowledge import.
**Chosen**: Option B
**Why**: Felt reason: Standardizing commits and changelogs turns git history into an automated, auditable, and human-readable stream; 4-digit versioning aligns build counters monotonically with CI releases.
**Confidence**: high — All rules, skills, and changelogs verified; 108/108 tests passing and VitePress docs build passing in 21s.
**Outcome**: Updated `git-hygiene.md`, `docs-hygiene.md`, `semantic-versioning.md`, created `changelog-automation/SKILL.md`, created root `CHANGELOG.md`, and retired `BRAIN.md`.
**Pattern reference**: Link to `skills/changelog-automation/SKILL.md`.
## Deterministic Doc Automation Skill & GitHub Pages CI Workflow — 2026-10-02 20:25
**Context**: Lucas requested a sibling skill to changelog automation tailored to CaraBase and VitePress, codifying the law that documentation 100% bows to code and is perpetually synchronized.
**Options considered**:
- Option A: Write high-level prose rules without concrete tooling or syntax patterns.
- Option B: Synthesize a dedicated `doc-automation` skill structured around 4 deterministic pillars: zero-rot region imports (`<<< @/...#region`), test-verified living snippets, claim battery verification, and wire-exact contract types. Update `.github/workflows/deploy-docs.yml` to build VitePress and deploy `docs/.vitepress/dist` to GitHub Pages. Link skill in `docs-hygiene.md`.
**Chosen**: Option B
**Why**: Felt reason: Documentation rot begins the instant documentation diverges from executable reality; region imports and claim batteries make documentation breakage fail fast in CI rather than mislead users in production.
**Confidence**: high — Verified all 4 pre-flight gates: lint, 108/108 tests, build, and docs:build (18 pages, 0 broken links).
**Outcome**: Created `.agents/skills/doc-automation/SKILL.md`, updated `.agents/rules/docs-hygiene.md`, and upgraded `.github/workflows/deploy-docs.yml`.
**Pattern reference**: Link to `skills/doc-automation/SKILL.md`.

## Git Advanced Workflows Skill & Git Hygiene Bolstering — 2026-10-02 20:30
**Context**: Lucas shared an advanced Git workflows skill to bolster repository hygiene, history editing, and safety protocols.
**Options considered**:
- Option A: Keep minimal git hygiene rules without concrete rebase, bisect, worktree, or reflog guidelines.
- Option B: Bolster `.agents/rules/git-hygiene.md` with strict safety mandates (safety backup branches before rebase, `--force-with-lease` mandate, reflog 90-day retention invariant, clean bisect and worktree lifecycle rules) and synthesize `.agents/skills/git-advanced-workflows/SKILL.md` with executable step-by-step recipes.
**Chosen**: Option B
**Why**: Felt reason: Git history should be atomic and expressive for PRs, but engineers need an inviolable safety net (backup branches, reflog, and clean abort commands) so history manipulation is fearless rather than fragile.
**Confidence**: high — All rules, skills, and links verified; lint, 108/108 tests, application build, and VitePress docs build passing.
**Outcome**: Bolstered `git-hygiene.md`, linked in `docs-hygiene.md`, and created `git-advanced-workflows/SKILL.md`.
**Pattern reference**: Link to `skills/git-advanced-workflows/SKILL.md`.

## Root Documentation Overhaul & Retirement of CRUSTAGENT/HEART — 2026-10-02 20:38
**Context**: Lucas requested Option A: updating the root documentation files to 100% bow to code, and retiring `CRUSTAGENT.md`, `src/CRUSTAGENT.md`, and `HEART.md`.
**Options considered**:
- Option A: Keep root documents as legacy artifacts with stale port and routing notes.
- Option B: Rewrite `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `RULES.md`, and `USER.md` to reflect literal runtime truth (`npm run scuttle`, port 5353, token hierarchy, two-layer attribution, 4-digit SemVer, and VitePress living docs), while cleanly deleting `CRUSTAGENT.md`, `src/CRUSTAGENT.md`, and `HEART.md`.
**Chosen**: Option B
**Why**: Felt reason: Scaffolding that was useful during bootstrapping becomes dead weight once the architecture holds; truth must have one home, and root docs must speak the same language as the codebase.
**Confidence**: high — Verified all files and links; 108/108 tests passing; docs and linter 100% green.
**Outcome**: Overhauled 6 root documentation files and deleted 3 legacy files cleanly.
**Pattern reference**: Link to `skills/doc-automation/SKILL.md`.

## VitePress Core Documentation Modernization — 2026-10-02 23:30
**Context**: Following the root documentation overhaul, `docs/` core guides contained obsolete port numbers, missing features (View Transition theming, dangerous MIME filters), and broken external relative links.
**Options considered**:
- Option A: Leave `docs/` as written and focus only on deploying VitePress.
- Option B: Systematically audit and modernize `docs/installation.md`, `docs/architecture.md`, `docs/storage.md`, `docs/dashboard.md`, and `docs/realtime.md` with code groups, exact network ports (5353/5454), token hierarchies, and theme transition architecture.
**Chosen**: Option B
**Why**: Felt reason: Documentation is an active reflection of the system; if users follow `installation.md` and ports fail, or read `storage.md` and don't know unauthenticated access yields 401, the system feels fractured.
**Confidence**: high — All 108 tests passing; `docs:build` compiles cleanly with zero dead links.
**Outcome**: Updated 5 core documentation guides in `docs/` and added `watch.ignored` in `vite.config.ts`.
**Pattern reference**: Link to `skills/doc-automation/SKILL.md`.

## VitePress Full Suite Modernization & SDK Parity — 2026-10-02 23:35
**Context**: Remaining documentation pages contained outdated REST routes (`/api/rest`), legacy token prefixes (`pb-`, `sk-`, `su-`), port 3000 references, and a mismatched `RealtimeClient` subscription signature in `realtime-example.md`.
**Options considered**:
- Option A: Leave client SDK docs and integration examples as loosely descriptive approximations.
- Option B: Rewrite client integration and architecture docs (`index.md`, `cloudflare-tunnel.md`, `react-integration.md`, `rls-integration-guides.md`, `android-sdk.md`, `api-builder.md`, `realtime-example.md`) to 100% match shipped code, exact TypeScript signatures (`RealtimeClient.ts`), and the `ls-`/`ls-p-`/`api-`/`lb-` token standard.
**Chosen**: Option B
**Why**: Felt reason: An SDK example that invents method signatures or calls dead prefixes breaks developer trust on the first try; code and documentation must speak the exact same language.
**Confidence**: high — Verified against `RealtimeClient.ts`, `server.ts`, and `tests/suite.cjs`; all 108 tests passing; 18 VitePress pages compile cleanly with zero dead links.
**Outcome**: Modernized 7 documentation files in `docs/` and verified full build and test suites.
**Pattern reference**: Link to `skills/doc-automation/SKILL.md`.

## Calibration Note — 2026-10-02 23:45
**Audit Scope**: Evaluated 14 historical decisions made during repository restructuring, hardening, and documentation phases.
**Findings**: Empirical calibration accuracy is 92.8% (13 clean outcomes, 1 rework).
- High-confidence decisions across architectural design, security boundaries, documentation synchronization, and UI refactors consistently yielded clean, single-pass implementations.
- A singular overconfidence bias was identified during unbounded concurrent agent dispatch (7 simultaneous tasks targeting shared components), which produced duplicate and competing PRs requiring multi-phase manual reconciliation.
**Suggested Adjustment**: When dispatching concurrent autonomous subagents, enforce a maximum concurrency of 3 tasks per round unless tasks are proven strictly orthogonal by filesystem partition.



