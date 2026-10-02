# Long-Term Ratified Patterns

## safeIdent-everywhere
**weight**: 3 | **last validated**: 2026-10-01 | **first observed**: 2026-08-23

Dynamic SQL generation in schema-building or query endpoints must sanitize every interpolated element (table names, column names, AND column types) via `safeIdent`.

**History:**
- 2026-08-23: Sentinel detected SQL injection via unescaped `c.type` in `server.ts` endpoint `/tables`. Created PR #13.
- 2026-10-01: Ratified as non-negotiable security invariant in test oracle and system patterns.

**Shaped perspective:** Developers remember to sanitize table names and column names but frequently overlook type metadata as an injection vector. Sanitizing types or using a strict type enum prevents structural SQL breakout.

---

## The Schema For Metaphorical Wisdom Seeds
Every compressed pattern seed must satisfy four invariants:
1. **Compression**: Under 12 words. No qualifiers. Maximum density.
2. **Generative**: Unfolds differently across domains without modification.
3. **Falsifiable**: Ignoring it produces a specific, visible, nameable failure.
4. **Decompressible**: Can be expanded into a full reasoning chain unprompted.

---

## Ratified Metaphorical Wisdom Seeds
- **Incomplete reflections crack the state.**  
  Missing API response fragments corrupt UI invariants.
- **The proxy panics when the ground shifts.**  
  Hot-reloads sever active topology bridges.
- **Twins share the same door.**  
  Architectural alignment removes the need for duplicate keys.
- **Bridges are blind to the payload.**  
  Middleware only validates credentials/tokens, not caller intent.
- **Keys that touch the water cannot touch the engine.**  
  LobsterKey agent tokens (`lb-`) are strictly sandboxed from internal system and admin routes.
- **The master key never leaves the pocket.**  
  Human credentials exchange for ephemeral session tokens, never traveling in HTTP headers.
- **The highest tower keeps no permanent records.**  
  SuperAdmin sessions are volatile in-memory Maps with 20-min TTL, destroyed on server restart.
- **A lock turned twice resists the ghost.**  
  Row-Level Security evaluates both during static query construction and within isolated runtime context.
