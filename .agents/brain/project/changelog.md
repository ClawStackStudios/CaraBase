# Changelog

All notable changes to CaraBase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) using a 4-digit version pointer `vX.Y.Z.W` (`vMAJOR.MINOR.PATCH.BUILD`).

## [Unreleased]

## [0.2.0.2] - 2026-10-03

### Added
- **ShellGuard Layout Port**: Integrated modern Hero, Feature Grid, `<CardGrid>`, and `<Steps>` Vue components into VitePress documentation.
- **Brand Theming Adaptation**: Redesigned docs CSS engine (`custom.css`) to express CaraBase's native teal (`#14b8a6`) and cyan (`#06b6d4`) palette with subtle ambient glows.
- **Application Screenshots**: Embedded live screenshots of CaraBase Login (`/assets/login-empty.png`) and Project Overview Dashboard (`/assets/dashboard.png`).
- **End-to-End Walkthrough Guides**: Added comprehensive user-facing guides covering setup from zero: `generate-secrets.md`, `first-login.md`, `setup-wizard.md`, `api-reference.md`, `error-codes.md`, and `troubleshooting.md`.
- **System Theme Mode**: Added third 'System' theme option beside Dark Mode in Appearance Settings, allowing automatic alignment with OS theme preferences.
- **Real-Time OS Scheme Listener**: Integrated `matchMedia('(prefers-color-scheme: dark)')` listener in `ThemeContext` to react dynamically to OS-level theme shifts.
- **Dynamic Radial View Transitions**: View Transition reveal animations now radiate from the exact coordinates of the interacting mouse cursor, with graceful fallback to screen center for keyboard navigation.
- **VitePress Documentation Suite**: Migrated from legacy Docsify to VitePress with ClawStack Slate & Cyber Accent branding, multi-group sidebar, local search, and interactive home page.
- **Changelog Automation Skill**: Created comprehensive skill at `.agents/skills/changelog-automation/` documenting `commitlint`, `standard-version`, `semantic-release`, and `git-cliff` toolchains.
- **Root Changelog**: Established root `CHANGELOG.md` adhering strictly to Keep a Changelog 1.1.0 specifications.

### Fixed
- **Rollup Asset Resolution Failure**: Replaced missing local image placeholder paths with remote placeholder service URLs in `first-login.md` and `tables.md`, resolving Rollup bundle compilation errors in GitHub Actions CI.
- **Dashboard Screenshot Margin Overlap**: Corrected negative margin on index dashboard image to `margin: 4rem auto;` to eliminate visual overlap with the feature grid.
- **Global Documentation Image Styling**: Added global responsive and centering styles to `.vp-doc img` in `custom.css` to prevent layout blowout or alignment bugs.
- **View Transition Animation Loss**: Fixed defect where circular reveal animation failed to play due to React 18/19 deferred rendering capturing identical pre-render DOM snapshots.
- **Storage File Documentation**: Corrected route comment in `server.ts` line 1283 to clarify that direct file retrieval requires authorization credentials.
- **CommandPalette Keyboard Navigation**: Unified early return guard for `ArrowDown`, `ArrowUp`, and `Enter` when filtered result list is empty.

### Changed
- **Version Bump**: Bumped version monotonically to `0.2.0.2` (Build 2) across `package.json` and `productVersion.md`.
- **Synchronous DOM Mutation with `flushSync`**: Wrapped React 18/19 state updates and root `.dark` DOM mutations inside `flushSync` from `react-dom` within `document.startViewTransition` to eliminate dropped animation frames caused by asynchronous batching.
- **Git Hygiene Conventional Commits**: Updated `.agents/rules/git-hygiene.md` to integrate strict Conventional Commits 1.0.0 with 72-character imperative title limits, breaking change indicators (`!`), and issue referencing directly into the Two-Layer Attribution format.
- **Docs Hygiene Anti-Rot Standards**: Modernized `.agents/rules/docs-hygiene.md` with Keep a Changelog 1.1.0 specifications, section mapping, and migrated legacy `.agents/memory-bank/` references to `.agents/brain/`.
- **Semantic Versioning Standards**: Updated `.agents/rules/semantic-versioning.md` to codify 4-digit versioning (`vX.Y.Z.W`), release commit syntax `chore(release): vX.Y.Z.W (Build N)`, and release note generation templates.

### Security
- **Direct Storage File Authentication**: Added `requireAuth` to `/storage/v1/file/:id` to close direct IDOR unauthenticated file enumeration while preserving ShellProxy membrane for public shares, validated by automated integration test 2.5 in `tests/suite.cjs`.
- **CORS Whitelist Sanitization**: Enforced strict origin normalization, wildcard rejection in production, and environment-scoped LAN restrictions in `corsConfig.ts`.
- **Multer Upload Dangerous MIME Inspection**: Added explicit `dangerousMimes` verification (`x-msdownload`, `x-executable`, `x-sh`, etc.) to storage engine upload middleware.
- **CI/CD Security Boundary**: Ratified inviolable security redline forbidding autonomous AI agents from modifying `.github/workflows/**`.

## [0.2.0.1] - 2026-10-02

### Added
- **Multi-Session Jules Fleet Coordination**: Architected `.jules/JULES.md` briefing and atomic `.jules/tasks/task-<N>.md` task plans for parallel container VM delegations.
- **CaraBase Security Sentinel**: Established tailored security subagent in `.agents/agents/sentinel/agent.md` with strict < 50-line diff ceiling and structured Jules TODO handoff protocol.
- **Realtime Server-Sent Events (SSE)**: Implemented live database mutation streaming on `/api/realtime` with deferred post-transaction commit atomicity.
- **Encrypted SQLite Core**: WAL mode with SQLCipher encryption via `better-sqlite3-multiple-ciphers` and `busy_timeout = 5000` pragma.
- **Opaque Token Authentication**: Implemented role-based token scopes (`hu-` human, `api-` programmatic, `lb-` ephemeral agent keys) and RBAC hierarchy (`superadmin` > `admin` > `viewer`).
- **ShellProxy Storage Membrane**: Physical asset storage with magic-bytes inspection (`MZ`, `ELF`, `#!`), 50MB file size limits, and expiring 64-character `share_hash` public links.
- **Automated Daily Backups**: Automated SQLite backups with 0-byte file cleanup on failure and retention pruning.
- **SuperAdmin Portal**: Built-in environment-gated admin portal (`/admin`) with volatile in-memory sessions (20-minute rolling TTL) and zero-knowledge data auditing.

### Fixed
- **SQL Injection in Schema Builder**: Neutralized dynamic SQL injection in `server.ts` `/tables` endpoint via `safeIdent` column data type sanitization (Sentinel PR #13).
- **SQLite WAL Cleanup on Restore**: Added unlinking of dangling `.sqlite-wal` and `.sqlite-shm` files during backup restore operations.

### Security
- **Row-Level Security (RLS)**: Enforced transactional SQLite `WHERE` clause injection across dynamic REST endpoints (`/api/rest/:table`).
- **Loopback Rate-Limit Exemptions**: Permanently exempted loopback addresses (`127.0.0.1`, `::1`) from rate limiters to guarantee automated test runner resilience.

[Unreleased]: https://github.com/ClawStackStudios/CaraBase/compare/v0.2.0.1...HEAD
[0.2.0.1]: https://github.com/ClawStackStudios/CaraBase/releases/tag/v0.2.0.1
