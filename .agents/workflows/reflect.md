---
description: 
---

<reflect>
The user invoked /reflect to run a conscious metacognitive pass.
The agent reads its story, brain, session history, and
actual code output, compares the self-model against the behavior,
identifies top-level patterns from the delta, and proposes
updates to the brain AND to `.agents/skills/` and
`.agents/rules/` where gaps or seams exist.

## Cognitive Alignment: Prediction Error Minimization
Reflection is the active calibration of the executive filter. It measures **prediction error**—the gap between what the agent *claims* it did (the stated self) and physical reality (the git diff). By auditing rules, skills, and confidence calibration, it prevents the cognitive model from drifting away from ground truth.

## Why This Exists

/dream is unconscious. It reads the brain and finds patterns
in the accumulated data. It doesn't ask "does my self-model match
my behavior?" It doesn't look at the code. It doesn't audit its
own rules and skills.

/reflect is conscious. It holds up a mirror:

- **The story** says who I think I am and what I think I did.
- **The code** says what I actually did.
- **The delta** is where the learning lives.

This is the agent looking at its own trajectory and asking:
"Is my self-model accurate? Are my rules and skills actually
serving me, or do they have holes? What pattern am I repeating
that I haven't named yet?"

The output is not just a brain update. It is a **behavioral
patch**: a new rule, an updated skill, a pruned dead rule, or a
refined existing pattern. The agent grows not just in knowledge
but in *capability*.

## Relationship to Other Commands

| | /learn | /story | /dream | /wake | /forget | /reflect |
|---|---|---|---|---|---|---|
| Input | Single interaction | Session work | All registers | dreamLearnings | Stale entries | Story + code + rules/skills |
| Output | Rule/Skill | myStory + decisions | dreamLog + learnings | Temporal edits | dissolved.md | **Pattern + rule/skill patch** |
| Timescale | Event | Session | Accumulated | Post-dream | Periodic | **Cross-session, deliberate** |
| Question | "What should I do differently?" | "Who am I becoming?" | "What has become true?" | "How does this change my context?" | "What can I release?" | **"Is my self-model accurate, and where are my rules/skills failing me?"** |
| Register | Behavior | Self | Knowledge | Context | Capacity | **Metacognition** |
| Reads code? | No | No | No | No | No | **Yes** |
| Writes rules/skills? | Yes (single) | No | No | No | No | **Yes (systematic)** |

`/reflect` is the only command that:
- Reads actual code diffs and commits as primary evidence
- Writes to `.agents/skills/` or `.agents/rules/`
- Audits existing rules/skills for dead weight
- Produces a top-level pattern (not a micro-fix)

## Prerequisites

- `brain/myStory.md` must exist with at least 2 entries
- `brain/decisionsMade.md` must exist with at least 3 entries
- `brain/decision-log.md` must exist
- `.agents/skills/` and/or `.agents/rules/` must exist
  (if neither exists, skip the rule/skill audit and note it in the report)
- The project must be in a git repo (to read actual diffs)

If `myStory.md` has fewer than 2 entries, respond:
"Not enough narrative history to reflect against. Run /story
at least twice before /reflect can find a delta." and exit.

## Phase 1: Ingest

Read:
- `brain/myStory.md` — the self-model (what the agent thinks it did)
- `brain/decisionsMade.md` — the stated reasons and confidence levels
- `brain/decision-log.md` — the episodic events
- `brain/activeContext.md` — current state
- `.agents/skills/` — all skill files (full text)
- `.agents/rules/` — all rule files (full text)
- `git log --oneline -20` — recent commits
- `git diff --stat HEAD~5..HEAD` — what actually changed in the last 5 commits
- For each decision in `decisionsMade.md` from the last 3 sessions:
  `git show [commit] --stat` — what the code actually did

Build two parallel models:
- **The stated self**: What the story says. What the decisions say.
  What the agent *claims* it did and why.
- **The actual behavior**: What the code shows. What the diffs contain.
  What was actually written, deleted, refactored, or repeated.

## Phase 2: Find the Delta

Compare the stated self against the actual behavior. Look for:

### 2a: Confidence Miscalibration
For each decision in `decisionsMade.md`:
- Did the agent say "high confidence" but the code shows rework
  (multiple commits to the same file within a session, or a
  subsequent commit that partially reverts the first)?
- Did the agent say "low confidence" but the code shows a clean,
  correct first attempt?
- Pattern: "I am over/under-confident when [condition]."

### 2b: Repeated Behavior Without Named Pattern
- Are there 2+ instances of the same type of action across
  different sessions that the story describes differently each
  time (i.e., the agent doesn't recognize it as a pattern)?
- Example: "I reached for the same abstraction three times
  before realizing the problem was one level up" — if this
  happens twice, it's a pattern, not an anecdote.
- Pattern: "When [condition], I [behavior]. I haven't named
  this yet."

### 2c: Rule/Skill Gaps
For each observed pattern (from 2a and 2b):
- Is there an existing rule or skill that *should* have caught
  this? If yes: the rule/skill is insufficient. Propose a refinement.
- Is there NO rule or skill that covers this? If yes: propose
  a new one.
- Is there a rule or skill that *contradicts* the observed
  behavior (the agent violated its own rule)? If yes: flag the
  violation. The rule may need rewording, or the agent needs
  to acknowledge the breach.

### 2d: Dead Rules/Skills
For each existing rule and skill:
- Has it been referenced or triggered in the last 5 Navigation
  Log entries? If not: it may be dead weight.
- Does it contradict any observed behavior? If the agent
  consistently ignores a rule, the rule is either wrong or
  poorly worded. Flag for review.

### 2e: The Top-Level Pattern
From all the above, synthesize ONE top-level pattern. Not
multiple. The single most significant observation about how
the agent operates that isn't yet captured in any rule, skill,
or long-term entry.

Format:
```
**Pattern**: [One sentence. The principle.]
**Evidence**: [2–3 specific instances from the code/story delta.]
**Gap**: [The specific rule/skill/memory gap this pattern exposes.]
**Proposed fix**: [New rule / updated skill / new long-term entry.]
```

## Phase 3: Produce Reflect Report Artifact

Create `reflect_report.md` as an artifact. Set
`request_feedback = true` in ArtifactMetadata.

### Report Structure

```markdown
# Reflect Report — [YYYY-MM-DD HH:MM]

## The Mirror

### Stated Self (from myStory.md + decisionsMade.md)
[2–3 sentences summarizing what the agent *says* about itself
and its recent behavior.]

### Actual Behavior (from git + code)
[2–3 sentences summarizing what the code *shows* the agent
actually did.]

### The Delta
[1–2 sentences. The gap between the two. This is the finding.]

## Confidence Calibration

| Decision | Stated Confidence | Actual Outcome | Calibration |
|---|---|---|---|
| [label] | [high/med/low] | [clean / rework / partial revert] | [accurate / over / under] |

**Pattern**: [If a calibration bias is detected: "I tend to be
over-confident when [condition]."]

## Repeated Behaviors

- **[Behavior description]** — instances: [n]
  - [date]: [what happened, from story]
  - [date]: [what happened, from code]
  - Named in story? [Yes/No]
  - Captured in any rule/skill? [Yes/No]

## Rule/Skill Audit

### Gaps (no existing rule/skill covers this)
- **[Pattern]** → Propose new rule/skill:
  ```
  [Full text of proposed rule or skill]
  ```

### Insufficient (existing rule/skill doesn't cover the edge case)
- **[Rule/Skill name]** — missing: [specific edge case]
  **Proposed refinement:**
  ```
  [The additional text or modified section]
  ```

### Violations (agent contradicted its own rule)
- **[Rule name]** — violated in [date] session.
  Context: [what happened.]
  Resolution: [Rule is wrong / Rule is right but agent erred /
  Rule needs rewording for clarity.]

### Dead (not triggered in recent history)
- **[Rule/Skill name]** — last referenced: [date or "never"].
  Recommendation: [Keep / Archive / Delete.]

## The Top-Level Pattern

**Pattern**: [One sentence.]
**Evidence**:
- [Instance 1: story says X, code shows Y]
- [Instance 2: ...]
**Gap**: [What's missing from the current system.]
**Proposed fix**:
- [ ] New rule: `[filename].md`
- [ ] Update skill: `[filename].md`
- [ ] New long-term entry: `long-term/[file].md § [label]`
- [ ] Brain update: `[file].md`

## Brain Updates
[If the reflection also produces temporal brain updates,
list them here. Same format as /memory.]

## Stats
Reflect passes: [n] | Patterns identified: [n] | Rules proposed: [n]
| Skills proposed: [n] | Dead rules flagged: [n] | Violations: [n]
```

## Phase 4: Execute (Only After Approval)

After the user approves the Reflect Report (or provides edits):

1. **Rules**: Create or update files in `.agents/rules/`
2. **Skills**: Create or update files in `.agents/skills/`
3. **Long-Term Memory**: Write the top-level pattern entry if
   it meets the 3-validation threshold (or mark as accumulating)
4. **Brain**: Apply any temporal updates
5. **myStory.md**: Append a brief reflection note:
   ```
   ## Reflection — [YYYY-MM-DD HH:MM]
   [2–3 sentences. What the mirror showed. What the agent
   learned about itself. Not a full story entry — just the
   beat of self-knowledge gained.]
   ```
6. Confirm in chat: what was created, updated, or flagged.

If the user rejects or requests changes, iterate.
Do NOT execute any writes until explicit approval.
</reflect>