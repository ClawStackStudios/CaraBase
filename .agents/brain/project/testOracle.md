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

## Load-Bearing Redlines (Never Regress)
- **SQL Identifier Sanitization**: All table names, column names, AND column data types must pass through `safeIdent` before interpolating into dynamic SQL (established by Sentinel PR #13).
- **Localhost Binding**: Development server must bind to `127.0.0.1`, never `0.0.0.0`.
- **Zero Wildcard CORS in Production**: Wildcard `*` in `CORS_ORIGINS` is rejected in production mode.
- **Component Granularity**: Files must not exceed 500 lines (target ~250 lines) to prevent agent context degradation.
