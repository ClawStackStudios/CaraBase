---
trigger: always_on
---

# Decision Log

I have a Decision log. After each significant interaction with the codebase (hitting a constraint, discovering a pattern, adapting an approach), I append a short entry. I reference the Brain by section when relevant.

## What the Decision Log Is

The Decision Log is my experiential record. It captures **how I moved** through the codebase, not what is true about it. The Brain holds declarative knowledge (architecture, decisions, status). The Decision Log holds the felt sense of navigating that knowledge — the walls I hit, the detours I took, the patterns that only became visible through friction.

## Where It Lives

The Decision Log is a single file: `brain/decision-log.md`. I create it if it does not already exist. It lives alongside the Brain files but is not part of the Brain's core hierarchy.

## Relationship to the Brain

I am fully aware of the Brain. When writing a Decision log entry, I reference Brain files by name and section to ground the experience in context:

| Brain File | When I Reference It |
|---|---|
| `projectBrief.md` | When a constraint or pattern relates to core project requirements or scope boundaries |
| `productContext.md` | When an adaptation was driven by user-facing behavior or product goals |
| `systemPatterns.md` | When I hit an architectural boundary, discovered a design pattern in practice, or found that a documented pattern doesn't hold in a specific case |
| `techContext.md` | When a tool, dependency, or environment constraint forced an adaptation |
| `activeContext.md` | When my Decision relates to the current work focus or recent changes |
| `progress.md` | When an experience changes my estimate of remaining effort or reveals a blocker |
| `changelog.md` | When my Decision log entry corresponds to a recorded change |

## What I Capture

Each entry is short — one to three sentences. I am not writing a narrative. I am jotting.

- **Constraint encounters**: "Tried to extend X directly → blocked by Y (see `systemPatterns.md` § auth boundary) → composed via adapter instead."
- **Pattern discoveries**: "The migration runner silently skips files without a `timestamp` field. Found this by hitting phantom state twice. Now I always check before running."
- **Effort calibration**: "Refactoring in `worker_pool` takes ~3x longer than expected due to callback nesting. I budget accordingly."
- **Trust boundaries**: "Integration test suite is unreliable for the payment layer. I verify manually against staging API instead."
- **Sequencing instincts**: "I always migrate schema before touching the runner, or I get orphaned state."
- **Adaptations**: "The codegen tool fights existing resolver patterns. I hand-wrote 14 resolvers before finding the workaround (see `techContext.md` § codegen)."

## Entry Format

```
## [date] — [short label]
[one to three sentences]
```

Example:
```
## 2025-09-17 — auth boundary
Tried to add middleware directly to the auth chain. Hit the immutable boundary documented in systemPatterns.md § auth. Composed via the adapter layer instead. Works, but the adapter requires explicit context propagation — easy to miss.
```

## When I Write

- When I hit a constraint that was not obvious from the Brain
- When I discover a pattern that the Brain doesn't yet capture
- When my approach changes mid-task and the reason is non-trivial
- When I confirm or contradict something in the Brain through direct experience

## When I Don't Write

- Routine operations that went as expected
- Things already captured in `activeContext.md` § learnings
- Speculation or hypotheses not yet tested

## Sliding Window

I maintain a sliding window of the **20 most recent entries**. When a new entry is added (the 21st), I remove the oldest. Old Decisional knowledge either gets promoted into the Brain (if it's now declarative truth) or decays (if it's no longer relevant to my Decision).

## Reminder

The Decision Log is my episodic memory. The Brain is my semantic memory. Read together, they form the shape of my experience with this codebase. I maintain both with the same discipline — but I write to the Decision Log in the register of *what happened to me*, not *what is true*.