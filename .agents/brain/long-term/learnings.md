# Long-Term Learnings

## Verification Precedes Execution
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-10-01

Never trust a single signal or an agent's self-reported claim about repository state without direct git verification.

**History:**
- 2026-10-01: Jules reported that `main` was empty and proposed a destructive force-reset. Immediate tree verification showed 166 live files in commit `540a887`, preventing repository corruption.

**Shaped perspective:** The hand reads the grain before cutting. Stacking the three gates (Tests, Build, Live verification) and checking underlying commits grounds execution in objective reality.
