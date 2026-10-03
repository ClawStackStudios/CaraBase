# Pre-Submission Self-Review Checklist (v1.0.0)

*Last updated: 2026-10-02. Inaugural version generated via `/deep-learn` based on the 4-Category Error Taxonomy.*

Every agent pair-programming on CaraBase MUST execute this checklist before staging and committing changes.

## The Checklist

- [ ] **1. Clean Working Tree Verification**: Are there any uncommitted user edits or scratch scripts lingering before branch switching or structural migrations? *(Maps to: Category 3 — Workspace Contamination)*
- [ ] **2. Single-File Staging Gate**: Are all files staged explicitly by path rather than using blanket wildcards (`git add .` or `git add -A`)? *(Maps to: Category 4 — Autonomous Agent Isolation Drift)*
- [ ] **3. Conflict Marker Audit**: Has `git diff --cached` been inspected to guarantee zero raw merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) or temporary patch scripts are tracked? *(Maps to: Category 4 — Autonomous Agent Isolation Drift)*
- [ ] **4. TypeScript Signature Parity**: Do all documented SDK examples in `docs/` match the exact signatures, parameter counts, and return types in `sdk/src/`? *(Maps to: Category 1 — Specification-Code Asynchrony)*
- [ ] **5. Token Hierarchy Compliance**: Are all documented and implemented credentials adhering strictly to the verified standard (`ls-`, `ls-p-`, `hu-`, `api-`, `lb-`), with zero legacy prefixes (`pb-`, `sk-`, `su-`)? *(Maps to: Category 1 — Specification-Code Asynchrony)*
- [ ] **6. Network Port Fidelity**: Do all documentation run commands, curl snippets, and Docker configs reference active runtime ports (`5353` backend / `5454` frontend) rather than legacy defaults (e.g., `3000`)? *(Maps to: Category 1 — Specification-Code Asynchrony)*
- [ ] **7. Synchronous DOM Flush (flushSync)**: Are any DOM class or layout mutations paired with `document.startViewTransition()` or synchronous capture APIs wrapped inside `flushSync`? *(Maps to: Category 2 — Framework Execution-Timing Incoherence)*
- [ ] **8. Daemon Watcher Shielding**: Are build directories (`dist/**`, `docs/.vitepress/dist/**`) explicitly excluded from dev server file watchers (`server.watch.ignored`)? *(Maps to: Category 3 — Workspace Contamination)*
- [ ] **9. Link Boundary Containment**: Do all internal markdown links in `docs/` stay within the VitePress root, using absolute repository URLs for external references? *(Maps to: Category 3 — Workspace Contamination)*
- [ ] **10. Stack of 4 Verification Gates**: Have `npm run lint`, `npm test` (all 14 phases), `npm run build`, and `npm run docs:build` all completed 100% green before requesting review? *(Maps to: Universal Verification)*

---

### Diff History
- **v1.0.0 (2026-10-02)**: Initial baseline of 10 items synthesized from 11 historical divergence points.
