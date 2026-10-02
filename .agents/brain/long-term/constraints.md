# Long-Term Constraints

## Component Granularity Ceiling
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-10-01

Files must not exceed 500 lines of code; target is ~250 lines per file with separation-by-feature.

**History:**
- 2026-10-01: Documented as hard architectural constraint in `USER.md` by Lucas.

**Shaped perspective:** When files exceed 500 lines, agent context windows become noisy, refactoring edits become risky and non-local, and cognitive load escalates. Decomposing components early keeps each unit self-contained and auditable.
