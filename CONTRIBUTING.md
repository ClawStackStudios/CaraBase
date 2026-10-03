# Contributing Guidelines

> Maintained for ClawStack Studios©™

Thank you for contributing to CaraBase! We build sovereign, resilient, and self-hosted database infrastructure. To keep the codebase clean, robust, and verifiable by both human engineers and autonomous agents, all contributions must adhere to these standards.

---

## 🏛️ The Direction of Truth

**The documentation and specifications 100% bow to the code.**
- If a document or ticket contradicts shipped, security-hardened code, the document is the defect.
- Never alter working code to match stale prose; correct the documentation corpus immediately.
- Zero-deferred documentation: if a PR introduces or alters features, routes, or permissions, the corresponding documentation in `docs/` and changelogs MUST be updated in the same PR.

---

## 🛠️ Local Development Setup

1. **Clone and Install**:
   ```bash
   git clone https://github.com/ClawStackStudios/CaraBase.git
   cd CaraBase
   npm install
   ```

2. **Start the Development Stack**:
   ```bash
   npm run scuttle
   ```
   This concurrently boots:
   - Backend Express API on `http://localhost:5353` with TSX auto-reload.
   - Frontend Vite UI on `http://localhost:5454` with HMR.

3. **Start Living Documentation**:
   ```bash
   npm run docs:dev
   ```
   Serves interactive VitePress documentation on `http://localhost:5173`.

---

## 🌿 Git Branch & History Hygiene

Follow our **[Git Advanced Workflows](.agents/skills/git-advanced-workflows/SKILL.md)** protocols:

1. **Isolation**: Always branch fresh from `main`:
   ```bash
   git checkout -b <type>/<short-description>
   ```
2. **Rebase Only Local Commits**: Never rebase public or shared branches.
3. **Safety Backup Pointer**: Before running interactive rebases (`git rebase -i`), create a backup pointer:
   ```bash
   git branch backup-$(git branch --show-current)
   ```
4. **Use `--force-with-lease`**: Never use raw `git push --force`. Always use `--force-with-lease` when updating remote PR branches.
5. **Reflog Safety Net**: Remember that `git reflog` records all HEAD changes for 90 days. If an accidental hard reset occurs, inspect `git reflog` and restore immediately.

---

## ✍️ Commit Standards & Two-Layer Attribution

We strictly enforce **Conventional Commits 1.0.0** unified with our **Two-Layer Attribution** format:

### Format Schema:
```text
<type>(<scope>): <short imperative summary under 72 chars>

User: <the intention, architecture decision, spec, or issue reference (e.g. Closes #123)>
AI: <the concrete functions, refactors, files modified, or test coverage added>
```

### Commit Types:
- `feat`: New user-facing feature (`### Added` in Changelog).
- `fix`: Bug fix (`### Fixed` in Changelog).
- `perf`: Performance improvement (`### Changed` in Changelog).
- `refactor`: Code restructuring without behavior change (`### Changed` in Changelog).
- `revert`: Reverting prior commits (`### Removed` in Changelog).
- `docs`, `style`, `test`, `chore`, `ci`, `build`: Internal maintenance and quality gates.

---

## 🚦 The 4 Verification Gates (Must Pass 100% Green)

Before opening a pull request or submitting changes, all 4 automated pre-flight gates must pass cleanly:

```bash
# 1. Type check
npm run lint

# 2. Complete integration test suite (108/108 assertions across 14 phases)
npm test

# 3. Production client and server build
npm run build

# 4. VitePress documentation build (audits for broken links and region imports)
npm run docs:build
```

---

## 📚 Changelog & Versioning

- Update **`CHANGELOG.md`** under `[Unreleased]` adhering to [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) categories (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
- Versions strictly follow **4-digit Semantic Versioning (`vX.Y.Z.W`)** where `W` represents the monotonic build counter.

For complete toolchains and automated scripts, refer to:
- **[Git Advanced Workflows](.agents/skills/git-advanced-workflows/SKILL.md)**
- **[Doc Automation](.agents/skills/doc-automation/SKILL.md)**
- **[Changelog Automation](.agents/skills/changelog-automation/SKILL.md)**
