---
name: changelog-automation
description: >-
  Patterns and tools for automating changelog generation, release notes, and version management
  following Conventional Commits 1.0.0, Keep a Changelog 1.1.0, and 4-digit Semantic Versioning (vX.Y.Z.W).
---

# 📜 Changelog Automation & Release Management

This skill provides an authoritative guide, configuration templates, and operational toolchains for automating changelog generation, semantic versioning, and release note workflows within the CaraBase and ClawStack Studios ecosystem.

---

## 🎯 When to Use This Skill
- Establishing automated changelog generation from git history.
- Configuring commitlint, husky, or git hooks for Conventional Commits enforcement.
- Automating GitHub Releases via GitHub Actions workflows.
- Setting up `standard-version`, `semantic-release`, or `git-cliff` pipelines.
- Standardizing 4-digit Semantic Versioning (`vX.Y.Z.W`) and Keep a Changelog 1.1.0 specifications.

---

## 🏛️ Core Architectural Invariants

### 1. Keep a Changelog 1.1.0 Format
Every project changelog (`CHANGELOG.md`) must adhere to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/):
- **Heading Format**: `## [X.Y.Z.W] - YYYY-MM-DD` (or `## [Unreleased]`).
- **Standardized Categories**:
  - `### Added` — New user-facing capabilities or APIs.
  - `### Changed` — Modifications to existing functionality, state, or refactors.
  - `### Deprecated` — Features slated for removal in future milestones.
  - `### Removed` — Deprecated features now excised from the codebase.
  - `### Fixed` — Bug fixes, memory leak resolutions, crash remedies.
  - `### Security` — Vulnerability mitigations, membrane hardening, auth repairs.
- **Comparison Links**: Every version heading must have an anchor link at the bottom comparing against the prior release.

### 2. Conventional Commits 1.0.0 & Two-Layer Attribution
Every commit header must be $\le 72$ characters, imperative, and lowercase:
```text
<type>(<optional-scope>): <imperative description under 72 chars>

User: <intent, system design, architectural decision, or issue reference (e.g. Closes #123)>
AI: <concrete implementation, functions, refactors, or tests generated>
```

| Type | Changelog Section | Meaning | SemVer Impact |
| :--- | :--- | :--- | :--- |
| `feat` | `### Added` | New feature | **MINOR** (or **MAJOR** if `!`) |
| `fix` | `### Fixed` | Bug fix | **PATCH** (or **MAJOR** if `!`) |
| `perf` | `### Changed` | Performance improvement | **PATCH** |
| `refactor` | `### Changed` | Code restructure (no behavior change) | **PATCH** |
| `revert` | `### Removed` | Reverting prior commit | **PATCH** |
| `!` / `BREAKING CHANGE` | `### Changed` / `### Removed` | Incompatible API change | **MAJOR** |
| `docs`, `style`, `chore`, `test`, `ci`, `build` | (Internal) | Project maintenance | None (excluded from user changelog) |

### 3. 4-Digit Semantic Versioning (`vX.Y.Z.W`)
CaraBase enforces a 4-digit version pointer:
$$\text{vMAJOR} . \text{MINOR} . \text{PATCH} . \text{BUILD}$$
- **MAJOR (`X`)**: Incompatible API breaks, architectural restructuring, or major database schema transformations.
- **MINOR (`Y`)**: Backward-compatible feature additions, phase completions, or new public REST endpoints.
- **PATCH (`Z`)**: Backward-compatible bug fixes, security patches, or performance refactors.
- **BUILD (`W`)**: Monotonic build counter incremented on production builds or CI tag releases.

---

## 🛠️ Toolchain Implementation Blueprints

### Method 1: commitlint & Husky (Pre-Commit Enforcement)
```bash
# Install toolchain
npm install -D @commitlint/cli @commitlint/config-conventional husky

# Initialize commitlint configuration
cat > commitlint.config.cjs << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'revert'],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 72],
  },
};
EOF

# Setup husky hook
npx husky init
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

---

### Method 2: standard-version Configuration
```javascript
// .versionrc.cjs
module.exports = {
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'docs', section: 'Documentation', hidden: true },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'chore', section: 'Miscellaneous', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'CI/CD', hidden: true },
  ],
  commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
  compareUrlFormat: '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
  issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
  releaseCommitMessageFormat: 'chore(release): {{currentTag}}',
};
```

---

### Method 3: git-cliff Configuration (`cliff.toml`)
Rust-based, hyper-fast changelog generator parsing conventional commits:
```toml
# cliff.toml
[changelog]
header = """
# Changelog
All notable changes to CaraBase are documented in this file.
"""
body = """
{% if version %}\
  ## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}
{% else %}\
  ## [Unreleased]
{% endif %}\
{% for group, commits in commits | group_by(attribute="group") %}
  ### {{ group | upper_first }}
  {% for commit in commits %}
    - {% if commit.scope %}**{{ commit.scope }}:** {% endif %}\
      {{ commit.message | upper_first }}\
      {% if commit.github.pr_number %} ([#{{ commit.github.pr_number }}](https://github.com/ClawStackStudios/CaraBase/pull/{{ commit.github.pr_number }})){% endif %}\
  {% endfor %}
{% endfor %}
"""
footer = """
{% for release in releases -%}
  {% if release.version -%}
    {% if release.previous.version -%}
      [{{ release.version | trim_start_matches(pat="v") }}]: https://github.com/ClawStackStudios/CaraBase/compare/{{ release.previous.version }}...{{ release.version }}
    {% endif -%}
  {% else -%}
    [unreleased]: https://github.com/ClawStackStudios/CaraBase/compare/{{ release.previous.version }}...HEAD
  {% endif -%}
{% endfor %}
"""
trim = true

[git]
conventional_commits = true
filter_unconventional = true
commit_parsers = [
  { message = "^feat", group = "Added" },
  { message = "^fix", group = "Bug Fixes" },
  { message = "^perf", group = "Performance" },
  { message = "^refactor", group = "Changed" },
  { message = "^revert", group = "Removed" },
  { message = "^doc", group = "Documentation" },
  { message = "^chore\\(release\\)", skip = true },
  { message = "^chore", skip = true },
]
```

---

### Method 4: Automated GitHub Actions Release Workflow
```yaml
# .github/workflows/release.yml
name: Release Pipeline

on:
  workflow_dispatch:
    inputs:
      release_version:
        description: "Release Version (e.g. 0.3.0.0)"
        required: true

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

      - name: Configure Git Author
        run: |
          git config user.name "ClawStackStudios"
          git config user.email "clawstackstudios@protonmail.com"

      - name: Create Release Tag
        run: |
          git tag -a "v${{ inputs.release_version }}" -m "chore(release): v${{ inputs.release_version }}"
          git push origin "v${{ inputs.release_version }}"

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: "v${{ inputs.release_version }}"
          name: "CaraBase v${{ inputs.release_version }}"
          generate_release_notes: true
```

---

## 📋 Release Notes Templates

### A. Public GitHub Release Template
```markdown
## What's Changed in v{{ .Version }}

### 🚀 Features
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}

### 🐛 Bug Fixes
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}

### 🔒 Security & Membrane Hardening
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}

### 📚 Documentation
- {{ .Title }} by @{{ .Author }} in #{{ .PR }}

**Full Changelog**: https://github.com/ClawStackStudios/CaraBase/compare/v{{ .PreviousVersion }}...v{{ .Version }}
```

### B. Internal Release Notes Template
```markdown
# Release vX.Y.Z.W (Build N) — YYYY-MM-DD

## Summary
Brief 2-3 sentence overview of this milestone.

## Highlights
### 🌟 [Key Feature Name]
Detailed explanation of why this was built and what it accomplishes.

## Breaking Changes
None (or migration guide if applicable).

## Verification Status
- Lint: 100% green
- Tests: Passed (N/N)
- Build: Production bundle verified

## Dependencies Updated
| Package | From | To | Rationale |
| :--- | :--- | :--- | :--- |
| example | 1.0.0 | 1.1.0 | Feature enhancement |
```

---

## 🚫 Anti-Patterns & Invariants
- **NEVER mix unrelated changes**: One logical change per commit.
- **NEVER use capitalized subjects**: `feat(ui): add button`, NOT `feat(ui): Add button`.
- **NEVER exceed 72 chars in header**: Long details belong in the commit body / attribution layer.
- **NEVER manually fudge version headers**: Adhere strictly to `## [X.Y.Z.W] - YYYY-MM-DD`.
- **ALWAYS maintain compare links**: Broken compare links disconnect changelog traceability.
