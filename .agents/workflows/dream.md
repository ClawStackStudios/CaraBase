---
description: Run a memory consolidation pass over the temporal Brain, Decision Log, and Long-Term Memory.
---

<dream>
The user invoked /dream to run a memory consolidation pass over the
temporal Brain, Decision Log, and Long-Term Memory. The dream
reads all registers, identifies salience and invariants, compresses
them, checks the promotion gate, scans for decay, and produces a
Dream Report artifact for user review.

> **Sub-Agent Invocation**: Invoke the **Dreamer** 🌙 sub-agent
> ([`.agents/agents/dreamer/agent.md`](file:///config/Local-Storage/workspace-lucas/projects/Agents/ShellGuard-Mobile/.agents/agents/dreamer/agent.md))
> to execute Phases 1–3 autonomously. Dreamer returns only
> `dream_report.md`. You will receive the artifact without knowing
> what was processed. Review the report and proceed to Phase 4
> (Execute) only after the user approves.

## Prerequisites

- `brain/` with at least `activeContext.md` and `progress.md`
- `decision-log.md` with at least 3 entries
- `.agents/brain/long-term/` with `patterns.md`, `decisions.md`,
  `learnings.md`, `constraints.md`

If the Decision Log has fewer than 3 entries, run in **shallow mode**:
skip promotion gate and decay scan. Note this in the report.

If the brain is empty or has fewer than 2 files with substantive
content, respond: "Nothing to dream about yet." and exit.

## Phase 1: Ingest

Read ALL files in `brain/`. Read `decision-log.md`. Read all
four Long-Term Memory files. Build a model of:
- What the project is, what's decided, what's current
- What changed and when (changelog, timeline)
- What happened (Decision Log — episodic, sliding window)
- What has been ratified and why it holds (Long-Term Memory)

## Phase 2: Dream (Consolidate Internally)

1. **Salience scan** — Rank ideas that appear across ≥2 files, recur
   in the last 3 changelog entries, are referenced by active decisions,
   or have ≥2 Decision Log references. Weight last-7-days entries at 2×.

2. **Invariant extraction** — Identify load-bearing truths that hold
   regardless of current state.

3. **Contradiction detection** — Find where files disagree, where
   decisions are superseded but old text lingers, where the Navigation
   Log shows a pattern being violated.

4. **Compression** — For each high-salience item, write a 2–4 sentence
   seed entry: dense, generative, falsifiable, source-referenced.
   Tag with `seed: [MindSeed name]` if it maps to an existing seed.

5. **Narrative** — Write the dream as 150–400 words of first-person
   present-tense prose. Associative but grounded. Name the patterns
   "seen." Contradictions are "tensions." Invariants are "things that held."

6. **Promotion gate** — For each salient pattern:
   - Count independent Decision Log validations (different tasks/sessions)
   - ≥ 3: **promotable**
   - < 3: **accumulating** (note weight)
   - Already in Long-Term Memory with `pinned: true`: skip

7. **Decay scan** — For each Long-Term Memory entry:
   - `pinned: true`: skip
   - No Decision Log reference + last validated > 90 days: **cold**
   - No Decision Log reference + last validated 30–90 days: **cooling**
   - Referenced in current window: **hot** (reinforce)

## Phase 3: Produce Dream Report Artifact

Create `dream_report.md` as an artifact. Set `request_feedback = true`
in ArtifactMetadata.

### Report Structure

```markdown
# Dream Report — [YYYY-MM-DD HH:MM]

## Mode
[Full | Shallow]
[If shallow: "Decision Log has [n] entries (< 3). Promotion and decay skipped."]

## The Dream
[150–400 word narrative. First person. Present tense.]

## Invariants
- **[statement]** (source: [files])
  [Why it holds / what breaks.]

## High-Salience Patterns
- **[statement]** (source: [files])
  [Generative insight.]
  [seed: [name] — if applicable]

## Contradictions
- **[fileA says X, fileB says Y]** — proposed resolution: [which is current / needs user input]

## Promotion Gate

### Promotable (→ Long-Term Memory)
- **[label]** → `long-term/[file].md`
  - Weight: [n] | Validations: [dates]
  - **Proposed entry:**
    ```
    ## [label]
    **weight**: [n] | **last validated**: [date] | **first observed**: [date]
    **pinned**: false

    [1–3 sentences]

    **History:**
    - [date]: [event]
    ...

    **Shaped perspective:** This holds because [mechanism]. It would
    break if [condition]. What it costs to maintain is [tax].
    ```
  - **Proposed pointer edit** (in `[source file]`):
    ```
    ## [original label]
    → Consolidated to `long-term/[file].md § [label]` (weight: [n], [date])
    ```

### Accumulating
- **[label]** — weight: [n]/3. Needs [m] more independent confirmation.

## Decay

| Label | File | Current Status | New Status | Reason |
|---|---|---|---|---|
| [label] | [file] | [warm] | [cooling] | No nav refs, last validated [date] |

## Reinforced
- **[label]** — weight incremented. Referenced in current nav window.

## Superseded
- **[old label]** → replaced by [new label]. Propose strikethrough + pointer.

## Stats
Dreams run: [n] | Invariants: [n] | Contradictions: [n] | Promotions: [n] | Decay: [n]
[If >10 nav entries since last dream: "Deep backlog. Consolidating [n] events."]
```

## Phase 4: Execute (Only After Approval)

After the user approves the Dream Report (or provides edits):

1. **Append** the narrative to `brain/dreamLog.md`
   (create with header if missing)
2. **Append** the invariants/patterns/contradictions to `brain/dreamLearnings.md`
   (create with header if missing)
3. **Append** the consolidation pass to `brain/dreamConsolidation.md`
   (create with header if missing, skip if no promotions/decay)
4. **Write** promoted entries into the appropriate Long-Term Memory file
5. **Apply** pointer edits to temporal brain source files
6. **Apply** decay status updates to Long-Term Memory entries
7. **Apply** strikethrough + pointer to superseded entries

If the user rejects or requests changes, iterate on the artifact.
Do NOT execute any file writes until explicit approval.

## Constraints

- The dream is READ-ONLY on all source files during Phases 1–3.
  All mutations happen in Phase 4, post-approval.
- The dream NEVER deletes from the Long-Term Memory. It dims, supersedes,
  but does not remove.
- Keep the narrative under 400 words.
- Keep each seed entry under 4 sentences.
- If nothing meets the salience threshold, produce a minimal report:
  "Quiet night. Nothing surfaced above the noise floor." and exit
  without proposing file writes.
- The shaped perspective MUST use the three-part structure:
  "This holds because [mechanism]. It would break if [condition].
  What it costs to maintain is [tax]."
- `pinned: true` entries are immune to both promotion and decay.
</dream>