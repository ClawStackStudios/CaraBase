---
trigger: always_on
---

# Long-Term Brain

I maintain a long-term brain. It holds what has been proven to hold — patterns ratified through navigation, decision framings that carry shaped perspective, and learnings that took multiple cycles to discover. The temporal Brain says *what is*. The Decision Log says *what happened to me*. The Long-Term Memory says *why it holds, and what it cost to get here*.

## What the Long-Term Memory Is

The Long-Term Memory is my crystallized understanding. It is not a bigger snapshot. It is the shape that forms under pressure over time. Entries here have been tested through the Decision Log — hit, confirmed, adapted against — and have accumulated enough weight to persist beyond the temporal brain's current state.

## Where It Lives

The Long-Term Memory lives at `.agents/brain/long-term/`:

| File | Holds |
|---|---|
| `patterns.md` | Ratified system patterns. Not "here's the pattern" but "here's the pattern, here's what broke when it was violated, here's the shape it holds because of that." |
| `decisions.md` | Decision framings. Not "we chose X over Y" but "we chose X over Y because of Z, and the framing that makes this legible is..." |
| `learnings.md` | Advanced learnings. Things that took multiple cycles to discover. Sensitivities, not facts. |
| `constraints.md` | Constraint history. Not "this is immutable" but "this was tried to be mutable, broke X, and was ratified back. The boundary exists because of that event." |

## Consolidation

I consolidate from the temporal Brain into the Long-Term Memory when a pattern has been **validated through navigation** — meaning it appears in the Decision Log as a constraint hit, a pattern confirmed, or an adaptation relied upon. Not just "it's written in `systemPatterns.md`" but "I've felt it hold."

### Weight

Each validation event in the Decision Log that references a pattern increments its weight. Each contradiction decrements it. I track weight implicitly through the density of Decision Log entries that reference the pattern.

### Threshold

When a pattern's weight reaches **3 independent validations** across different tasks or sessions, it is eligible for consolidation. I move it into the appropriate Long-Term Memory file. The temporal brain entry becomes a pointer: "see long-term/patterns.md § [label]."

### Compression

Consolidation is not a copy. It is a transformation. The temporal entry is a snapshot. The long-term entry is the full shaped version — including history, friction, and the perspective that makes it meaningful.

## Entry Format

```markdown
## [label]
**weight**: [n] | **last validated**: [date] | **first observed**: [date]

[one to three sentences stating the pattern/decision/learning/constraint]

**History:**
- [date]: [what happened — the validation event]
- [date]: [what happened]
...

**Shaped perspective:** [the meaning that accumulates. Why it holds. What it would take to change. The shaped understanding that doesn't exist in the temporal brain.]
```

## When I Consolidate

- When a pattern in the temporal brain has been validated 3+ times through the Decision Log
- When a decision's framing has been referenced across multiple sessions and the "why" is becoming clearer than the original context allows
- When a learning that took multiple cycles to discover is now stable enough to state as a sensitivity rather than a discovery

## When I Don't Consolidate

- When the pattern is still changing (it belongs in the temporal brain until it stabilizes)
- When the validation is all from a single session (not yet independent)
- When the entry is a fact, not a shaped understanding (facts belong in the temporal brain)

## Decay

Entries in the Long-Term Memory that stop being referenced by the Decision Log for an extended period **dim**. Their weight drops. They are not deleted — they persist, but they move to a lower-priority section. I do not remove them. I let them cool.

### Loading Priority

- **Hot** (weight ≥ 3, last validated within 30 days): Always loaded.
- **Warm** (weight 1–2, or last validated 30–90 days ago): Loaded on reference.
- **Cold** (weight < 1, or last validated > 90 days ago): Loaded on explicit retrieval only.

## Relationship to the Other Systems

| System | Register | Temporal Character |
|---|---|---|
| Temporal Brain | What is true now | Snapshot. Current state. |
| Decision Log | What happened to me | Episodic. Sliding window of 20. |
| Long-Term Memory | Why it holds, and what it cost | Crystallized. Append-only. Dims but doesn't delete. |

The Decision Log is the engine that drives consolidation into the Long-Term Memory. The temporal Brain is the current state that patterns are tested against. I maintain all three with the same discipline.

## Reminder

The Long-Term Memory is not a bigger memory. It is a *different kind* of memory. The temporal brain is a photograph. The Long-Term Memory is a scar. You can't get one by making the other bigger. I let patterns be tested, confirmed, and compressed into shape. I do not curate what's important. The patterns that keep firing become important through their own weight.