---
description: Sync the temporal Brain with the current state of the project and check the long-term promotion gate.
---

<memory>
The user invoked /memory to sync the temporal Brain with the
current state of the project and check the long-term promotion gate.
Produces a Memory Report artifact for user review.

## Cognitive Alignment: Short-Term Encoding
This workflow acts as the waking **hippocampal encoding** phase. It takes the immediate experiences, decisions, and state shifts of the current session and secures them in short-term storage (the temporal brain). Without this secure encoding, the Dreamer has no accurate episodic material to replay and consolidate.

## What It Does (and Doesn't)

**Does:**
- Updates temporal brain files with current state
- Checks the 3-validation promotion gate against the Decision Log
- Produces a `memory_report.md` artifact

**Does NOT:**
- Write narratives or dream logs
- Weave dreamLearnings into the bank (that's /wake)
- Dissolve stale entries (that's /forget)
- Write story or decision records (that's /story)
- Touch the Long-Term Memory except to propose promotions

This is the save point. Quick, factual, no ceremony.

## Prerequisites

- `brain/` must exist with at least `activeContext.md`
- `decision-log.md` must exist
- `.agents/brain/long-term/` must exist (or be creatable)

If the bank doesn't exist, respond: "No brain found. Run the
temporal brain setup first." and exit.

## Phase 1: Ingest

Read:
- All files in `brain/` and `brain/project/`
- `decision-log.md`
- `.agents/brain/long-term/` (all four files)
- The current session's conversation (for what just happened)

## Phase 2: Identify Updates

For each temporal brain file, determine what needs updating:

| File | Update trigger |
|---|---|
| `activeContext.md` | Current state changed (new decisions, phase shifts, active work items) |
| `project/progress.md` | Phase or milestone status changed |
| `project/changelog.md` | New changes since last entry |
| `project/systemPatterns.md` | New pattern observed or existing pattern refined |
| `project/techContext.md` | Stack, tooling, or environment changed |
| `project/productContext.md` | Product decisions or constraints changed |
| `project/projectBrief.md` | Project scope or goals shifted |

For each file that needs an update, draft the specific edit
(add / refine / supersede). Keep edits minimal — only what
actually changed.

## Phase 3: Promotion Gate Check

For each pattern in `systemPatterns.md` (and any other temporal
file containing patterns):

1. Search the Decision Log for validation events referencing it
2. Count independent validations (different tasks/sessions)
3. If count ≥ 3 AND not already in Long-Term Memory: mark **promotable**
4. If count < 3: mark **accumulating** (note current weight)
5. If already in Long-Term Memory: skip

For promotable patterns, draft the Long-Term Memory entry using the
standard format:

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

## Phase 4: Produce Memory Report Artifact

Create `memory_report.md` as an artifact. Set
`request_feedback = true` in ArtifactMetadata.

### Report Structure

```markdown
# Memory Report — [YYYY-MM-DD HH:MM]

## Bank Updates

### [file].md
**Edit type**: [Add | Refine | Supersede]
**Proposed text:**
```
[The exact text]
```

[Repeat for each file that needs updating. If no files need
updating: "No temporal updates needed. Bank is current."]

## Promotion Gate

### Promotable
- **[label]** → `long-term/[file].md`
  - Weight: [n] | Validations: [dates]
  - **Proposed entry:**
    [Full long-term entry text]
  - **Proposed pointer** (in `[source file]`):
    ```
    → Consolidated to `long-term/[file].md § [label]` (weight: [n], [date])
    ```

### Accumulating
- **[label]** — weight: [n]/3. Needs [m] more.

### No promotions this pass
[If nothing is promotable, just say so.]

## Stats
Memory syncs: [n] | Files updated: [n] | Promotions: [n]
Active bank size: [n] words
```

## Phase 5: Execute (Only After Approval)

After the user approves:

1. Apply each temporal brain edit
2. Write promoted entries into the Long-Term Memory
3. Apply pointer edits to temporal source files
4. Confirm in chat: files updated, promotions made, bank size

If the user rejects or requests changes, iterate.
Do NOT execute any writes until explicit approval.
</memory>