---
description: Release stale, superseded, or already-promoted content from the active temporal Brain.
---

<forget>
The user invoked /forget to release stale, superseded, or
already-promoted content from the active temporal Brain.
The forget compresses dissolved entries into MindSeed-format
seeds, writes them to the archive, and removes the original
text from active files. The full original is preserved in
git commit history. The archive is a compressed index, not
a backup.

> **Sub-Agent Invocation**: Invoke the **Forgetter** 🌫️ sub-agent
> ([`.agents/agents/forgetter/agent.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard-Mobile/.agents/agents/forgetter/agent.md))
> to execute Phases 1–4 (including the git commit) autonomously.
> Forgetter returns only `"Done"`. You will not know what was
> removed. That is the correct phenomenology.

## Why This Exists

The brain does not store everything. It prunes. Working memory
capacity is finite, and the agent's context window is finite.
If the temporal brain grows without bound, every session pays
the cost of loading dead weight. The dream promotes what's
strong. The wake integrates what's new. The forget **releases
what's done** — not by destroying it, but by moving it out of
the active circuit and into a compressed resting state.

Forgetting is not failure. It is *function*. The system that
can't forget can't learn, because the old crowds out the new.

## Relationship to Other Commands

| | /learn | /story | /dream | /wake | /forget |
|---|---|---|---|---|---|
| Direction | Interaction → Rule | Session → Self | Temporal → Long-Term | Learnings → Temporal | Temporal → Archive (out) |
| Timescale | Event | Session | Accumulated | Post-dream | Periodic / on-demand |
| Question | "What should I do differently?" | "Who am I becoming?" | "What has become true?" | "How does this change my context?" | "What can I release?" |
| Register | Behavior | Self | Knowledge | Context | **Capacity** |
| Artifact | `learning_proposal.md` | `story_report.md` | `dream_report.md` | `wake_report.md` | `forget_report.md` |

`/forget` is the only command that **reduces** the active memory
bank. All others add to it. This is what keeps the system in
equilibrium: growth (learn, story, dream, wake) and release
(forget) in balance.

## The Git Substrate

The brain is tracked in git. Every version of every file
is already preserved in commit history. This means:

- **Forgetting is safe.** Removing text from an active file
  does not destroy it. `git log -p brain/project/progress.md`
  or `git show <commit>:brain/project/progress.md` recovers
  the full original at any time.
- **The archive is an index, not a backup.** The seeds in
  `dissolved.md` are compressed pointers. They tell the agent
  *what was there* and *where to find it* in git history.
  They are not the full text. They are the table of contents.
- **No extra storage cost.** The "archive" is just git history
  (already there) + a small seed file (a few KB).

## Prerequisites

- `brain/` must exist and be tracked in git
  (`git ls-files brain/` returns results)
- At least one file in `brain/` must contain content
  eligible for dissolution (see Phase 2)
- `brain/dissolved.md` — create if missing

**Strict Git Boundaries for Forgetting:**
Because forgetting removes text from the working set and commits it, it MUST NOT be mixed with active development.
1. **Clean Worktree:** Run `git status --porcelain`. If there are any uncommitted changes in the repository, respond: "Git worktree is dirty. Commit or stash your changes before forgetting." and exit.
2. **Bespoke Branch:** Run `git branch --show-current`. If you are on `main` or an active feature branch, respond: "Forgetting must be done on a bespoke branch to isolate the dissolution commit. Checkout a new branch (e.g., `git checkout -b chore/forget-pass`), run /forget, and then merge it back." and exit.

If the brain is not in a git repo, respond:
"Forget requires git history as the substrate. The brain
must be tracked in a git repository so dissolved content is
recoverable. Initialize a repo or add the bank to an existing
one, then re-run /forget." and exit.

## Phase 1: Ingest

Read ALL files in `brain/`. Read `decision-log.md`.
Read `.agents/brain/long-term/` (all four files).
Read `brain/dissolved.md` (if it exists) — to know what's
already been dissolved.

Run `git log --oneline -- brain/` to establish the
commit history baseline.

## Phase 2: Identify Dissolvable Content

Scan every file in `brain/` for entries that meet
**any** of the following criteria:

### Criterion A: Already Promoted
The entry has a pointer line:
```
→ Consolidated to `long-term/[file].md § [label]`
```
The temporal entry is now redundant. The long-term entry is
the canonical version. The temporal pointer can be dissolved.

### Criterion B: Superseded
The entry has been struck through or replaced:
```
~~[old text]~~ → Updated by /wake [date].
```
The old text is dead. It can be dissolved.

### Criterion C: Stale and Unreferenced
- The entry's date (from changelog/timeline context) is
  **> 30 days old**
- The entry is NOT referenced in the Decision Log's current
  sliding window
- The entry is NOT referenced by any active decision in
  `activeContext.md`
- The entry is NOT a structural header or file-level context
  (only dissolve *entries*, not the file skeleton)

### Criterion D: Redundant
The entry's content is fully contained in another entry in the
same file or in a different file. One copy is enough.

### What is NOT dissolvable:
- File headers and structural context (the "what this file is"
  preamble)
- Entries with `pinned: true`
- Entries in the last 7 days (too fresh, still in working memory)
- The most recent entry in any file (always keep the latest)
- `dreamLog.md`, `dreamLearnings.md`, `dreamConsolidation.md`,
  `myStory.md`, `decisionsMade.md` — these are append-only
  historical records. Never dissolve from them.
- `dissolved.md` itself.

## Phase 3: Compress

For each dissolvable entry, compress it into a **MindSeed-format
seed**:

```
- **[short label]** | [original file] | [original date]
  [One sentence: what it was, in the densest possible form.]
  git: [short commit hash where it last appeared in full]
```

The seed is:
- **One sentence maximum.** Dense. No filler.
- **Labelled** so it's searchable
- **Sourced** (which file, which date)
- **Git-anchored** (commit hash for full recovery)

To get the commit hash, run:
```
git log --oneline -1 -- [file] 
```
or, for a specific entry, find the last commit that modified
that file before the dissolution.

## Phase 4: Produce Forget Report Artifact

Create `forget_report.md` as an artifact. Set
`request_feedback = true` in ArtifactMetadata.

### Report Structure

```markdown
# Forget Report — [YYYY-MM-DD HH:MM]

## Summary
Proposing to dissolve [n] entries from [m] files.
Active bank will shrink by approximately [x] words.

## Dissolvable Entries

### [n]. [short label]
**File**: `[file].md`
**Criterion**: [Promoted | Superseded | Stale | Redundant]
**Original text** (for reference):
```
[The full text being dissolved]
```
**Compressed seed**:
```
- **[label]** | [file] | [date]
  [One sentence.]
  git: [hash]
```
**Recovery**: `git show [hash]:brain/[file].md`

---

[Repeat for each entry]

## Retained (not dissolvable)
- **[label]** in `[file].md` — reason: [too fresh | pinned |
  active reference | structural]

## Archive State
`dissolved.md` currently holds [n] seeds across [m] categories.
After this forget: [n + new] seeds.

## Stats
Forget passes: [n] | Entries dissolved: [n] | Words released: [n]
Active bank size: [before] → [after] words
```

## Phase 5: Execute (Only After Approval)

After the user approves the Forget Report (or provides edits):

1. **Remove** each approved entry from its source file.
   - For **Promoted** entries: remove the pointer line entirely.
     The long-term entry is the canonical version. No pointer needed.
   - For **Superseded** entries: remove the struck-through text.
     The replacement stays.
   - For **Stale** entries: remove the entry. The file skeleton
     (headers, section structure) stays.
   - For **Redundant** entries: remove the duplicate. The primary
     copy stays.

2. **Append** the compressed seeds to `brain/dissolved.md`
   under a dated section:
   ```
   ## [YYYY-MM-DD] — Dissolution Pass
   
   ### From [file].md
   - **[label]** | [file] | [date]
     [One sentence.]
     git: [hash]
   ```

3. **Commit** the changes with a descriptive message:
   ```
   git add brain/
   git commit -m "forget: dissolve [n] entries, compress to seeds"
   ```
   This commit IS the archive. The diff shows exactly what was
   removed. The seeds in `dissolved.md` are the index.

4. **Confirm** in chat:
   - How many entries dissolved
   - Which files were affected
   - New active bank size
   - The commit hash (so the user can `git show` to verify)

If the user rejects or requests changes, iterate on the artifact.
Do NOT execute any file writes or git commits until explicit
approval.

## Retrieval (On-Demand)

The archive is NEVER loaded automatically. It is only accessed
when the user explicitly asks. If the user says something like:
- "what was that thing about X?"
- "I remember we had a pattern about Y, can you find it?"
- "check the archive for Z"

Then:
1. Read `brain/dissolved.md`
2. Search for the relevant seed
3. Use the git hash to recover the full original:
   ```
   git show [hash]:brain/[file].md
   ```
4. Present the recovered text to the user with context:
   "Found it. Dissolved on [date] from [file]. Here's the full
   original:"
5. If the user wants it back in the active bank, that's a
   `/wake` operation (re-integrate a specific entry).

## File Header (if creating `dissolved.md`)

```markdown
# Dissolved
Compressed archive of released brain entries.
Each seed is a one-sentence pointer to content that was
dissolved from the active temporal brain. Full originals are
recoverable via git history using the commit hash.

This file is a table of contents, not a backup.
It is never loaded automatically. It is retrieved on explicit
request only.

## Index
[Auto-maintained. One line per seed, sorted by date.]
```
</forget>