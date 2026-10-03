# Synchronous API Microtask Flushing (flushSync Mandate)

I enforce synchronous DOM reconciliation when invoking browser APIs with synchronous capture lifecycles.

## The Invariant

When invoking browser APIs that capture visual, geometric, or document snapshots synchronously within a single turn of the event loop:
- `document.startViewTransition()`
- `Element.getBoundingClientRect()` immediately following a state mutation
- `window.print()`

**Always wrap framework state updates and root DOM class mutations inside synchronous flush primitives** (e.g. `flushSync` from `react-dom`).

## Why This Holds

Modern UI frameworks (such as React 18/19, Vue, or Solid) implement concurrent rendering and automatic microtask state batching. When a browser API takes an immediate snapshot, deferred framework state updates mean the "new" snapshot captures the exact same un-updated DOM state as the "old" snapshot, resulting in lost animations (e.g., circular wipes failing or snapping instantly) or incorrect layout measurements. Forcing a synchronous flush reconciles the DOM tree before the snapshot is frozen.
