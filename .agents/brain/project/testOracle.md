# Test Oracle & Verification Gates

## The Three Gates
1. **Gate 1: Lint & Typecheck**
   - Command: `npm run lint` (`tsc --noEmit`)
   - Scope: Root TypeScript types across backend and frontend. Note: SDK has isolated typecheck (`sdk/`).
2. **Gate 2: Production Bundle Build**
   - Command: `npm run build` (`vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`)
   - Invariant: `dist/server.cjs` and `dist/index.html` must generate without warnings or unbundled asset errors.
3. **Gate 3: E2E Integration Suite**
   - Command: `npm test` (`node tests/suite.cjs`)
   - Pre-condition: Build bundled SDK (`cd sdk && npm run build`), boot production server with encrypted DB (`DB_ENCRYPTION_KEY`), verify health check `/api/health`.
   - Standard Suite: 105+ assertions covering Identity, Routing, Concurrency, Transactional RLS, SSE Realtime, Multipart Storage & Membrane Sharing, Agent Keys, Audit Logs, Custom Endpoints, SQL Injection resilience, and System table integrity.

## Supply Chain & Package Freshness Gate
- **7-Day Minimum Age**: Never install a dependency published less than 7 days ago unless explicitly approved by the user (`.npmrc` `min-release-age=7`).
- **Version Pinning**: Always pin explicit versions of known clean packages in `package.json` with strict `package-lock.json` + `npm ci` in CI.
- **Uncertain Date Guard**: If uncertain of the current date/time, surface the tension to the user before adding or upgrading dependencies.

## Load-Bearing Redlines (Never Regress)
- **SQL Identifier Sanitization**: All table names, column names, AND column data types must pass through `safeIdent` before interpolating into dynamic SQL (established by Sentinel PR #13).
- **Localhost Binding**: Development server must bind to `127.0.0.1`, never `0.0.0.0`.
- **Loopback Rate-Limit Bypass**: Loopback IPs (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) are permanently exempted from `authLimiter` to protect test suites and health checks.
- **Zero Wildcard CORS in Production**: Wildcard `*` in `CORS_ORIGINS` is rejected in production mode.
- **Component Granularity**: Files must not exceed 500 lines (target ~250 lines) to prevent agent context degradation.

## Verification Pre-Flight Checklist
Before shipping non-trivial code modifications:
- [ ] State ownership and consistency clear?
- [ ] Feedback / observability in place (audit logs, error responses)?
- [ ] Blast radius understood?
- [ ] Timing & ordering safe (async boundaries, locks, WAL checkpoints)?
- [ ] Follows existing patterns?
- [ ] Security risks and OWASP invariants addressed?
