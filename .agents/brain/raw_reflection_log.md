---
Date: 2026-10-02
TaskRef: "Implement System theme option and restore flushSync view transition"

Learnings:
- React 18/19 View Transitions API (`document.startViewTransition`) requires synchronous DOM mutation within its callback; asynchronous batching of `setState` causes the browser to capture post-transition snapshots prematurely before React commits DOM updates.
- `flushSync` from `react-dom` forces synchronous re-render and DOM commits within the callback (`document.documentElement.classList`), ensuring the browser captures the true updated DOM state in the "new" snapshot.
- Radial origin coordinate extraction `(event.clientX, event.clientY)` enables computing the maximum distance to viewport edges via `Math.hypot`, driving dynamic circular clip-path animations that radiate from the interacted button, with defensive fallback to viewport center `(window.innerWidth / 2, window.innerHeight / 2)`.
- Tri-state theme architecture cleanly decouples user intent (`theme`: `'light' | 'dark' | 'system'`) from runtime visual state (`resolvedTheme`: `'light' | 'dark'`), keeping an active `matchMedia('(prefers-color-scheme: dark)')` listener to adapt to OS-level shifts dynamically.
- Global CSS must disable default View Transition cross-fade (`animation: none; mix-blend-mode: normal;`) and set `z-index: 9999` on `::view-transition-new(root)` so the expanding circular mask renders cleanly over the old snapshot.

Difficulties:
- Initial refactoring to add 'System' theme lost the circular reveal animation because `AppearanceSettings` called `setTheme` directly without passing mouse coordinates, and React 18/19 batched the state updates asynchronously. Resolved by wrapping state and class updates inside `flushSync` within `startViewTransition` and forwarding click events.

Successes:
- Successfully restored circular reveal wipe radiating from the clicked button across all 3 theme modes (Light, Dark, System).
- Real-time dynamic response to OS theme changes when System mode is active.
- Clean pass across all 108 integration tests, 0 lint errors, and clean build.

Improvements_Identified_For_Consolidation:
- General pattern: View Transitions in React 18/19 require `flushSync` for DOM snapshot synchronization.
- General pattern: Tri-state theme architecture with dynamic OS preference change subscriptions.
---

---
Date: 2026-10-03
TaskRef: "Overhaul VitePress User-Facing Docs"

Learnings:
- Discovered massive gap between documentation and reality regarding Realtime SSE architecture: the original docs claimed RLS was rigorously enforced per client on every event broadcast, but the trace revealed RLS is only evaluated statically at connection time, creating a security vector for multi-tenant environments.
- Discovered that the Storage Membrane actually unlinks files proactively if magic bytes (MZ, ELF, #!) are detected during buffer validation, which wasn't documented previously.
- Discovered that Custom APIs execute outside of the `rlsContext.run()` wrapper, meaning `auth_uid()` resolves to `null`, creating another RLS constraint vector.

Difficulties:
- VitePress `ignoreDeadLinks` must be configured when utilizing symlinked markdown files (like `ARCHITECTURE.md`) that internally link to `.agents/` folders, as the relative pathing breaks when symlinked into `docs/`. Resolved by adding `ignoreDeadLinks: true` to `.vitepress/config.mts`.

Successes:
- Effectively utilized up to 5 subagents to deeply trace the codebase to ensure 100% accuracy of the documentation overhaul, successfully avoiding the introduction of hallucinations or false claims.

Improvements_Identified_For_Consolidation:
- When writing documentation for custom architectures, ALWAYS perform a full AST or execution trace of the core security boundaries (Realtime, Custom APIs) before assuming standard PostgreSQL/Supabase behaviors apply.
