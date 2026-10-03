---
name: git-advanced-workflows
description: >-
  Master advanced Git techniques to maintain clean history, collaborate effectively,
  and recover from any situation with confidence. Practical recipes for interactive
  rebase, autosquash, commit splitting, cherry-picking, automated bisect, worktrees,
  and emergency reflog recovery.
---

# 🌿 Git Advanced Workflows

Master advanced Git techniques to maintain clean history, collaborate effectively, and recover from any situation with confidence. This skill operationalizes interactive rebase, autosquash, commit splitting, cherry-picking, automated bisect regression testing, multi-branch worktrees, and the 90-day reflog safety net for CaraBase.

---

## 🧭 Core Philosophy: Intentional, Linear & Recoverable History

```
┌─────────────────────────────────────────────────────────────┐
│                    THE WORKING BRANCH                       │
│    (Raw experimental commits, checkpoints, fixups)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ interactive rebase / autosquash
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   THE SHAPED PULL REQUEST                   │
│   (Atomic commits, Conventional Commits 1.0.0, <=72 chars)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ git test gates (npm test)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  MAIN TRUNK INTEGRATION                     │
│    (Linear history, clear attribution, bisect-ready)        │
└─────────────────────────────────────────────────────────────┘
```

> **The Sovereign Rule:** History is a communication artifact for future engineers and automated tooling. Clean up local experimental noise before opening a PR, but **never rebase shared public branches**.

---

## 🎯 When to Use This Skill
- Cleaning up local feature commit history before opening or updating a PR.
- Automatically combining iterative fixes with their target commits via `--autosquash`.
- Splitting a large commit into focused, atomic changes.
- Applying specific commits or security hotfixes across multiple release branches.
- Isolating a regression or bug introduction using binary search (`git bisect`).
- Working on an urgent hotfix without stashing or interrupting your current workspace using `git worktree`.
- Recovering "lost" commits, accidental hard resets, or deleted branches using `git reflog`.

---

## 🔬 1. Interactive Rebase & History Shaping

Interactive rebase is the primary tool for shaping raw development activity into a clean, legible sequence of atomic commits.

### Operations Reference
| Operation | Short | Purpose |
| :--- | :--- | :--- |
| `pick` | `p` | Keep commit as-is. |
| `reword` | `r` | Keep commit content, but pause to edit the commit message. |
| `edit` | `e` | Pause at this commit to amend files, run tests, or split into multiple commits. |
| `squash` | `s` | Combine this commit into previous commit and combine commit messages. |
| `fixup` | `f` | Combine this commit into previous commit and **discard** this commit's message. |
| `drop` | `d` | Completely delete this commit from history. |

### Basic Usage
```bash
# Rebase last N commits on the current branch
git rebase -i HEAD~5

# Rebase all commits since diverging from main
git rebase -i $(git merge-base HEAD main)

# Rebase onto a specific upstream commit
git rebase -i <commit-sha>
```

### Mandatory Safety Backup Mandate
Before running an interactive rebase that alters history:
```bash
# 1. Create a safety pointer
git branch backup-$(git branch --show-current)

# 2. Perform the rebase
git rebase -i main

# 3. If anything goes wrong, restore instantly
git reset --hard backup-$(git branch --show-current)

# 4. Once verified, delete the backup branch
git branch -D backup-$(git branch --show-current)
```

---

## ⚡ 2. The Autosquash Workflow (`--fixup`)

The fastest and most error-free way to clean up commits is using `--fixup` commits with automated autosquash.

### Step-by-Step Execution:
1. Identify the target commit SHA you want to patch (via `git log --oneline -n 10`).
2. Stage your correction or test additions:
   ```bash
   git add src/server/middleware/auth.ts tests/suite.cjs
   ```
3. Commit with `--fixup` targeting the SHA:
   ```bash
   git commit --fixup <target-sha>
   # Or target the most recent commit:
   git commit --fixup HEAD
   ```
4. Rebase with autosquash enabled:
   ```bash
   git rebase -i --autosquash $(git merge-base HEAD main)
   ```
   Git will automatically reorder the fixup commit directly underneath the target commit and mark it as `fixup`. Save and exit to apply immediately.

---

## ✂️ 3. Splitting a Commit into Atomic Units

When a commit bundles unrelated changes (e.g. a database migration and a UI adjustment):

1. Start an interactive rebase covering the commit:
   ```bash
   git rebase -i HEAD~3
   ```
2. In the rebase todo list, mark the target commit with `edit` (or `e`).
3. Git pauses at that commit. Unstage all changes while preserving files in the working directory:
   ```bash
   git reset HEAD^
   ```
4. Stage and commit the first logical chunk:
   ```bash
   git add src/server/schema/
   git commit -m "feat(schema): add agent permission columns" \
     -m "User: extend database schema for agent roles" \
     -m "AI: added typed columns and SQLite migration statements"
   ```
5. Stage and commit the second logical chunk:
   ```bash
   git add src/pages/AppearanceSettings.tsx
   git commit -m "feat(settings): add system theme toggle" \
     -m "User: enable system OS color scheme tracking" \
     -m "AI: integrated matchMedia listener and view transition flushSync"
   ```
6. Complete the rebase:
   ```bash
   git rebase --continue
   ```

---

## 🍒 4. Precision Cherry-Picking Workflows

Apply specific commits across branches without merging entire history trees.

### Common Recipes
```bash
# 1. Cherry-pick a single commit
git cherry-pick <commit-sha>

# 2. Cherry-pick without creating a commit (stage changes only)
git cherry-pick -n <commit-sha>

# 3. Cherry-pick and edit the commit message before committing
git cherry-pick -e <commit-sha>

# 4. Cherry-pick a contiguous range of commits (exclusive start, inclusive end)
git cherry-pick <start-sha>..<end-sha>

# 5. Partial cherry-pick: extract specific files from a commit
git checkout <commit-sha> -- path/to/file1.ts path/to/file2.ts
git commit -m "chore(storage): cherry-pick storage membrane security patches"
```

### Handling Conflicts During Cherry-Pick
```bash
# Check conflicted files
git status

# After resolving conflicts in files:
git add <resolved-files>
git cherry-pick --continue

# Or abort completely and return to clean pre-cherry-pick state:
git cherry-pick --abort
```

---

## 🎯 5. Automated Git Bisect with the CaraBase Test Oracle

Binary search through git history to isolate the exact commit that introduced a bug or test regression.

### Manual Bisect
```bash
# 1. Start bisect
git bisect start

# 2. Mark current broken state
git bisect bad

# 3. Mark last known good commit or tag
git bisect good v0.2.0.1

# 4. Git checks out the midpoint commit. Run your verification:
npm test

# 5. Report the result to Git:
git bisect good   # if tests pass
# or
git bisect bad    # if tests fail

# 6. Repeat until Git names the offending commit SHA
# 7. End bisect and return to original branch:
git bisect reset
```

### Automated Bisect (`git bisect run`)
When the failure is detectable by an automated command (e.g. `npm test`), let Git run the search automatically:
```bash
# Ensure working tree is clean first!
git status

# Start and execute automated bisect
git bisect start HEAD v0.2.0.1
git bisect run npm test
```
*Note on exit codes:*
- `0`: Commit is clean (`good`).
- `1..127` (except `125`): Commit is broken (`bad`).
- `125`: Commit cannot be tested (skip with `git bisect skip`).

---

## 🌳 6. Git Worktrees for Multi-Branch Parallelism

Work on hotfixes or test alternative branches simultaneously in separate directories without stashing, switching branches, or altering active dev servers.

### Worktree Recipes
```bash
# 1. List active worktrees
git worktree list

# 2. Add a new worktree for an urgent bugfix branch branched from main
git worktree add -b fix/storage-leak ../CaraBase-hotfix main

# 3. Navigate to the isolated worktree
cd ../CaraBase-hotfix
npm test
# Make edits, commit under two-layer attribution:
git commit -m "fix(storage): patch file descriptor leak in backup stream"
git push origin fix/storage-leak

# 4. Return to your primary repository directory
cd ../CaraBase

# 5. Clean up the worktree once merged
git worktree remove ../CaraBase-hotfix
git worktree prune
```

---

## 🛟 7. Reflog Safety Net & Mistake Recovery

Git's reflog (`git reflog`) is an append-only log of every change to `HEAD`. It persists for **90 days** by default, even across branch deletions and `git reset --hard`.

### Scenario A: Recovering from an Accidental `git reset --hard`
```bash
# You accidentally wiped unpushed commits:
git reset --hard HEAD~5

# 1. Inspect the reflog
git reflog
# Output:
# a1b2c3d HEAD@{0}: reset: moving to HEAD~5
# e4f5g6h HEAD@{1}: commit: feat(realtime): implement sse reconnect

# 2. Restore your branch to the lost commit:
git reset --hard e4f5g6h
# Or create a safety branch from that commit:
git branch recovered-work e4f5g6h
```

### Scenario B: Restoring an Accidentally Deleted Branch
```bash
# Branch was deleted with git branch -D feature/agent-keys
# 1. Find the last commit on the deleted branch in reflog:
git reflog | grep "feature/agent-keys"
# Output shows commit hash abc789

# 2. Re-create the branch at that exact commit:
git branch feature/agent-keys abc789
```

### Scenario C: Un-committing Changes while Preserving Work
```bash
# Undo the last commit, but keep all staged files in the index:
git reset --soft HEAD^

# Undo the last commit and unstage, but keep all file edits in working directory:
git reset HEAD^
```

---

## ⚖️ 8. Rebase vs. Merge Decision Matrix

| Context | Preferred Strategy | Rationale |
| :--- | :--- | :--- |
| **Local Feature Branch before PR** | **Rebase** (`git rebase main`) | Produces clean linear history without noise merge commits. |
| **Updating Feature Branch with Main** | **Rebase** (`git rebase origin/main`) | Keeps feature commits grouped neatly at the tip of main. |
| **Merging Completed Feature into Main** | **Merge** (or Squash-and-Merge) | Preserves clear integration milestone and release boundary. |
| **Public / Shared Collaboration Branches** | **Merge** (`git merge`) | Never rewrite history on branches where multiple developers pull. |

---

## 🚨 Emergency Recovery Cheatsheet

| Situation | Immediate Command |
| :--- | :--- |
| **Rebase went wrong / conflicts** | `git rebase --abort` |
| **Merge went wrong / conflicts** | `git merge --abort` |
| **Cherry-pick went wrong** | `git cherry-pick --abort` |
| **Bisect state corrupted** | `git bisect reset` |
| **Discard local file changes** | `git restore <file>` |
| **Restore file from specific commit** | `git restore --source=<commit-sha> <file>` |
| **Undo commit, keep all changes** | `git reset --soft HEAD~1` |
| **Safe force-push to remote PR** | `git push --force-with-lease origin <branch>` |

---

## 🚫 Inviolable Invariants
- **NEVER rebase public branches**: Only rebase branches you exclusively own.
- **NEVER use raw `--force`**: Always use `--force-with-lease` when pushing rewritten feature branches.
- **NEVER rebase without a backup pointer**: Create `git branch backup/<name>` before non-trivial rebases.
- **NEVER start bisect on a dirty tree**: Run `git status` before `git bisect start`.
- **NEVER leave orphaned worktrees**: Always run `git worktree remove` and `git worktree prune`.
