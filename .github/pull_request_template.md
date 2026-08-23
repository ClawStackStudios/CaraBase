<!--
  PRs are auto-validated by CI (Lint & Build, E2E Suite, Docker Build).
  All three checks must be green before merge — no exceptions, including agent PRs.
-->

## What changed

<!-- Describe the change. Link any ROADMAP task or issue it closes. -->

## Why

<!-- The problem this solves or the behavior it adds/changes. -->

## How was this tested?

- [ ] `npm run lint` passes locally
- [ ] `npm run build` succeeds locally
- [ ] E2E suite exercised (`npm test` against a running server) — note any new assertions:
      <!-- e.g. "Extended Phase 4 with X" -->
- [ ] Manual verification against a live instance (if UI-facing)

## Security checklist (required for auth/API/DB changes)

- [ ] No new unauthenticated routes
- [ ] Input validated/sanitized at the boundary
- [ ] Audit logging added for security-relevant events
- [ ] RLS implications considered (does this bypass or weaken policies?)

## Agent PRs (Jules / automation)

- [ ] Scope is minimal and matches the assigned task
- [ ] No unrelated files touched
- [ ] No secrets, tokens, or `.env` values committed

---
*Reviewer: verify all three CI checks are green, then squash-merge.*