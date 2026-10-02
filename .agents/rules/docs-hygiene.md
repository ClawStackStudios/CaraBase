---
description: Documentation hygiene and anti-rot rule — ensures architectural, state, and API changes are tied to documentation updates in the same branch and commit.
---

**Objective:** Prevent documentation rot by ensuring that architectural, state, and API changes are fundamentally tied to their documentation updates within the *same* branch and commit.

## 1. Zero-Deferred Documentation
- **Never defer documentation updates.** If you change the behavior of a module, component, or state model, the corresponding documentation MUST be updated in the same branch before merging to `main`.
- "I will update the docs later" is treated as an incomplete task.

## 2. Trigger Conditions
You MUST proactively update the corresponding `.agents/memory-bank/` files or `docs/` files when:
- **State Model Changes:** If you alter how data flows, where it is stored, or how contexts (like React Context or Zustand) are structured, you must update `attractorBeacon.md` and/or `systemPatterns.md`.
- **API/Endpoint Changes:** If a server route's payload or response shape changes, update the API documentation or relevant README.
- **Component Refactors:** If a large component is split or renamed, update the overarching UI documentation and `activeContext.md`.
- **Dependency Changes:** If a new core dependency is added (e.g., swapping a crypto library), update `techContext.md`.

## 3. Inline Documentation
- Maintain JSDoc/TSDoc integrity. If you change a function signature, you must update its `@param` and `@returns` docstrings immediately.
- Preserve existing comments that explain *why* code exists, unless the *why* has fundamentally changed.

## 4. The "Same Commit" Mandate
Documentation updates should not be isolated to a separate "chore: update docs" commit if they belong to a feature. They should be bundled into the specific `AI:` layer of the commit that introduced the feature/fix, proving that the code and its explanation evolved together.

## 5. The Direction of Truth (docs bow to code)
- When a document contradicts shipped, verified behavior, **the document is the defect**. Never change working or security-relevant code to match stale prose; correct the corpus. (Governance ruling, 2026-09-16.)
- **Claim battery method**: for every documented invariant, grep the ENFORCING CODE first, then assert the doc matches. When a behavioral claim has no literal code hit, the TEST FIXTURES are the oracle (e.g. custom-field AAD namespaces live in `tests/unit/customFields.test.ts`, not application literals).
- **Enumerate, never recall**: permission models come from the zod schema; limiter numbers from `rateLimiter.ts` cited with their env vars; schema truth from the migrations. Neighbor configs (auth vs admin limiters) drift independently — never document one from the other's numbers.
- A phase's **📚 Documentation Impact** line in ROADMAP.md is part of that phase's definition of done.

## 6. Wire-Exact Contract Alignment
- Document API endpoint request and response payloads with exact TypeScript types matching the runtime controller (e.g. distinguishing an array of IDs `inserted: string[]` from a count `inserted: number`, and exact HTTP status codes `201 Created` vs `207 Multi-Status`).
- Mismatches break automated API consumers, typed SDKs, and collaborating AI agents.

