# Long-Term Ratified Patterns

## safeIdent-everywhere
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-08-23

Dynamic SQL generation in schema-building or query endpoints must sanitize every interpolated element (table names, column names, AND column types) via `safeIdent`.

**History:**
- 2026-08-23: Sentinel detected SQL injection via unescaped `c.type` in `server.ts` endpoint `/tables`. Created PR #13.
- 2026-10-01: Ratified as non-negotiable security invariant in test oracle and system patterns.

**Shaped perspective:** Developers remember to sanitize table names and column names but frequently overlook type metadata as an injection vector. Sanitizing types or using a strict type enum prevents structural SQL breakout.
