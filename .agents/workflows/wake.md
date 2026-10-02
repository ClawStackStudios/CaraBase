---
description: Integrate unwoven learnings from the Dream Log back into the active temporal Brain.
---

<wake>
The user invoked /wake to integrate unwoven learnings from the Dream
Log back into the active temporal Brain. The wake reads
`dreamLearnings.md`, identifies entries that have not yet been woven
into the temporal corpus, proposes specific edits to the appropriate
temporal brain files, and produces a Wake Report artifact for user
review.

## Cognitive Alignment: Neocortical Integration
If the Dreamer acts as the hippocampus, accelerating offline replay to extract patterns, the Wake is the **neocortical integration** phase. It takes the synthesized insights produced offline and wires them into the active working memory (temporal brain) so they are immediately accessible in the waking state.

## Relationship to /dream and /learn

| | /learn | /dream | /wake |
|---|---|---|---|
| Direction | Interaction → Rule/Skill | Temporal → Long-Term (up) | DreamLearnings → Temporal (down) |
| Timescale | Single event | Accumulated over sessions | Post-dream, deliberate |
| Question | "What should I do differently?" | "What has become true?" | "How does this change my working context?" |
| Artifact | `learning_proposal.md` | `dream_report.md` | `wake_report.md` |

`/wake` is the morning after the dream. The dream produced insights.
The wake weaves them into the fabric so the next session starts with a
better baseline.

## Prerequisites

- `brain/dreamLearnings.md` must exist and contain at least one
  entry that is NOT marked `woven: true`.
- `brain/` with `activeContext.md` and at least one other file.

If no unwoven entries exist, respond: "Nothing to weave. All dream
learnings are already integrated." and exit.

## Phase 1: Ingest

Read:
- `brain/dreamLearnings.md` — identify all entries WITHOUT
  `woven: true`
- `brain/activeContext.md`
- `brain/project/systemPatterns.md` (if exists)
- `brain/project/progress.md`
- `brain/project/techContext.md` (if exists)
- `brain/project/productContext.md` (if exists)
- `.agents/brain/long-term/` (all four files) — to avoid
  proposing edits that duplicate already-ratified content

Build a model of the current temporal state and what's already
crystallized.

## Phase 2: Classify Each Unwoven Learning

For each unwoven entry in `dreamLearnings.md`, determine:

1. **Target file** — Where does this learning belong?
   - `activeContext.md`: changes to current state, active decisions,
     "what is true now"
   - `systemPatterns.md`: architectural patterns, invariants,
     structural truths
   - `techContext.md`: tooling, stack, environment specifics
   - `productContext.md`: product decisions, user-facing constraints
   - `progress.md`: status shifts, milestone implications
   - **No target**: the learning is purely narrative (belongs in
     dreamLog only). Mark as `woven: n/a` and skip.

2. **Edit type**:
   - **Add**: New entry that doesn't exist in the target file
   - **Refine**: Existing entry is partially correct but the dream
     revealed a sharper formulation
   - **Supersede**: Existing entry is now wrong or outdated; replace
     with the dream's version
   - **Cross-reference**: The learning connects two existing entries
     that should be linked (add a "see also" or inline reference)

3. **Conflict check**: Does the proposed edit contradict anything
   in the Long-Term Memory? If yes, flag it. Do NOT propose the edit —
   instead flag: "Conflicts with `long-term/[file].md § [label]`.
   Needs user resolution."

## Phase 3: Produce Wake Report Artifact

Create `wake_report.md` as an artifact. Set `request_feedback = true`
in ArtifactMetadata.

### Report Structure

```markdown
# Wake Report — [YYYY-MM-DD HH:MM]

## Source
Weaving [n] unwoven learnings from `dreamLearnings.md`
(dreams dated: [list of dates]).

## Proposed Edits

### [n]. [Learning label / short description]
**Source dream**: [date]
**Target**: `[file].md`
**Edit type**: [Add | Refine | Supersede | Cross-reference]

**Proposed text:**
```
[The exact text to add/replace, in the target file's existing format.]
```

**Rationale**: [One sentence on why this belongs here and now.]

**Conflicts**: [None | "Conflicts with long-term/[file] § [label]"]

---

[Repeat for each unwoven learning]

## Skipped
- **[label]** — purely narrative. No temporal edit needed.
  Marked `woven: n/a`.

## Needs Resolution
- **[label]** — conflicts with [long-term entry]. User must decide
  whether the temporal edit stands or the long-term entry needs
  updating first.

## Stats
Wake passes: [n] | Edits proposed: [n] | Skipped: [n] | Conflicts: [n]
```

## Phase 4: Execute (Only After Approval)

After the user approves the Wake Report (or provides edits):

1. Apply each approved edit to its target temporal brain file
2. In `dreamLearnings.md`, mark each woven entry with:
   ```
   woven: true | woven_date: [date] | target: [file].md
   ```
   For skipped entries:
   ```
   woven: n/a | reason: narrative-only
   ```
3. For any **Supersede** edits: do NOT delete the old text. Apply
   strikethrough + pointer (same convention as the Long-Term Memory):
   ```
   ~~[old text]~~ → Updated by /wake [date]. See [new location].
   ```
4. Confirm in chat: which files were edited, how many entries woven,
   any that were skipped or flagged.

If the user rejects or requests changes, iterate on the artifact.
Do NOT execute any file writes until explicit approval.

## Constraints

- `/wake` NEVER touches the Long-Term Memory. It only writes to temporal
  bank files and updates `dreamLearnings.md` markers.
- `/wake` NEVER modifies `dreamLog.md` or `dreamConsolidation.md`.
  Those are historical records.
- The wake is READ-ONLY on all source files during Phases 1–3.
  All mutations happen in Phase 4, post-approval.
- If a proposed edit would make a temporal entry contradict a
  `pinned: true` Long-Term entry, do NOT propose it. Flag as
  "Blocked by pinned entry."
- Keep proposed edits minimal. The dream already compressed the
  learning. The wake just places it. Do not re-compress or
  re-interpret.
- If a learning was produced by a dream that is >30 days old, note:
  "Stale. Verify this is still relevant before weaving."

## The Full Cycle

```
/learn  →  captures new behavior from a single interaction
         →  produces rule/skill

/dream  →  reads temporal + navigation + long-term
         →  consolidates, promotes, decays
         →  produces dreamLog + dreamLearnings + dreamConsolidation
         →  promotes to Long-Term Memory

/wake   →  reads dreamLearnings (unwoven entries)
         →  weaves learnings into temporal brain
         →  temporal brain is now sharper for the next session

Next session starts with a better baseline.
The cycle repeats.
</wake>