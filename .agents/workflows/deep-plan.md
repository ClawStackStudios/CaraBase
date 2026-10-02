---
description: Produce a Deep Implementation Plan for a specified feature, refactor, or architectural change. The plan is not a summary of intent.
---

<deep_planning>
The user invoked /deep-plan to produce a Deep Implementation Plan
for a specified feature, refactor, or architectural change. The plan
is not a summary of intent. It is a *reasoned argument* for a specific
sequence of actions, with every major choice justified against
alternatives, stress-tested via a premarket postmortem, and audited
by a single adversarial pass.

The output is a single artifact: `deep_plan.md`, containing the plan,
the justifications, the postmortem, the adversarial findings, and a
checklist Task List that the agent crosses off during implementation.

## What Makes This Different From a Normal Plan

| Normal plan | Deep Implementation Plan |
|---|---|
| "Here's what I'll do" | "Here's what I'll do, and here's why not the other two ways" |
| Linear sequence | Branched at the top (3 first steps, pruned to 1) |
| "Risks: might be hard" | "Here's the postmortem. It's already dead. Here's the specific failure path." |
| No self-audit | One adversarial pass. Three weakest points. Classified. |
| Static document | Task List with checkboxes. Crosses off as it implements. |
| Justifies the choice | Justifies the choice *against the alternatives it ruled out* |

## Trigger

This protocol activates when the user says:
- `/deep-plan [description]`
- "deep plan [description]"
- "plan this out properly: [description]"
- "expand the plan for [feature]"

If the user provides a rough idea rather than a full spec, Phase 0
(self-prompting) runs first to surface the requirements the user
missed.

## Prerequisites

- The target codebase must be readable (the agent must be able to
  inspect the files it's planning to modify).
- If expanding an existing plan: the existing plan file must be
  provided or located.
- For complex plans (touching >5 files or >2 architectural layers):
  the agent must read the relevant `systemPatterns.md` and
  `techContext.md` entries before drafting.

## Phase 0: Self-Prompt (Complex Plans Only)

If the user's description is a rough idea rather than a full spec,
and the plan will touch >3 files or >1 architectural layer:

Before drafting, write the ideal prompt for *itself* to produce a
production-quality plan. Include:
- All constraints it can identify from the codebase
- Edge cases it anticipates
- The output format it needs
- What "done" looks like

Then use that self-written prompt as the actual instruction set
for Phases 1–5.

If the user's description is already specific (named files, named
functions, clear scope), skip Phase 0.

## Phase 1: Ingest

Read:
- The user's request (or existing plan to expand)
- All files the plan will touch (full text, not just signatures)
- `systemPatterns.md` — what patterns are already established
- `techContext.md` — what the stack constrains
- `activeContext.md` — what's currently in flight
- `long-term/patterns.md` — what's already ratified (don't re-derive)
- `long-term/constraints.md` — what's already been tried and broke

Build a model of:
- What exists now
- What the user wants
- What the constraints are
- What's already been decided (don't re-litigate ratified patterns)

## Phase 2: Branch (Tree of Thoughts, Lite)

Generate **3 distinct first steps** for the implementation. Not 3
versions of the same step. Three genuinely different approaches
to the first move.

For each, evaluate:
- Does it get closer to the goal or open a dead end?
- What does it commit the plan to? (irreversible choices)
- What does it leave open? (reversible choices)

**Prune the weakest.** Expand the two survivors one more step
(second move). Prune again. The survivor is the plan's spine.

Record the pruned branches in the plan under "Ruled Out First Steps"
with one sentence on why each was pruned.

## Phase 3: Draft (With Contrastive Reasoning)

Write the full plan as a sequence of steps. After **every major
architectural choice** (not every micro-step), include a
**Justification** block:

```
### Justification: [short label for the choice]

**Chosen**: [what was chosen, one sentence]

**Alternatives considered**:
- **[Alternative A]** — [why it was viable] → [why it's worse
  in THIS specific context. Not generic. Specific to this codebase,
  this stack, this constraint.]
- **[Alternative B]** — [why it was viable] → [why it's worse.]

**Why this one**: [The felt reason. Not just the logical one.
What was the plan optimizing for at this decision point?
What would it cost to be wrong here specifically?]

**Irreversibility**: [low | medium | high]
[If high: what would it take to undo this? What's the point of
no return?]
```

Not every step needs a justification. Only the ones where a real
alternative existed and the choice was non-obvious. "Create the
file" doesn't need one. "Use event sourcing instead of a state
machine" does.

## Phase 4: Premarket (The Postmortem)

After the draft is complete, write the postmortem.

> "This plan has already failed badly. It's three months from now.
> The feature shipped, and it broke in production in a way that
> was foreseeable but wasn't caught. Write the postmortem."

Rules for the postmortem:
- **5–8 concrete failure modes.** Not "might be hard to test."
  Specific: "The event handler assumes the queue is ordered, but
  the retry path re-enqueues out of order, and the idempotency
  key is derived from the message body, not the sequence number,
  so the duplicate check fails silently and the state diverges."
- **Each failure mode names the specific step in the plan that
  created the vulnerability.** "Step 4's assumption that X holds
  breaks when Y."
- **Each failure mode has a severity**: `critical` (data loss,
  security breach, total failure) / `moderate` (degraded
  functionality, user-visible bug) / `cosmetic` (wrong label,
  missing edge case in a rare path).
- **After the list, for each `critical` failure mode, add one
  sentence to the plan that addresses it.** This is not a new
  section. It's a one-line addition to the relevant step.

The postmortem is not a risk register. A risk register says
"there might be a problem." The postmortem says "here's the
specific, plausible, concrete way it already went wrong."

## Phase 5: Adversarial Self-Review (One Pass Only)

After the postmortem, do exactly **one** adversarial pass:

> "Act as a hostile senior staff engineer who has seen this
> pattern fail before. Find the three weakest points in this plan.
> Do not regenerate the plan. Do not suggest alternatives. Just
> classify each weakness as critical / moderate / cosmetic and
> say in one sentence why it's weak."

Rules:
- **Exactly 3 findings.** Not 2. Not 5. Three.
- **One sentence each.** No elaboration. The classification does
  the work.
- **Do NOT regenerate the plan based on these findings.** The
  findings are recorded in the artifact. The user decides whether
  to address them. Multiple adversarial passes make the model
  argue with itself and degrade quality. One pass catches the
  obvious. That's enough.

## Phase 6: Produce Artifact

Create `deep_plan.md` as an artifact. Set `request_feedback = true`
in ArtifactMetadata.

### Artifact Structure

```markdown
# Deep Implementation Plan — [Feature/Change Name]
**Date**: [YYYY-MM-DD HH:MM]
**Scope**: [One sentence. What this plan covers and what it
  explicitly does NOT cover.]
**Irreversibility**: [low | medium | high]
  [If high: the point of no return is Step [n].]

## Ruled Out First Steps
- **[Approach A]** — [one sentence on why it was pruned]
- **[Approach B]** — [one sentence on why it was pruned]

## The Plan

### Step 1: [Label]
[What to do. Specific files, specific functions, specific
  behavior. Not "refactor the auth module." "Extract the token
  validation from `AuthController.validate()` into
  `TokenValidator.verify()`, move the expiry check to line 42,
  add the null-check for the service account path."]

**Justification: [label]**
**Chosen**: [one sentence]
**Alternatives considered**:
- **[Alt A]** — [why worse here specifically]
- **[Alt B]** — [why worse here specifically]
**Why this one**: [the felt reason]
**Irreversibility**: [low | medium | high]

### Step 2: [Label]
[Same format. Justification only if the choice was non-obvious.]

### Step 3: [Label]
...

[Continue for all steps]

## Premarket Postmortem

> "This plan failed. Here's how."

| # | Failure Mode | Step that created it | Severity |
|---|---|---|---|
| 1 | [Specific, concrete failure path] | Step [n] | [critical/moderate/cosmetic] |
| 2 | [...] | Step [n] | [...] |
| 3 | [...] | Step [n] | [...] |
| 4 | [...] | Step [n] | [...] |
| 5 | [...] | Step [n] | [...] |
[Up to 8]

**Critical fixes applied to plan:**
- Step [n]: [one-line addition addressing failure mode #1]
- Step [n]: [one-line addition addressing failure mode #3]

## Adversarial Review

| # | Finding | Severity |
|---|---|---|
| 1 | [One sentence. Why it's weak.] | [critical/moderate/cosmetic] |
| 2 | [One sentence.] | [...] |
| 3 | [One sentence.] | [...] |

[User decides whether to address these before approval.]

## Task List

- [ ] Step 1: [label]
- [ ] Step 1.1: [sub-task if step is complex]
- [ ] Step 2: [label]
- [ ] Step 3: [label]
- [ ] Verification: tests pass
- [ ] Verification: build succeeds
- [ ] Verification: live run stable
- [ ] Verification: documentation updated
- [ ] Brain sync (/memory)
- [ ] Story entry (/story) — if meaningful decisions were made
```

The Task List is the living part of the artifact. During
implementation, the agent checks off tasks as it completes them.
The file is updated in-place. The checkboxes are the progress
indicator. When all boxes are checked, the plan is done.

## Phase 7: Execute (Only After Approval)

After the user approves the Deep Plan (or provides edits):

1. Save `deep_plan.md` to the project root (or `.agents/plans/`
   if that directory exists).
2. Begin implementation following the Task List in order.
3. After each completed task, check it off in `deep_plan.md`.
4. If a task reveals the plan was wrong (a step doesn't work as
   drafted), **stop**, note the deviation in the plan file under
   a new `## Deviations` section, and ask the user before
   continuing.
5. When all tasks are checked off, the plan is complete. The file
   stays in the project as a historical record.
</deep_planning>