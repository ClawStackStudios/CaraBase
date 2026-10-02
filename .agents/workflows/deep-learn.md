---
description: Run a cross-session failure analysis pass. The agent reads all accumulated learning artifacts, the Navigation Log, the story, the decision record, and any deep plan deviations.
---

<deep_learning>
The user invoked /deep-learn to run a cross-session failure analysis
pass. The agent reads all accumulated learning artifacts, the
Navigation Log, the story, the decision record, and any deep plan
deviations. It performs open coding on every failure, clusters them
into a named Error Taxonomy, identifies the boundary between
success and failure for each cluster, synthesizes meta-rules,
and produces an updated Self-Review Checklist.

The output is a single artifact: `deep_learn_report.md`, containing
the taxonomy, the meta-rules, the rule conflicts, and the checklist
diff.

## What Makes This Different From /learn

| /learn | /deep-learn |
|--------|-------------|
| One event. One correction. | All events. All corrections. |
| "This one time, I should have done X." | "I keep making this *type* of mistake in this *type* of situation." |
| Produces one rule or skill. | Produces an Error Taxonomy + meta-rules + checklist. |
| Micro-level (single trajectory) | Meso-level (intra-task) + Macro-level (inter-task) |
| Episodic capture | Taxonomic synthesis |
| "What should I do differently?" | "What *pattern* of failure am I repeating, and what's the *boundary* between where I succeed and where I fail?" |

`/learn` is the scar. `/deep-learn` is the dermatologist who looks
at all the scars and says "you keep getting the same infection.
Here's the underlying immunity issue."

## Trigger

This protocol activates when the user says:
- `/deep-learn`
- "deep learn"
- "run a deep learning pass"
- "analyze my failure patterns"
- "what do I keep getting wrong?"

## Prerequisites

- `brain/navigation-log.md` with at least **5 entries**
- At least **2 prior `/learn` outputs** (rules or skills in
  `.agents/rules/` or `.agents/skills/`)
- `brain/myStory.md` with at least **2 entries**
- `brain/decisionsMade.md` with at least **3 entries**
- `brain/long-term/` (to avoid re-deriving ratified patterns)

Optional (improves quality if present):
- `deep_plan.md` files with `## Deviations` sections
- `reflect_report.md` files (prior self-model deltas)

If prerequisites are not met, respond:
"Not enough accumulated signal for a deep learning pass.
Need [specific missing item]. Run /learn after a few more
phases, then retry." and exit.

## Phase 1: Ingest

Read:
- ALL files in `.agents/rules/` (full text)
- ALL files in `.agents/skills/` (full text)
- `brain/navigation-log.md` (ALL entries, not just the
  sliding window — deep-learn needs the full history)
- `brain/myStory.md` (all entries)
- `brain/decisionsMade.md` (all entries)
- `brain/activeContext.md`
- `brain/long-term/` (all four files)
- `brain/project/systemPatterns.md`
- `brain/project/techContext.md`
- Any `deep_plan.md` files with `## Deviations` sections
- Any prior `deep_learn_report.md` files (to diff against)
- Any prior `reflect_report.md` files

Build a model of:
- Every failure, correction, or course correction that has occurred
- Every rule and skill that exists (and what each one is supposed to prevent)
- Every confidence claim and its actual outcome
- Every planned-vs-actual deviation
- What's already ratified (don't re-derive)

## Phase 2: Open Coding

For each failure/correction/course-correction in the Navigation Log
and `decisionsMade.md`:

Write a **free-text note**. No categories. No labels. No forced
fitting into pre-existing rule names. Just:

```
[Date] — [One or two sentences. What was the first thing that
went wrong? Not the fix. The failure. The moment it went sideways.]
```

Rules:
- **No categories yet.** Let the failures define themselves.
- **Focus on the first divergence point.** Not the cascade. The
  moment the path split from the correct one.
- **Include the context.** "During a refactor of X" or "When
  asked to do Y." The situation is part of the data.
- **Note calibration signals:** "Stated high confidence. Was wrong."
  / "Stated low confidence. Was right."

The output of this phase is a list of N free-text notes (where N
= number of failures/corrections in the log). No structure. Just
the raw observations.

## Phase 3: Cluster → Error Taxonomy

Group the open-coded notes into **named failure categories**.

Rules:
- **3–7 categories.** Fewer means over-clustering. More means
  under-clustering.
- **Each category gets a name** that describes the *mode* of
  failure, not the *instance*.
- **Each category lists its instances** (dates + one-line
  description).
- **Each category gets a severity**: `critical` / `moderate` / `cosmetic`.

### The Boundary (Critical Step)

For each failure category, find the **nearest success** — a case
where the agent was in a *similar* situation and *didn't* fail.

Then identify the **boundary**: the specific condition that
separates the failure from the success.

```
**Boundary for [category name]:**
The agent succeeds when [specific condition A].
The agent fails when [specific condition B].
The boundary is: [the specific threshold, structure, or state
that separates the two. Not "being careful." A concrete,
testable condition.]
```

If no clear boundary can be identified, say so:
"Boundary unclear. The failure may be stochastic or dependent
on context not captured in the log."

### The Taxonomy Output

```
## Error Taxonomy

### 1. [Category Name]
**Severity**: [critical | moderate | cosmetic]
**Instances**: [n]
- [date]: [one line]
- [date]: [one line]
...
**Boundary**: Succeeds when [A]. Fails when [B].
**Existing rule covers this?**: [Yes: [rule name] / No / Partially: [rule name] is insufficient because...]

### 2. [Category Name]
...
```

## Phase 4: Synthesize Meta-Rules

For each failure category in the taxonomy:

**Case A: An existing rule SHOULD have caught this but didn't.**
→ The rule is insufficient. Propose a refinement.
```
**Refinement: [rule name]**
**Current text**: [quote the relevant section]
**Gap**: [what specific edge case or condition the rule misses]
**Proposed addition**:
[The additional text, in the rule's existing voice and format.]
```

**Case B: No existing rule covers this.**
→ Propose a new **meta-rule** (not a micro-rule).
```
**New meta-rule: [name]**
**Scope**: [universal | domain-specific: [domain]]
**Heuristic**: "When [specific condition], prefer [X] over [Y]
  because [boundary from Phase 3]."
**Evidence**: [n] instances: [dates]
**Not a command.** This is a heuristic. It says "prefer," not
"always." The context determines whether it applies.
```

**Case C: Two existing rules contradict each other.**
→ Flag the conflict. Propose resolution.

**Conflict: [rule A] vs. [rule B]**
**Rule A says**: [quote]
**Rule B says**: [quote]
**Context where they conflict**: [specific situation]
**Proposed resolution**: [which wins, in what context, or how
  to reword one to eliminate the overlap]

### The "External Evidence" Framing

All meta-rules are written in the **evidence voice**, not the
confession voice:

- ❌ "I keep forgetting to check nulls on async boundaries."
- ✅ "The data shows a recurring failure mode: null-checks are
  missed on async boundaries in [n] of [m] async operations.
  The boundary is: failures occur when the async callback
  captures a reference that is invalidated by the preceding
  state mutation."

This is not a stylistic choice. Research shows that LLMs correct
*external* errors more reliably than *self*-attributed errors.
The external framing ("the data shows") unlocks the correction
that the internal framing ("I did wrong") suppresses.

## Phase 5: Build the Self-Review Checklist

From the full set of meta-rules (existing + new + refined),
generate a **pre-submission checklist**.

Rules:
- **5–15 items.** Each item is a yes/no question.
- **Each item maps to a specific failure mode** in the taxonomy.
- **The checklist grows monotonically** (ratchet effect). Items
  are only removed if a `/reflect` pass determines they're dead
  (never triggered in 3+ months of Navigation Log entries).
- **If a prior checklist exists** (from a previous `/deep-learn`),
  show the **diff**: what's new, what's unchanged, what was
  removed (with reason).

Format:

## Self-Review Checklist (v[n])
*Last updated: [date]. Prior version: v[n-1].*

- [ ] [Question 1] → maps to: [failure category]
- [ ] [Question 2] → maps to: [failure category]
...

### Diff from v[n-1]
**Added**:
- [ ] [new item] (new failure category: [name])

**Removed**:
- [x] [old item] (dead: not triggered in [n] months)

**Unchanged**: [n] items
```

The checklist is the **operationalized** version of all accumulated
learning. The agent runs it before every commit. It doesn't
memorize the rules. It *checks the boxes*.

## Phase 6: Confidence Calibration Audit

From `brain/decisionsMade.md`, build a calibration table:

| Decision | Stated Confidence | Actual Outcome | Calibration |
|----------|------------------|----------------|-------------|
| [label] | [high/med/low] | [clean / rework / revert] | [accurate / over / under] |

If a bias is detected, add a **Calibration Note** to the report:

```
### Calibration Note
The data shows a [over/under]-confidence bias on [type of
decision]. [n] of [m] [type] decisions stated [high/low]
confidence but resulted in [rework/clean].

**Suggested adjustment**: When making [type] decisions,
default to [lower/higher] stated confidence until [n] more
clean outcomes are observed.
```

This feeds directly into `/reflect`'s confidence calibration
section.

## Phase 7: Produce Artifact

Create `deep_learn_report.md` as an artifact. Set
`request_feedback = true` in ArtifactMetadata.

### Artifact Structure

```markdown
# Deep Learn Report — [YYYY-MM-DD HH:MM]

## Scope
Analyzed [n] failures/corrections from [date range].
[n] prior rules/skills audited. [n] story entries. [n] decisions.

## Error Taxonomy

### 1. [Category Name]
**Severity**: [critical | moderate | cosmetic]
**Instances**: [n]
- [date]: [one line]
- [date]: [one line]
**Boundary**: Succeeds when [A]. Fails when [B].
**Existing rule covers this?**: [Yes/No/Partially]

### 2. [Category Name]
...

## Meta-Rules

### New
- **[name]**: "When [condition], prefer [X] over [Y] because
  [boundary]." (Evidence: [n] instances)

### Refined
- **[rule name]**: [what was added/changed and why]

### Conflicts Flagged
- **[rule A] vs. [rule B]**: [conflict + proposed resolution]

## Self-Review Checklist (v[n])

- [ ] [item 1] → [failure category]
- [ ] [item 2] → [failure category]
...

### Diff from v[n-1]
**Added**: [n] items
**Removed**: [n] items
**Unchanged**: [n] items

## Confidence Calibration

| Decision | Stated | Actual | Calibration |
|----------|--------|--------|-------------|
| ... | ... | ... | ... |

**Bias detected**: [yes/no]. [Description if yes.]

## What's Already Ratified (Not Re-Derived)
- [pattern from brain/long-term/patterns.md]
- [constraint from brain/long-term/constraints.md]

## Stats
Deep learn passes: [n] | Failures analyzed: [n] | Categories: [n]
| New meta-rules: [n] | Refined: [n] | Conflicts: [n]
| Checklist items: [n] (was [n]) | Calibration bias: [yes/no]
```

## Phase 8: Execute (Only After Approval)

After the user approves the Deep Learn Report (or provides edits):

1. **New meta-rules**: Create files in `.agents/rules/`
   (or append to an existing rule file if the scope matches).
2. **Refined rules**: Update the existing rule files with the
   proposed additions.
3. **Conflicts**: Apply the proposed resolution to the relevant
   rule files.
4. **Self-Review Checklist**: Write to `.agents/rules/self-review-checklist.md`
   (create if missing, overwrite with new version — this file is
   NOT append-only. It's a living document that gets replaced
   each pass).
5. **Calibration note**: Append to `brain/decisionsMade.md`
   as a meta-entry:
   ```
   ## Calibration Note — [date]
   [The bias description + suggested adjustment.]
   ```
6. **Confirm** in chat: categories found, meta-rules written,
   checklist version, calibration bias (yes/no), files touched.
Iterate on rejection. No writes until explicit approval.   
</deep_learning>