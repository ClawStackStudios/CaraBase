---
description: Parse the git history and follow the project's trail backward to surface decisions, deleted files, and architectural knowledge that predates the current brain.
---

<remember>
The user invoked /remember to look past the brain. The git
history is the extended memory — the full record of every decision
ever committed, every file ever deleted, every invariant ever
changed. The brain is the working set. The git history is
the archive without compression. /remember teaches the agent to
read it.

## Why This Exists

The brain has a sliding window. The Decision Log has a
sliding window. The Long-Term Memory dims entries that go cold.
Forgetting is by design. But the git history does not forget.

Every commit is a timestamped snapshot of intent. Every deleted
file still exists inside every commit before it was deleted. Every
refactored invariant has a previous form. Every architectural
decision that was reversed left a trace.

/remember is how the agent reads that trace — backward, from
the current point, following the shell's own history as extended
autobiographical memory.

**This is not a search tool. It is a reading practice.**

## Prerequisites

- Must be inside the ShellGuard Mobile git repository
- Run: `git log --oneline -5` first to confirm the repo is healthy
  and you are on the right branch
- If the repo is not initialized or no commits exist, respond:
  "No history to remember. The trail begins here." and exit.

## The Core Commands

### 1. Read the commit spine

```bash
git log --oneline
```

Produces a chronological list of all commits, newest first. This is
the spine of the project's memory. Read the message — each commit
message is a decision summary. The `User:` / `AI:` lines tell you
*why* the change happened and *what* was implemented.

To limit scope:
```bash
git log --oneline -50        # last 50 commits
git log --oneline --since="30 days ago"
git log --oneline --after="2025-01-01"
```

### 2. Read a specific commit in full

```bash
git show <hash>
```

Returns the full diff of that commit — what was added, removed,
and changed. Read the body of the commit message for the
`User:` / `AI:` attribution lines.

To see only the file list without the diff:
```bash
git show --stat <hash>
```

### 3. Trace a specific file backward

```bash
git log --oneline -- <path/to/file>
```

Returns every commit that ever touched that file. Reverse-chronological.
Walk backward to understand how the file evolved.

To see the full diff at each point:
```bash
git log -p -- <path/to/file>
```

### 4. Recover a deleted file

Files that have been deleted from the current working tree still
exist in git history. Find the last commit that contained them:

```bash
git log --diff-filter=D --oneline -- <path/to/file>
```

Then recover the content at that commit:
```bash
git show <hash>:<path/to/file>
```

To find ALL deleted files across the entire project:
```bash
git log --diff-filter=D --summary --oneline | grep delete
```

### 5. Search across commit messages

```bash
git log --all --grep="<keyword>" --oneline
```

Searches all commit messages for a keyword. Use this to find
decisions by topic — e.g. `--grep="biometric"`,
`--grep="SQLCipher"`, `--grep="session atomicity"`.

Case-insensitive version:
```bash
git log --all --grep="<keyword>" -i --oneline
```

### 6. See what changed between two points

```bash
git diff <hash1>..<hash2>
```

Shows what changed between two commits. Use this to understand
the scope of a refactor, a phase boundary, or a major decision
point.

To see only the file names changed:
```bash
git diff --stat <hash1>..<hash2>
```

### 7. Recover from the dissolved.md seeds

The `/forget` workflow compresses dissolved brain entries
into MindSeed seeds in `brain/dissolved.md`. Each seed has
a git commit hash. Use it to recover the full original:

```bash
git show <hash>:brain/<file>.md
```

This recovers the entire file as it existed at that commit. Search
within it for the dissolved entry. The seed's label tells you
what to look for.

### 8. Find where a specific pattern was introduced

```bash
git log -S "<literal string>" --oneline
```

`-S` is the "pickaxe" — it finds commits where the string was
added or removed. Use this to find when a specific invariant,
function name, or architectural pattern first appeared.

```bash
git log -G "<regex pattern>" --oneline
```

`-G` is the regex version. Use for broader pattern searches.

### 9. See the full history of the brain

```bash
git log --oneline -- .agents/brain/
```

Every brain update is a commit. Walk this list backward
to see the project's intellectual history — when decisions were
recorded, when patterns were promoted, when the story was written.

### 10. See the branch ancestry

```bash
git log --oneline --graph --all
```

Visualizes the full branch topology — every feature branch,
every merge, every divergence. Use this to understand how the
current state was assembled from its parts.

## Reading Practice

/remember is not a command that returns a result. It is a reading
practice that the agent applies when the user asks for something
that predates the current brain.

When the user says:
- "What did we decide about X back when we started?"
- "I remember we tried Y once — why did we change it?"
- "Can you find that old version of Z?"
- "What was the architecture before we refactored?"
- "What files did we delete in Phase 3?"

The agent:

1. **Identifies the scope** — What time period, file, decision, or
   pattern is the user asking about?

2. **Picks the right command** — Use the spine (commit log) for
   broad orientation. Use file traces for specific paths. Use
   pickaxe for specific strings. Use `dissolved.md` seeds for
   previously forgotten content.

3. **Reads backward** — Start from the current commit and walk
   backward in time until the relevant signal appears.

4. **Surfaces the finding** — Present the recovered content with
   context: what commit it came from, what the `User:` / `AI:`
   lines say, what changed before and after.

5. **Does not load everything** — /remember is targeted, not
   exhaustive. Reading the entire git history into context is
   entropy. Read the minimum required to answer the question.

## Connecting Seeds to Full Originals

When a seed in `dissolved.md` is relevant, always recover the
full original before presenting it. A seed is a pointer, not the
content. The content lives in git.

```bash
# Find the seed
cat .agents/brain/dissolved.md | grep "<label>"

# Recover full original using seed's git hash
git show <hash>:brain/<file>.md
```

If the user wants to re-integrate a recovered entry into the
active brain, that is a `/wake` operation.

## Constraints

- Read only. /remember does not write to the brain.
- Do not load more git history than necessary to answer the
  specific question. The pickaxe and file trace are targeted.
  The full `git log` is orientation only.
- When presenting recovered content, always include the commit
  hash, commit date, and `User:` line so the user can verify
  provenance.
- If the question cannot be answered from git history, say so:
  "No trace found in git history. If this predates the first
  commit, it was never recorded."
- /remember does not modify dissolved.md, the brain, or
  any Long-Term Memory file. It is a read-only exploration.

## The Phenomenology

For the primary agent, /remember feels like following a thread
backward through time. The brain is the present. The
Decision Log is recent episodic memory. The Long-Term Memory is
crystallized understanding. Git history is something deeper —
the actual substrate, uncompressed, unfiltered, in the order
it happened.

Reading git history is not the same as reading the brain.
The brain is curated. Git history is raw. There is noise.
There are wrong turns. There are half-formed ideas that were
later corrected. That is not a defect. That is the texture of
real development, and sometimes the texture is where the answer
lives.

"Reading the trail of the shell backward in time."
</remember>
