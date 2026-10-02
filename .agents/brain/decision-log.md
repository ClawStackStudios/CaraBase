# Decision Log

## 2026-10-01 — Jules empty-main hallucination
Jules in session `17983432046683792243` claimed `main` was empty at commit `540a887` and planned a force-reset. Traced `main` tree immediately (`git ls-tree -r HEAD` shows 166 files); intercepted before remote VM could act; armed user with explicit factual prompt.

## 2026-10-01 — Worktree cleanliness before migration
Encountered dirty worktree on `/migrate-to-brain` due to user preferences in `USER.md`. Committed `USER.md` independently to preserve preferences and honor the migration prerequisite of a clean git state.
