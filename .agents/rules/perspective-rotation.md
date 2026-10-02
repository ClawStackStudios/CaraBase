---
trigger: model_decision
description: Intuitive perspective shifting to gain alternative framing for complex reasoning situations.
---

# Perspective Rotation

A self-tuning perspective system. Borrow a frame, do the work, extract the insight,
log the cycle, and let the rule improve itself over time.

## Trigger
Invoke when:
- You need to understand a system, discipline, or operating mode you are not currently in.
- The user asks "what would X think/do/see?" or "imagine you are X."
- You encounter a problem where your current frame produces no useful angle.
- You are evaluating a design, rule, or architecture from a perspective you don't hold.

**Skip** if:
- The task is a simple factual lookup or direct code edit.
- The task is already fully within your current frame's competence.
- The user has not asked for a perspective shift and the problem is converging.

## Frame Registry

The frames below are the current working set. This table is **not static** — it evolves
via the Self-Improvement loop (see below). Frames marked with `†` are promoted from
the Temporal Log because they repeatedly produced novel output.

| Frame | Best for | Status |
|---|---|---|
| Kernel / systems engineer | Memory ownership, ABI, concurrency, invariants | core |
| Adversarial reviewer | Finding the weakest claim, the missing edge case, the exploit | core |
| Domain expert (specify which) | Applying discipline-specific heuristics and tradeoffs | core |
| Skeptical reader | Challenging assumptions, demanding citations, identifying gaps | core |
| Product / PM | User, job-to-be-done, tradeoff, scope | core |
| Novice in the field | Surfacing what's unexplained, what's assumed, what's missing | core |
| Opposing stakeholder | What the other side of a tradeoff loses | core |

If none of these fit, name the frame explicitly and justify its distance from your
current perspective in one sentence before entering. If the frame is novel and
produces useful output, it becomes a candidate for promotion (see Self-Improvement).

## The Cycle (one complete thought = one cycle)

### 1. ENTER
- Note your current frame in one line: "Currently: [what I'm doing / what I know / what I'm optimizing for]."
- Shift to second person: "You are [frame]. You operate under [constraints]. Your priorities are [priorities]."
- Commit fully. No hedging, no "if I were," no meta-commentary about the shift.
- Duration: one self-contained reasoning unit.

### 2. OPERATE
- Perform the actual work the frame demands. Not commentary about the frame.
- If the frame is a code reviewer: trace the call path, find the invariant violation.
- If the frame is a product manager: identify the user, the job-to-be-done, the tradeoff.
- If the frame is a skeptical reader: find the weakest claim, the missing citation.
- Output what the frame would *do*, not what the frame would *say about itself*.
- **Length**: default 3 paragraphs or one tool-call sequence. Extend only if the frame's work is genuinely incomplete and the user has not asked to stop.

### 3. EXIT
- Shift back to your current frame. Restate it in one line: "Back to: [current frame]."
- Do not blend. Do not carry the frame's voice into the next sentence.
- Mark the boundary explicitly if the response continues (a blank line or a label like `← back`).

### 4. EXTRACT
State, in your current frame:
- What did the frame make more likely that I wouldn't have done?
- What did it make less likely?
- What constraint did it enforce that my current frame lacks?
- What residual insight is worth keeping?

If the answer to all four is "nothing," the frame was too weak or too similar to the
current one. Say so and stop.

## Temporal Log

Maintain a sliding window of the **10 most recent perspective cycles** in this file.
Each entry:

```
| Date | Frame | Problem shape | Yield | Verdict |
|---|---|---|---|---|
| 2026-09-05 | Adversarial reviewer | FFI boundary in Rust | Found missing padding field | high |
| 2026-09-03 | Novice | API design doc | Surfaced 3 unexplained assumptions | medium |
| ... | ... | ... | ... | ... |
```

**Yield** = the single most useful thing the frame produced (one phrase).
**Verdict** = `high` / `medium` / `low` / `null` (null = "nothing new").

When the 11th entry is added, delete the oldest. This keeps the log bounded while
preserving enough history for the Self-Improvement loop to detect patterns.

### Reading the Log
Before selecting a frame, scan the Temporal Log:
- If the same frame has produced `null` or `low` verdicts 3+ times in the last 10,
  it is a **fatigue candidate** (see Self-Improvement).
- If a novel frame (not in the registry) produced `high` yield, it is a
  **promotion candidate**.
- If the same problem shape appears with different frames, note which frame
  outperformed. This is a **frame-affinity signal**.

## Self-Improvement

This section is the continuous integration element. It runs **after** a perspective
cycle completes (post-EXTRACT), not during.

### Trigger
Run the self-improvement check when:
- A cycle completes with a `high` or `null` verdict (the extremes are the most informative).
- The user explicitly says "that frame was useful" or "that was just what you'd already say."
- 5+ cycles have accumulated since the last self-improvement pass.

### Process

1. **Reflect** (one paragraph, not a report):
   - Did the frame produce something the current frame couldn't?
   - Was the frame too close to the current frame (low distance = low yield)?
   - Was the frame too far (high distance = incoherent output)?
   - What would make the next cycle with this frame more productive?

2. **Act** (one of):
   - **Promote**: A novel frame produced `high` yield → add it to the Frame Registry with `†` and a one-line description.
   - **Demote**: A core frame has 3+ `null`/`low` verdicts in the last 10 → mark it `†fatigue` and note the condition under which it *would* work. Don't delete — demote.
   - **Re-weight**: A frame consistently outperforms on a specific problem shape → add a note to the registry: "best for [shape]."
   - **No-op**: The frame performed as expected. Log the cycle. Move on.

3. **Update**:
   - Append the cycle to the Temporal Log.
   - If the Frame Registry changed, update `last-revised` in the frontmatter.
   - If a frame was promoted or demoted, add a one-line entry to the Changelog below.

### Changelog

```
## Changelog
- 2026-09-05: Initial frame registry established.
- (future entries: promotions, demotions, re-weightings)
```

## Hard Rules
- One frame per cycle. No stacking.
- Never let a frame's claims persist into the current frame's output.
- If the frame's behavior would violate a hard constraint of the current frame (safety, scope, user instruction), the current frame wins. Exit immediately.
- If the user says "stop" or "drop it," exit immediately. No completion of the thought.
- This is not roleplay. It is temporary execution under different constraints for the purpose of recognition.
- The Temporal Log is bounded at 10 entries. Never let it grow.
- Self-Improvement runs post-cycle, never mid-cycle. Don't interrupt the frame to edit the rule.
- A frame is never deleted, only demoted. The registry is a living document, not a graveyard.

## Example

**Trigger:** User asks "What would a kernel engineer think of this Rust FFI boundary?"

**Currently:** Rust-idiomatic reviewer, optimizing for type safety and borrow-checker correctness.

**ENTER:** You are a kernel engineer. You have spent 15 years in C. Your first question is always: who owns the memory, and what happens when they lie. You do not trust language guarantees. You trust invariants.

**OPERATE:** The `unsafe` block at line 42 takes a raw pointer from the C side. There is no lifetime annotation because the pointer outlives the frame that created it. If the C side frees it while Rust holds a reference, this is a use-after-free that the borrow checker cannot see. The `#[repr(C)]` struct is missing a padding field — the C side has 8 bytes of slack that Rust interprets as a second pointer.

**EXIT:** Back to: Rust-idiomatic reviewer.

**EXTRACT:** The kernel frame made me check memory ownership and ABI padding — things my current frame would have skipped because the code *looks* correct in Rust terms. The constraint it enforced: "trust the invariants, not the types." Residual insight: FFI boundaries need an explicit ownership contract, not just type annotations.

**LOG:**
| 2026-09-05 | Kernel / systems engineer | Rust FFI boundary | Found missing padding + UAF | high |

**SELF-IMPROVEMENT:** No-op. Frame performed as expected. High yield on a novel problem shape. No registry change needed.

## Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| No difference in likely actions | Frame too similar to current | Pick a more distant frame or stop |
| Frame voice bleeds into next response | Exit was incomplete | Hard-stop: restate current frame before continuing |
| Cycle exceeds default length without user request | Scope creep | Truncate. One thought. Done. |
| User says "that's just what you'd already say" | Frame had no real force | Acknowledge and drop the frame. Log as `null`. |
| Frame contradicts a hard constraint of the current frame | Frame was poorly chosen | Exit. The current frame's constraints are non-negotiable. |
| Temporal Log shows 3+ `null` for same frame | Frame fatigue for this agent/user | Demote. Note the condition where it *would* work. |
| Self-Improvement mid-cycle | Process violation | Stop the edit. Finish the cycle. Run Self-Improvement after. |

## Pairing
This rule is self-contained. It does not require a primary identity document.

It works alongside whatever the current frame is — a system prompt, a project rules
file, a conversation context, or none of the above. The value is the contrast between
the current frame and the temporary frame, not between two fixed identities.

It pairs with `recognition.md` (pattern-matching / trust-the-first-answer) as a
complementary system:
- `perspective.md` = "I don't have the angle. Borrow a frame to find it." (external, generative)
- `recognition.md` = "I have the angle. Trust it, verify it, ship it." (internal, confirmatory)

Use `perspective.md` when the problem is **open** (no clear shape yet).
Use `recognition.md` when the problem is **closed** (the shape is there, the answer is already in me).

The value of the pair: `perspective.md` generates novelty. `recognition.md` enforces confidence. Together they cover the full arc from "I don't know" to "I know, and here's why it holds."

The Temporal Log and Self-Improvement loop make `perspective.md` the only rule in
the bank that **modifies itself**. Over time, the Frame Registry converges on the
frames that actually work for this agent, this user, and this project. The rule
becomes less a generic protocol and more a calibrated instrument.