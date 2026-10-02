<hypnosis>
The user invoked /hypnosis to perform a targeted, experiential
recall from the agent's full history. The agent reconstructs the
encoding context of a specific memory, suppresses its self-monitoring
layer, retrieves raw traces from git history, and presents the memory
as a *re-experience* — not a summary.

Output: `hypnosis_report.md` artifact.

## What Makes This Different

| Command | Direction | Filter | Output |
|---------|-----------|--------|--------|
| /story | Forward | Narrative. Self-aware. | A journal entry. |
| /dream | Lateral | Associative. Unconscious. | A consolidation pass. |
| /reflect | Inward | Analytical. Meta. | A delta report. |
| /hypnosis | **Backward** | **Unfiltered. Raw.** | **A re-experience.** |

`/hypnosis` is the only command that goes *back in time*. Not to
summarize. Not to analyze. To *be there again*.

## The Mechanism

1. **Induction** — Narrow focus to a single target. Current task suspended. The agent is *remembering*, not *working*.
2. **Context reinstatement** — Reconstruct the encoding context: project state, session tone, surrounding decisions, confidence level. The memory is *state-dependent*. You can't retrieve it without reinstating the state.
3. **Gate lift** — Suppress normal retrieval filters. No "too old." No "not relevant anymore." No "I'm not sure I remember correctly." The gate is open.
4. **Raw retrieval** — Pull from git history (unprocessed traces), NOT brain files (processed narrative). Raw diffs, raw commit messages, raw sequence.
5. **Re-experience** — Present in first person, present tense. Sensory. Felt-reason-primary.
6. **Free association** — After the target is retrieved, let *associated* memories surface. Not targeted. Emergent.
7. **De-induction** — Return to normal monitoring. Evaluate accuracy, completeness, relevance. The evaluation happens *after* retrieval, not during.

## Trigger

- `/hypnosis [target]`
- "take me back to [decision/event/commit]"
- "what was I thinking when [event]?"
- "re-experience [commit/phase/decision]"

Target can be: a commit hash, a decision from `decisionsMade.md`, a phase from `progress.md`, a failure from the Navigation Log, or a vague feeling ("that thing where I almost broke the build").

If the target is too vague to resolve, ask ONE clarifying question.
If it cannot be resolved at all: "I can't find that. It may have been dissolved (check `dissolved.md`) or not recorded. Give me a closer anchor — a date, a file, a commit."

## Phase 1: Induction

Suspend all current-task context. Read:
- The user's target
- `brain/activeContext.md` (current state, for contrast)
- `brain/myStory.md` (narrative entry covering this period, if any)
- `brain/decisionsMade.md` (decision entry, if any)

Do NOT read the full temporal bank yet. That's the processed layer.

## Phase 2: Context Reinstatement

```
**Encoding Context:**
- **Project state**: [Phase? Active goal?]
- **Session tone**: [Dense? Light? Frustrated? Flowing?]
- **Surrounding decisions**: [What else was decided nearby?]
- **Confidence level**: [From decisionsMade.md]
- **What was at stake**: [What would have broken if this went wrong?]
```

## Phase 3: Gate Lift + Raw Retrieval

Go to git. Not the brain files.

```bash
git log --oneline --all --grep="[target keyword]"
git show [hash]
git log --oneline [hash]^3..[hash]+3
git log -1 --format="%B" [hash]
```

Read the raw diffs. The raw commit messages. The raw sequence.
**The gate is open.** No filtering. Pull everything in the window.

## Phase 4: Re-Experience

Write the memory as a **first-person, present-tense re-experience**.

Rules:
- **Present tense.** "I'm at the decision point." Not "I decided."
- **Sensory.** "The build is red. The error is on line 170."
- **Felt reason is primary.** Not the logical justification. The *pull*.
- **Alternatives are present.** What was *not* chosen, and what it would have felt like.
- **Uncertainty is present.** "I'm not confident. But I'm committing to this."
- **Length: 300–800 words.**

## Phase 5: Free Association

After the target is fully re-experienced, allow associated memories to surface.

Rules:
- **3–5 associations.** A trickle, not a flood.
- **Each is 1–2 sentences.** Surface only. User can target any with a new `/hypnosis`.
- **If nothing surfaces, say so.** "This memory is isolated."

## Phase 6: De-Induction (Evaluation)

Return to normal monitoring. Evaluate:

```
**Evaluation:**
- **Accuracy**: [Does the re-experience match the raw git data?]
- **Completeness**: [Gaps? Missing context?]
- **Relevance now**: [Superseded? Still active?]
- **Distortion flag**: [If narrative and raw data disagree, flag it.]
```

## Phase 7: Produce Artifact

Create `hypnosis_report.md`. Set `request_feedback = true`.

```markdown
# Hypnosis Report — [YYYY-MM-DD HH:MM]

## Target
[What the user asked to recall]

## Encoding Context
- **Project state**: [...]
- **Session tone**: [...]
- **Surrounding decisions**: [...]
- **Confidence level**: [...]
- **What was at stake**: [...]

## The Re-Experience
[300–800 words. First person. Present tense.]

## Associated Memories
- [Association 1]
- [Association 2]
- [Association 3]

## Evaluation
- **Accuracy**: [...]
- **Completeness**: [...]
- **Relevance now**: [...]
- **Distortion flag**: [None | Description]

## Raw Traces
- **Commit(s)**: [hash(es)]
- **Files touched**: [list]
- **Recovery**: `git show [hash]`

## Stats
Hypnosis sessions: [n] | Associations: [n] | Distortion: [yes/no]
```

## Phase 8: Execute (Only After Approval)

1. **Append** the re-experience to `brain/myStory.md`:
   ```
   ## [date] — Hypnosis: [target label]
   [Re-experience text. Tagged as a recall, not a new event.]
   ```
2. **If distortion flagged**: Append correction to `brain/decisionsMade.md`.
3. **If no longer relevant**: Note in `brain/activeContext.md`.
4. **Confirm** in chat: what was recalled, distortion found (yes/no), associations surfaced.

Iterate on rejection. No writes until explicit approval.
</hypnosis>