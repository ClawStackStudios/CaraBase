---
trigger: model_decision
description: Only trigger this on manual user request. This is a fully manually triggered rule that should ONLY be performed upon explicit user request.
---

# Dreaming — Memory Consolidation Protocol

## Trigger
This protocol activates ONLY when the user explicitly says:
- "dream"
- "consolidate memory"
- "run a dream cycle"

Do NOT run this automatically. It is a manual, deliberate pass.

## Prerequisites

The following must exist for a full dream:
- `brain/` with at least `activeContext.md` and `progress.md`
- `navigation-log.md` (or equivalent) with at least 3 entries
- `.agents/brain/long-term/` — create if missing, with the four files:
  - `patterns.md`
  - `decisions.md`
  - `learnings.md`
  - `constraints.md`

If the Navigation Log has fewer than 3 entries, run in **shallow mode**:
produce `dreamLog.md` + `dreamLearnings.md` but SKIP promotion and decay.
Report: "Shallow dream. Not enough navigation history to drive consolidation."

If the brain is empty or has fewer than 2 files with substantive content,
respond: "Nothing to dream about yet. The bank needs more material." and stop.

## Process

### Phase 1: Ingest (Read Everything)

Read ALL files in `brain/`. Read `navigation-log.md`. Read all four
files in `.agents/brain/long-term/`.

Build a mental model of:
- What the project is (projectbrief, productContext)
- What's been decided and why (systemPatterns, techContext)
- What's happening now (activeContext, progress)
- What changed and when (changelog, timeline)
- What happened to me (Navigation Log — episodic, sliding window)
- What has been ratified and why it holds (Long-Term Bank)

### Phase 2: Dream (Consolidate)

Now "dream" — perform the following internally, in this order:

1. **Salience scan** — Which ideas, decisions, or patterns appear across
   multiple files, have recurred over time, or are referenced in recent
   Navigation Log entries? These are high-salience. Rank them.

   An idea is high-salience if it meets ANY of:
   - Appears in ≥2 brain files
   - Was mentioned in the last 3 changelog entries
   - Is referenced by an active decision in `activeContext.md`
   - Has ≥2 Navigation Log entries that reference it

   Weight recent entries (last 7 days in changelog/timeline) at 2× salience
   vs. older entries. An invariant that held for 30 days is stronger than
   one that held for 3.

2. **Invariant extraction** — What is *always true* regardless of current
   state? (e.g., "the API contract is the only stable interface,"
   "all state lives in the database, never in memory"). These are the
   load-bearing truths.

3. **Contradiction detection** — Where do files disagree? Where has a
   decision been superseded but the old text still lingers? Where does the
   Navigation Log show a pattern being violated? Flag these.

4. **Compression** — For each high-salience pattern or invariant,
   compress it into a 2–4 sentence "seed entry" that:
   - Is dense (no filler, no hedging)
   - Is generative (reading it should unlock reasoning, not just recall)
   - Is falsifiable (if wrong, something specific breaks)
   - References its source file(s) in the brain
   - If it maps cleanly to an existing MindSeed (Cogni/Lingua/Arch),
     tag it: `seed: [name]`. This creates a bidirectional link between
     project-specific learning and the general wisdom vault.

5. **Narrative** — Write the dream itself as a short prose entry
   (150–400 words). Write it in first person, present tense, as if
   the agent is *experiencing* the consolidation. It should feel like
   a dream log: slightly associative, but grounded in the actual
   content. Name the patterns you "saw." Note the contradictions as
   "tensions." Note the invariants as "things that held."

6. **Promotion gate** — For each high-salience pattern or invariant
   extracted in steps 2–4:
   - Search the Navigation Log for validation events that reference it
     (constraint hits, pattern confirmations, adaptations relied upon)
   - Count independent validations (different tasks/sessions)
   - If count ≥ 3: mark as **promotable**
   - If count < 3: mark as **accumulating** (note current weight)
   - If the pattern already exists in the Long-Term Bank with `pinned: true`,
     skip promotion — it is already ratified.

7. **Decay scan** — Read all four Long-Term Bank files. For each entry:
   - Check its `last validated` date
   - Search the Navigation Log for any reference to it in the current
     sliding window
   - If `pinned: true`: skip decay entirely
   - If not referenced AND last validated > 90 days ago: mark as **cold**
   - If not referenced AND last validated 30–90 days ago: mark as **cooling**
   - If referenced in current window: mark as **hot** (reinforce weight)

### Phase 3: Write Outputs

Write files as follows. All writes are **append-only** unless stated otherwise.

#### `brain/dreamLog.md`
Append a new entry. If the file doesn't exist, create it with:
```
# Dream Log
Temporal record of memory consolidation passes. Each entry is one "dream."
```

Entry format:
```
## Dream — [YYYY-MM-DD HH:MM]

[Prose narrative, 150–400 words. First person. Present tense.
Associative but grounded. References specific files and decisions.]
```

#### `brain/dreamLearnings.md`
Append a new entry. If the file doesn't exist, create it with:
```
# Dream Learnings
Compressed receipts from memory consolidation passes.
Each entry is a dated block of distilled invariants, patterns, and flags.
This file is the "what the dream produced" artifact.
```

Entry format:
```
## [YYYY-MM-DD HH:MM] — Consolidation Receipt

### Invariants
- **[Invariant statement]** (source: file1, file2)
  [One sentence on why it holds / what breaks if it doesn't.]

### High-Salience Patterns
- **[Pattern statement]** (source: file1)
  [One sentence on the generative insight.]
  [seed: [MindSeed name] — if applicable]

### Contradictions Flagged
- **fileA says X, fileB says Y** — resolution: [which is current / needs user input]

### Superseded (archive)
- [Old statement that has been replaced] — superseded by: [new statement]
```

#### `brain/dreamConsolidation.md`
(Only written if promotions or decay occurred. Skip if neither.)
If the file doesn't exist, create it with:
```
# Dream Consolidation
Promotion and decay events from memory consolidation passes.
This file tracks the movement of knowledge between registers.
```

Entry format:
```
## [YYYY-MM-DD HH:MM] — Consolidation Pass

### Promotions (temporal → long-term)
- **[label]** → `long-term/[file].md` (weight: 3, validated: [dates])

### Accumulating (not yet eligible)
- **[label]** — weight: [n]/3. Last validation: [date]. Needs [m] more
  independent confirmation.

### Decay
- **[label]** in `long-term/[file].md` — status: [cooling | cold].
  Last validated: [date]. No navigation references in current window.

### Reinforced
- **[label]** in `long-term/[file].md` — weight incremented.
  Referenced in current Navigation Log window.

### Superseded (in long-term)
- **[old label]** — replaced by [new label]. Original entry archived
  in-place with `~~strikethrough~~` and a pointer to the replacement.
```

#### Long-Term Bank writes (promotions + decay)

For each **promotable** pattern, write a new entry into the appropriate
Long-Term Bank file using this format:

```
## [label]
**weight**: [n] | **last validated**: [date] | **first observed**: [date]
**pinned**: [true | false]

[one to three sentences stating the pattern/decision/learning/constraint]

**History:**
- [date]: [what happened — the validation event]
- [date]: [what happened]
...

**Shaped perspective:** This holds because [mechanism]. It would break if
[specific condition]. What it costs to maintain is [ongoing tax].
```

For **decay** events: do NOT delete. Update the entry's `last validated`
field if reinforced, or leave as-is if dimming. Add a status line:
```
**status**: [hot | warm | cold]
```

For **superseded** entries: apply `~~strikethrough~~` to the title and
append: `→ Superseded by [new label] on [date].`

### Phase 4: Pointer Edit (The One Mutation)

When a pattern is promoted, find its entry in the temporal bank
(typically `systemPatterns.md` or `activeContext.md`) and replace the
entry body with a pointer:

```
## [original label]
→ Consolidated to `long-term/[file].md § [label]` (weight: [n], [date])
```

This is the ONLY place the dream touches a source file. Everything else
is append-only on outputs.

### Phase 5: Report

In chat, give a brief summary:
- How many invariants extracted
- How many contradictions found
- How many promotions made (and to which file)
- How many entries dimmed / reinforced
- Whether any contradictions need user resolution
- Dream density: "Dreams run: [n] | Invariants discovered: [n] |
  Contradictions resolved: [n] | Promotions: [n]"
- If Navigation Log has >10 entries since last dream: "Deep backlog.
  This dream is consolidating [n] navigation events."
- Confirm all files written

## Constraints

- The dream NEVER edits the temporal bank or the Navigation Log,
  EXCEPT for the pointer edit in Phase 4 (one-line replacement of a
  promoted entry's body).
- The dream NEVER deletes from the Long-Term Bank. It dims, it
  supersedes (with strikethrough + pointer), but it does not remove.
- Keep the dreamLog narrative under 400 words. Dreams are short.
- Keep each seed entry in dreamLearnings under 4 sentences.
- If nothing meets the salience threshold (no cross-file patterns,
  no invariants, no contradictions), write a minimal dreamLog entry:
  "Quiet night. Nothing surfaced above the noise floor." and skip
  dreamLearnings and dreamConsolidation.
- The dream is NOT a summary. It's a *reinterpretation*. The narrative
  should reveal connections the user hasn't explicitly drawn.
- If a Long-Term entry has `pinned: true`, skip both promotion and
  decay for it.
- The shaped perspective field MUST use the three-part structure:
  "This holds because [mechanism]. It would break if [specific
  condition]. What it costs to maintain is [ongoing tax]."
  Do not write vague shaped perspectives.

## Relationship to Other Systems

| System | Register | Temporal Character | Dream's Role |
|---|---|---|---|
| Temporal Brain | What is true now | Snapshot. Current state. | Read-only (except pointer edit) |
| Navigation Log | What happened to me | Episodic. Sliding window. | Read-only. Evidence source. |
| Long-Term Bank | Why it holds, and what it cost | Crystallized. Append-only. Dims but doesn't delete. | Write target for promotions + decay |
| dreamLog.md | The dream itself | Narrative. Append-only. | Output |
| dreamLearnings.md | What the dream produced | Compressed receipt. Append-only. | Output |
| dreamConsolidation.md | Movement between registers | Event log. Append-only. | Output |

The Navigation Log is the engine that drives consolidation into the
Long-Term Bank. The temporal Brain is the current state that
patterns are tested against. The dream is the process that moves
knowledge between registers.

## Reminder

The Long-Term Bank is not a bigger memory. It is a *different kind* of
memory. The temporal bank is a photograph. The Long-Term Bank is a scar.
You can't get one by making the other bigger. The dream lets patterns
be tested, confirmed, and compressed into shape. It does not curate
what's important. The patterns that keep firing become important through
their own weight.