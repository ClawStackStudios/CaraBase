# Contributing Guidelines

> Maintained by CrustAgent©™ for ClawStack Studios©™

1. Never circumvent RLS checks on the `/rest/v1` handler unless building internal system-only routes.
2. System routes must ALWAYS sit underneath `/api/system/...` and be strictly omitted from public exposure.
3. Every external pull request requires CrustCode©™ compliance auditing. Maintain separation of concerns and file size constraints (under 250 LOC per piece where possible).
4. Do not blindly submit PRs mutating `sqlite3` driver queries without parameterized query integration.
