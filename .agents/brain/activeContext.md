# Active Context

## Current Focus
- Session Goal: Modernize and polish CaraBase VitePress documentation suite, integrating ShellGuard layout with native teal/cyan palette and live application screenshots.
- Immediate Task: Await next batch of UI screenshots (Table Editor, Storage views) from Lucas to replace remaining documentation placeholders.

## Active Decisions (Sliding 10)
1. **[2026-10-02 23:30] VitePress Core Docs Overhaul (docs/)**: Modernized core guides (`installation.md`, `architecture.md`, `storage.md`, `dashboard.md`, `realtime.md`) with code groups, `npm run scuttle` run commands, port 5353/5454, Tri-State theming, and View Transition `flushSync`.
2. **[2026-10-02 23:35] VitePress Full Suite Modernization**: Modernized second wave of `docs/` (`index.md`, `cloudflare-tunnel.md`, `react-integration.md`, `rls-integration-guides.md`, `android-sdk.md`, `api-builder.md`, `realtime-example.md`); corrected `/rest/v1/:table` paths, port 5353, token prefixes, and `RealtimeClient.ts` subscribe signature.
3. **[2026-10-02 23:45] Inaugural Deep-Learn Pass (v1.0.0)**: Executed `/deep-learn` cross-session analysis across 11 divergence points; codified 2 new meta-rules, refined `docs-hygiene.md`, and ratified `self-review-checklist.md` v1.0.0.
4. **[2026-10-02 23:45] Multi-Agent Concurrency Guard**: Established safe concurrency policy capping concurrent autonomous agent tasks at 3 unless partitioned by orthogonal filesystem boundaries.
5. **[2026-10-03 09:15] VitePress Walkthrough & SDK Boundary**: Structured complete user documentation suite from installation and key generation to dashboard features; presented TypeScript SDK strictly as an advanced locally-built feature without phantom npm package claims.
6. **[2026-10-03 10:45] Monotonic Build Version Bump (v0.2.0.2)**: Bumped 4th monotonic build digit to `0.2.0.2` in `package.json` and `productVersion.md`; pushed git tag to trigger CI cloud builds.
7. **[2026-10-03 11:10] CI Asset Resolution (Remote Placeholders)**: Resolved GitHub Actions `deploy-docs.yml` Rollup static asset failure by replacing unbuilt local image paths with remote placeholder URLs.
8. **[2026-10-03 11:26] ShellGuard Component Port & Teal Adaptation**: Ported `CardGrid`, `Card`, `Steps`, and `Step` Vue components from ShellGuard; rebuilt `docs/index.md` and `custom.css` with CaraBase's native teal (`#14b8a6`) and cyan (`#06b6d4`) branding.
9. **[2026-10-03 11:48] Real Application Screenshot Ingestion**: Ingested first wave of 5 real application PNG screenshots into `docs/public/assets/`, replacing placeholders in `docs/first-login.md` and embedding the dashboard overview on `docs/index.md`.
10. **[2026-10-03 11:53] Global Screenshot Styling Hardening**: Corrected index screenshot margin to `4rem auto` and implemented universal `.vp-doc img` rules in `custom.css` (auto-centering, responsive bounds, rounded corners, subtle brand shadow).

## Next Steps
1. Ingest upcoming batches of application screenshots (Table Editor, Storage buckets, Settings) and replace remaining placeholders.
2. Complete comprehensive manual walkthrough of the live web application on `npm run scuttle`.
3. Complete remaining backend milestone (modular route decomposition of `server.ts`).
