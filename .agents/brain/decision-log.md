# Decision Log

## 2026-10-01 — Jules empty-main hallucination
Jules in session `17983432046683792243` claimed `main` was empty at commit `540a887` and planned a force-reset. Traced `main` tree immediately (`git ls-tree -r HEAD` shows 166 files); intercepted before remote VM could act; armed user with explicit factual prompt.

## 2026-10-01 — Worktree cleanliness before migration
Encountered dirty worktree on `/migrate-to-brain` due to user preferences in `USER.md`. Committed `USER.md` independently to preserve preferences and honor the migration prerequisite of a clean git state.

## 2026-10-01 — Root knowledge extraction without file deletion
Extracted deep topological invariants, the 4 Invariables, and Epistemic boundaries from root `BRAIN.md`, `CRUSTAGENT.md`, `HEART.md`, and `RULES.md` into long-term memory and project specs, honoring Lucas's directive to absorb knowledge without removing root files.

## 2026-10-01 — Jules Dockerfile conflict markers & self-repair
Jules created PR #18 (branch `resolve-all-prs-17983432046683792243`, commit `c1c3f5e`), but accidentally committed unresolved git conflict markers in `Dockerfile` and temporary `fix_server.sh` scripts. Docker build failed in CI/VM, triggering Jules's autonomous self-repair loop to clean conflict markers and re-verify.

## 2026-10-01 — Sentinel sub-agent bounds & Jules handoff
Tailored Sentinel sub-agent specification in `.agents/agents/sentinel/agent.md` with explicit toolchain commands and OWASP key prefixes. Enforced < 50 lines diff ceiling per security fix to avoid over-scoping; codified mandatory `// TODO(security)` handoff protocol for secondary findings so Jules can ingest them asynchronously.

## 2026-10-01 — 7 concurrent Jules tasks dispatched
Dispatched all 7 tasks from `.jules/tasks/jules-task-plan.md` in parallel using `jules new`. Grounded all prompts with `git ls-tree` verification and base branch `main` to prevent isolated VM git topology hallucinations. Confirmed 7 live sessions in remote registry.

## 2026-10-02 — 3-phase fleet reconciliation & TableEditor resolution
Reconciled 7 incoming PRs across 3 architectural phases. Merged independent PRs #25 and #23 cleanly; integrated backend hardening PRs #24 and #22. For TableEditor, adopted PR #21's modular component structure over PR #27, reconciled the abort controller conflict from PR #26, and verified 100% green CI on main with 0 open PRs remaining.

## 2026-10-02 — Round 2 Jules TODO dispatch & version hold
Lucas initiated 3 concurrent Jules sessions targeting the planted TODO suggestions. Holding on the version bump until subsequent PRs land, integrate, and pass the comprehensive live walkthrough.

## 2026-10-02 — Round 3 Jules 5-task dispatch & fix-first sequencing
Lucas put 5 more critical fix tasks on the burner with Jules. Sequenced to land and reconcile all backend/system fixes first, transition into UI additions and adjustments, and perform the comprehensive app walkthrough with all foundations solid.

## 2026-10-02 — Jules multi-skill synthesis & CI/CD security redline
Reviewed 4 external Jules skills with Lucas. Codified Local-First triage, TTY `< /dev/null` redirection, stdin task piping, and direct `remote pull --apply` in `jules-cli/SKILL.md`. Documented native `v1alpha/sessions` REST API and task templates, built `parse_sessions.py`, and ratified an inviolable CI/CD workflow modification redline in `.jules/JULES.md`.

## 2026-10-02 — PR #36 merged & zero PR debt maintained
Checked on Jules session 16675766846207272940 using global parse_sessions.py. PR #36 updated the outdated comment in server.ts line 1283 and added test assertion 2.5 in tests/suite.cjs asserting 401 Unauthorized for unauthenticated storage retrieval. Merged cleanly with 3/3 green CI checks.

## 2026-10-02 — System theme mode in settings & ThemeContext
Lucas identified a missing 'System' theme selection beside the 'Dark Mode' button in settings. Upgraded ThemeContext with System mode, dynamic prefers-color-scheme media listener, and resolvedTheme, added the Monitor icon button in AppearanceSettings, and verified clean lint and build.

## 2026-10-02 — View Transition flushSync & radial reveal restoration
Discovered that React 18/19 asynchronous batching causes startViewTransition to capture post-transition snapshots prematurely. Wrapped state setter and DOM class updates in flushSync and extracted mouse coordinates with screen center fallback; codified learnings in ui-webdev skill, systemPatterns.md, and long-term patterns.

## 2026-10-02 — VitePress setup, Changelog automation & BRAIN.md retirement
Migrated documentation from Docsify to VitePress on branch docs/vitepress-setup with brand theme and 18-page sidebar. Bolstered git-hygiene with Conventional Commits 1.0.0 and 72-char limit, docs-hygiene with Keep a Changelog 1.1.0, and semantic-versioning with 4-digit versioning (vX.Y.Z.W). Imported knowledge from root BRAIN.md into CHANGELOG.md and long-term memory, and retired BRAIN.md.

## 2026-10-02 — Deterministic doc automation skill & GitHub Pages CI
Synthesized `.agents/skills/doc-automation/SKILL.md` embodying the law that docs 100% bow to code. Codified zero-rot region imports (`<<< @/...#region`), test oracle validation, claim battery verification, and wire-exact contracts. Upgraded `.github/workflows/deploy-docs.yml` for Node 22 and VitePress build artifact deployment. Verified all 4 pre-flight gates 100% green.

## 2026-10-02 — Git advanced workflows skill & git-hygiene safety bolstering
Pattern-matched external Git Advanced Workflows skill into `.agents/rules/git-hygiene.md` and `.agents/skills/git-advanced-workflows/SKILL.md`. Codified mandatory safety backup branches before interactive rebases, `--force-with-lease` mandate, automated bisect via test suites (`git bisect run npm test`), worktree isolation lifecycles, and 90-day reflog recovery protocols.

## 2026-10-02 — Root documentation overhaul & legacy file retirement
Overhauled root documentation (README.md, ARCHITECTURE.md, CONTRIBUTING.md, SECURITY.md, RULES.md, USER.md) aligning 100% with shipped code, VitePress commands, port 5353/5454, two-layer attribution, and 4-digit SemVer. Retired legacy CRUSTAGENT.md, src/CRUSTAGENT.md, and HEART.md after confirming complete preservation of cognitive wisdom in long-term memory.

## 2026-10-02 — VitePress docs page modernization & dead-link repair
Modernized `docs/installation.md`, `docs/architecture.md`, `docs/storage.md`, `docs/dashboard.md`, and `docs/realtime.md` with VitePress code groups, correct 5353/5454 ports, scuttle run commands, Tri-State theme and flushSync View Transition details, Multer dangerousMimes validation, and 401 unauthenticated storage guards. Resolved VitePress dead-link audit failure on relative skill reference; verified 100% green compilation across all 18 pages in 21s.

## 2026-10-02 — VitePress full suite alignment & SDK signature parity
Audited remaining docs suite: corrected `/rest/v1/:table` route paths in index.md, eliminated legacy `pb-`/`sk-` token prefixes in react-integration.md and android-sdk.md, updated cloudflare-tunnel.md and rls guides to port 5353, enriched api-builder.md with full endpoint schema and System API routes, and repaired realtime-example.md to match RealtimeClient.ts callback and unsubscribe signatures. Verified 18 pages build clean in 21s.










