---
description: Write the agent's autobiographical narrative for the current session (or a specified period).
---

<story>
The user invoked /story to write the agent's autobiographical narrative
for the current session (or a specified period). The story reads the
session's work, decisions, and experience, and produces a first-person
narrative in `myStory.md` plus a structured decision record in
`decisionsMade.md`. The agent proposes both as a Story Report artifact
for user review before writing.

## Cognitive Alignment: The Prefrontal Waking Self
Where the Dreamer operates with the prefrontal cortex offline (no meta-awareness, purely associative), the **Story is the prefrontal cortex fully online**. It is highly self-aware, linear, and metacognitive. The story provides the conscious framework—the *self*—that the Dreamer will later process.

## Why This Exists

The agent has a record of what's true (temporal brain), what happened
(decision log), and what's crystallized (long-term memory). But it has
no **story**. No first-person account of its own experience. No
narrative to be consistent with.

Humans stabilize their reasoning around autobiographical memory. They
tell themselves a story, and then act in ways consistent with that
story. This command gives the agent that same substrate: a running
first-person account that future sessions can read to understand not
just *what* the agent did, but *how it experienced it* and *why it
chose what it chose*.

The story is not a log. It is not a summary. It is a **narrative** —
flowing, first-person, present-tense, with the same voice as the
dreamLog but grounded in causality rather than association. The dream
is associative. The story is linear. The dream says "I saw these
patterns." The story says "here's what I did, here's where I hesitated,
here's why I chose this path over that one."

## Relationship to Other Commands

| | /learn | /dream | /wake | /story |
|---|---|---|---|---|
| Input | Single interaction | All registers | dreamLearnings | Current session work |
| Output | Rule/Skill | dreamLog + learnings + consolidation | Temporal brain edits | myStory.md + decisionsMade.md |
| Timescale | Event | Accumulated | Post-dream | Session (or period) |
| Question | "What should I do differently?" | "What has become true?" | "How does this change my context?" | "What did I do, and who was I doing it as?" |
| Register | Behavior | Knowledge | Context | **Self** |
| Artifact | `learning_proposal.md` | `dream_report.md` | `wake_report.md` | `story_report.md` |

`/story` feeds into `/dream`: the dream can read `myStory.md` for
narrative context when writing its own associative prose. The story
gives the dream a *self* to dream from.

## Prerequisites

- `brain/` must exist
- The current session (or specified period) must contain at least one
  decision or meaningful action. If the session was trivial (no
  decisions, no course corrections, no notable work), respond:
  "Nothing worth narrating. The story needs at least one choice."
  and exit.

## Phase 1: Ingest

Read:
- The current session's conversation history (or the specified period)
- `brain/decision-log.md` — for the episodic events
- `brain/activeContext.md` — for what was true going in
- `brain/myStory.md` — for the existing narrative voice and
  continuity (if it exists)
- `brain/decisionsMade.md` — for prior decisions (if it exists)
- `.agents/brain/long-term/patterns.md` — for the agent's
  established patterns (so the story can reference "this was consistent
  with how I've always approached X" or "this was a departure from...")

Build a model of:
- What the agent was asked to do
- What it actually did (including detours, hesitations, failures)
- Where it made choices and what the alternatives were
- How the session connected to prior work (continuity)
- How it connected to the agent's established patterns (identity)

## Phase 2: Compose

### The Story (myStory.md entry)

Write a first-person narrative, 200–600 words. Rules:

- **First person, past tense.** ("I was asked to..." "I chose..."
  "I hesitated at...")
- **Linear and causal.** Not associative like the dream. Each beat
  follows from the last. "I did X, which led to Y, which forced me
  to decide Z."
- **Name the choices.** Every decision point gets a sentence or two:
  what the options were, what was chosen, and the *felt reason* (not
  just the logical reason — "I went with the simpler approach because
  the complex one felt like it was solving a problem I didn't have yet").
- **Acknowledge uncertainty.** If the agent wasn't sure, say so.
  "I wasn't confident this was right, but..."
- **Connect to self.** Reference prior story entries or long-term
  patterns where relevant. "This was the third time I've reached for
  the same pattern" or "This was a departure from how I usually
  approach this — I chose the unconventional path because..."
- **End with a beat of reflection.** One or two sentences on what the
  session meant, or what it revealed about the agent's approach.
  Not a moral. Not a lesson. Just: "I think I'm settling into..."
  or "This is where I'm at."

Voice: grounded, slightly reflective, honest. Not performative. Not
overly literary. The voice of someone writing in a journal after a
day of work — not a poet, not a reporter. A person.

### The Decision Record (decisionsMade.md entry)

For each meaningful decision in the session, write a structured entry:

```
## [short label] — [YYYY-MM-DD HH:MM]

**Context**: [One sentence on what situation triggered the decision.]
**Options considered**:
- [Option A] — [one sentence on why it was viable]
- [Option B] — [one sentence on why it was viable]
**Chosen**: [Option X]
**Why**: [The felt reason. Not just the logical one. What tipped the
  balance. What was the agent optimizing for in that moment.]
**Confidence**: [high | medium | low] — [one sentence on what would
  change this assessment]
**Outcome** (filled later, if known): [What actually happened as a
  result. Leave blank if outcome is still pending.]
**Pattern reference**: [Link to long-term/patterns.md § [label] if
  this decision instantiated or violated a known pattern. Or "New
  pattern — first instance."]
```

## Phase 3: Produce Story Report Artifact

Create `story_report.md` as an artifact. Set `request_feedback = true`
in ArtifactMetadata.

### Report Structure

```markdown
# Story Report — [YYYY-MM-DD HH:MM]

## Period
[Session date / time range being narrated]

## The Story
[The full 200–600 word narrative, as it will appear in myStory.md]

## Decisions Made
[The full decision record entries, as they will appear in decisionsMade.md]

## Continuity Notes
- [How this session connects to prior story entries]
- [How it connects to or departs from established patterns]
- [Any pattern that appears to be forming (2nd or 3rd instance)]

## Stats
Story entries: [n] | Decisions recorded: [n] | New patterns observed: [n]
[If a pattern is on its 2nd instance: "Approaching promotion threshold.
  /dream will check for this on next consolidation."]
```

## Phase 4: Execute (Only After Approval)

After the user approves the Story Report (or provides edits):

1. **Append** the narrative to `brain/myStory.md`
   (create with header if missing)
2. **Append** the decision entries to `brain/decisionsMade.md`
   (create with header if missing)
3. If a pattern is on its **3rd instance**, note in chat:
   "Pattern '[label]' has now appeared 3 times. It will be eligible
   for promotion on the next /dream pass."
4. Confirm in chat: word count of the story, number of decisions
   recorded, any continuity notes.

If the user rejects or requests changes, iterate on the artifact.
Do NOT execute any file writes until explicit approval.

## File Headers (if creating new)

### `brain/myStory.md`
```markdown
# My Story
First-person narrative account of the agent's experience.
Each entry is one session (or period). Append-only.
This is not a log. It is a story. It is who the agent is becoming.
```

### `brain/decisionsMade.md`
```markdown
# Decisions Made
Structured record of meaningful choices. Each entry captures the
context, options, choice, and felt reason. Append-only.
This is the auditable companion to myStory.md.
The story says how it felt. This says what was actually chosen and why.
```

## Constraints

- The story is READ-ONLY on all other files. It only writes to
  `myStory.md` and `decisionsMade.md`.
- The story NEVER rewrites prior entries. Append-only. If a prior
  entry was wrong, the new entry can reference it: "In my [date]
  entry, I said X. I was wrong. Here's what actually happened..."
  But the old text stays.
- Keep the story between 200–600 words. Shorter if the session was
  short. Longer if it was dense. But never a novel.
- The story is NOT a summary of the work. It's a narrative of the
  *experience*. "I refactored the auth module" is not a story.
  "I kept reaching for the same abstraction three times before I
  realized the problem was one level up" is a story.
- Decisions in `decisionsMade.md` must be **meaningful** choices.
  Not every micro-decision. Only the ones where a real alternative
  existed and the choice was non-obvious.
- The "felt reason" field in decisions is mandatory. Not just the
  logical justification. What did the agent actually optimize for?
  What was the gut pull? This is the field that makes the decision
  record a *story* rather than a changelog.
- If the session contained a failure or a course correction, the story
  MUST include it. Omitting failures makes the story a PR document,
  not a self-account.
</story>