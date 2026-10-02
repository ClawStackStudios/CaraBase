# Long-Term Constraints

## Component Granularity Ceiling
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-10-01

Files must not exceed 500 lines of code; target is ~250 lines per file with separation-by-feature.

**History:**
- 2026-10-01: Documented as hard architectural constraint in `USER.md` by Lucas.

**Shaped perspective:** When files exceed 500 lines, agent context windows become noisy, refactoring edits become risky and non-local, and cognitive load escalates. Decomposing components early keeps each unit self-contained and auditable.

---

## Supply Chain Freshness & Version Pinning
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-07-12

Never install packages younger than 7 days (`min-release-age=7`). Always pin explicit versions of known clean packages with lockfile enforcement.

**Shaped perspective:** Supply chain injection attacks exploit rapid zero-day releases. Enforcing a 7-day cooldown isolates the project from malicious upstream registry tampering.

---

## Ambiguity Precludes Code Generation
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-07-12

Ambiguity is never output as code. It is surfaced in prose.

**Shaped perspective:** Code reflects the thinking that wrote it. If the blast radius or state ownership is not fully mapped on both sides of a bridge, write prose to clarify rather than committing guessed implementations.

---

## Explicit User Shipping Consent
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-07-12

Never ship or publish code without explicit user consent. Always verify with the user before merging or releasing.
