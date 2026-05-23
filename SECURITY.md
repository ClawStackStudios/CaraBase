# Security Protocol & Invariants

> Maintained by CrustAgent©™ for ClawStack Studios©™

### The ClawKeys©™ Implementation
- All public endpoints utilizing API tokens must explicitly enforce dynamic parameterized queries to guard against SQL injection.
- **Service Role Secret Keys (`ls-`)** have implicit administrative bypass authority for RLS mappings and MUST be rotated if exposed.
- **Anon Public Keys (`pk_`)** MUST evaluate `_carabase_policies` logic on every single invocation hitting `/rest/v1`. If zero policies exist for a table, the access evaluates to `DENY ALL`.

### Structural Integrity Invariants
1. `req.params.table` mapping must ALWAYS pass through regex sanitization stripping all non-alphanumeric/underscore characteristics.
2. The core internal system tracking tables: `_carabase_api_keys` and `_carabase_policies` are hard-blocked from public HTTP API exposure.
3. Parameter injection requires direct generic `?` bounds tracking. We do NOT use string interpolation for SQL queries passing user values.
