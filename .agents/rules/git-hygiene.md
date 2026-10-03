---
trigger: always_on
---

# Git Hygiene

## Isolation
- Never work directly on the default branch (main/master). Start every task on a fresh branch or worktree: `git checkout -b <type>/<short-desc>`.
- One task = one branch. Don't mix unrelated changes into the same branch or working tree.
- Before starting, snapshot state: `git status` and `git diff --stat`. If the tree is dirty with work you didn't author, stop and ask.
- When committing work you did not author (in-flight user edits), run the project's test + build gates on the merged working tree BEFORE the commit. Their edits ride your commit message; they ride your verification too.

## Commits
- Keep changes small and self-contained; one logical change per commit. No mega-commits, no unrelated refactors bundled in.
- **Conventional Commits 1.0.0 Standard**:
  - Format: `<type>(<optional-scope>): <short imperative summary>`
  - Max length: Exactly **72 characters or fewer** for the header line.
  - Subject case: Lowercase, imperative mood (e.g. "add system theme", never "Added system theme" or "Adds system theme"). No trailing period.
  - **Breaking Changes**: Append `!` immediately before the colon (e.g. `feat(auth)!: replace legacy session tokens`) or include `BREAKING CHANGE:` in the body.
  - **Type Vocabulary**:
    | Type | Changelog Section | Meaning |
    | :--- | :--- | :--- |
    | `feat` | `### Added` | New user-facing feature |
    | `fix` | `### Fixed` | Bug fix |
    | `perf` | `### Changed` | Performance improvement |
    | `refactor`| `### Changed` | Code restructure without feature or bug change |
    | `revert` | `### Removed` | Reverting a previous commit |
    | `docs` | (Internal) | Documentation changes only |
    | `style` | (Internal) | Formatting, missing semi-colons, whitespace |
    | `test` | (Internal) | Adding or correcting tests |
    | `chore` | (Internal) | Maintenance, build config, dependency bumps |
    | `ci` | (Internal) | CI/CD pipeline and workflow updates |
    | `build` | (Internal) | Build system or external package changes |
- Prefer new commits over amending. Never amend or rebase a commit without explicit written approval in the task.
- Never skip hooks (`--no-verify`) or bypass commit signing unless explicitly asked.
- Before any `git commit`, run `git diff --cached --stat` first. If the index contains staged changes you did not author, STOP and ask: (a) unstage-and-commit only your files, (b) bundle deliberately, or (c) commit theirs separately. Never assume `git add <mine> && git commit` commits only `<mine>`.

## Destructive operations — NEVER without explicit confirmation
- `git push --force` / `--force-with-lease`
- `git reset --hard`, `git checkout/restore` to an older commit
- Deleting branches, tags, or stashes
- `rm -rf` or any bulk file deletion
- If unsure whether a file belongs to another agent's in-flight work, stop and coordinate — don't delete to silence an error.

## Secrets & safety
- Never commit, read, or echo `.env`, `.env.*`, `secrets/**`, or any API keys/tokens.
- Never push to a protected branch; open a PR instead.
- Run linters, type checks, and the test suite before considering work done; don't commit if they fail.

## Attribution
- Commit under the human's configured identity (`git config user.name` / `user.email`). No separate agent identity, no AI co-author line.
- Every commit message unifies Conventional Commits with this two-layer attribution format:

  ```
  <type>(<scope>): <short imperative summary under 72 chars>

  User: <the intention, system design, architecture decision, or issue reference (e.g. Closes #123)>
  AI: <the concrete implementation, functions, refactors, or tests that were generated>
  ```

- The header line MUST adhere strictly to Conventional Commits (`<type>(<scope>): <summary>`).
- The `User:` line is always the *why/what* — the intent, spec, structural decision, or issue reference.
- The `AI:` line is always the *how* — the code, logic, or test coverage that fulfilled it.
- If the human did the implementation directly (rare), put it under `User:` and write `AI: (none)`.
- If the agent did purely exploratory work with no human direction in that commit, write `User: (autonomous)` — but this should be the exception, not the norm.
- No trailers, no co-author lines, no `AI-Model:` metadata. The two-layer message *is* the attribution.

## Rebase hygiene
- **Local Commits Only**: Never rebase public, shared, or protected branches (`main`, `master`, active release branches). Only rebase local feature branches before submitting a PR.
- **Mandatory Safety Backup**: Before any interactive rebase (`git rebase -i`), always create a safety pointer: `git branch backup/<branch-name>`. If history rewriting fails or corrupts state, revert immediately with `git reset --hard backup/<branch-name>`.
- **Force-With-Lease Mandate**: Never use raw `git push --force`. Always use `git push --force-with-lease` when updating remote feature branches to ensure teammate commits are not accidentally overwritten.
- **Pre-Push Gate**: Run all automated test suites (`npm test`) on the post-rebase HEAD *before* pushing to remote.
- **Headless Editor Configuration**: When rebasing programmatically, avoid opening interactive terminal editors: set `GIT_EDITOR=:` and `GIT_SEQUENCE_EDITOR=:` (or pass `--no-edit`).

## Safety Net & Reflog Recovery Protocol
- **Reflog Safety Retention**: Git's reflog (`git reflog`) tracks all HEAD position changes for 90 days, even after branch deletions or hard resets. A discarded commit or branch is never permanently lost.
- **Zero-Panic Recovery**:
  - Accidental `git reset --hard`: inspect `git reflog`, identify the prior commit SHA, and restore with `git reset --hard <sha>` or spawn a recovery branch: `git branch recovered-work <sha>`.
  - Accidental branch deletion: locate the tip SHA in `git reflog` and restore: `git branch <branch-name> <sha>`.
- **In-Flight Abort Mandate**: If an interactive rebase, merge, cherry-pick, or bisect hits an unexpected conflict or dirty state, abort cleanly rather than pushing through corrupt changes:
  - `git rebase --abort`
  - `git merge --abort`
  - `git cherry-pick --abort`
  - `git bisect reset`

## Bisect & Worktree Hygiene
- **Clean Bisect Invariant**: Never start a `git bisect` session on a dirty working tree or uncommitted index. Ensure automated test runners (`git bisect run <cmd>`) return exit code 0 for good commits and non-zero (1–127, excluding 125) for broken commits. Always terminate with `git bisect reset`.
- **Worktree Lifecycle**: When using `git worktree add` for parallel branch development, always clean up completed directories using `git worktree remove <path>` followed by `git worktree prune` to prevent orphaned branches and locked references.

## Agent Customization & Memory Bank Tracking
- Agent directories (`.agents/`, `.claude/`, `.clinerules/`) containing rules, skills, workflows, templates, and memory bank files are first-class repository citizens and MUST NOT be gitignored.
- Commit memory bank updates (`activeContext.md`, `progress.md`, `raw_reflection_log.md`) and rule/workflow adjustments alongside the code and release tasks they belong to.
- Do NOT commit ephemeral runtime agent scratchpads, local IDE cache files (e.g. `.crustagent/`), or temporary debug dumps.

## Multi-Agent Workspace Staging Safety
- In shared multi-agent repositories (e.g. Antigravity, Cline, Jules):
  - NEVER execute `git add .` or `git commit -a`.
  - Always stage explicit, targeted paths (e.g. `git add .agents/brain/... src/...`).
  - Always run `git diff --cached --stat` before committing to verify that NO files from other agent directories (`.clinerules/`, `.jules/`) have entered the index.
  - Keep each agent's cognitive memory bank isolated and committed only under deliberate, attributed scopes.

## Specialized Operational Skills
For practical step-by-step commands and recipes:
- **[Git Advanced Workflows](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/.agents/skills/git-advanced-workflows/SKILL.md)**: Operational protocols for interactive rebase, autosquash (`--fixup`), commit splitting, cherry-pick ranges, automated bisect, worktrees, and emergency reflog recovery.
- **[Changelog Automation](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/.agents/skills/changelog-automation/SKILL.md)**: Conventional Commits tooling, Keep a Changelog 1.1.0 automation, and 4-digit release management.
- **[Doc Automation](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/.agents/skills/doc-automation/SKILL.md)**: Zero-rot region imports (`<<< @/...#region`), live test snippets, and claim battery verification.