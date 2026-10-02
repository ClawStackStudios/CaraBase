# Long-Term Decisions

## Self vs Environment Cognitive Architecture
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-10-01

Isolating the internal episodic self (`brain/`) from the external project specification (`brain/project/`) prevents cognitive drift across agent sessions and keeps context window consumption disciplined.

**History:**
- 2026-10-01: Migrated CaraBase from flat memory-bank to modern Antigravity Brain architecture via `/migrate-to-brain`.

**Shaped perspective:** When working with multiple autonomous agents (Antigravity coordinator + Jules executor), clear separation between world state and agent reflection ensures neither agent overwrites the ground truth of the system.
