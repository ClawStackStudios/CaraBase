# Technical Context

## Tech Stack
- **Runtime**: Node.js >= 22 (dev and production containers).
- **Backend**: Express 4.x, TypeScript 5.8, tsx (dev runner), esbuild (production bundler to CommonJS).
- **Database**: `better-sqlite3-multiple-ciphers` (SQLite with SQLCipher extension).
- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Motion (Framer Motion), Lucide React.
- **Client SDKs**: TypeScript SDK (`sdk/`), Android Kotlin SDK (`sdk-android/`).
- **Containerization**: Multi-stage `Dockerfile`, `docker-compose.yml`, Unraid template `carabase-unraid-template.xml`.

## Key Commands
- **Dev Frontend**: `npm run dev` (Vite on port 5454, host 127.0.0.1)
- **Dev Backend**: `npm run dev:server` (PORT=5353 tsx watch --exclude data server.ts)
- **Build**: `npm run build` (vite build + esbuild server.ts -> dist/server.cjs)
- **Test**: `npm test` (node tests/suite.cjs)
- **Lint**: `npm run lint` (tsc --noEmit)
- **Full Start**: `npm run start` (node dist/server.cjs)
- **Scuttle Clean**: `npm run scuttle:reset-db` (resets SQLite database)

## Technical Constraints
- SQLite write concurrency handled by single writer queue in WAL mode.
- In-memory database keys must be 64-char hex strings if encryption is enabled (`DB_ENCRYPTION_KEY`).
- Server binds to `127.0.0.1` by default; production uses reverse proxy / Cloudflare Tunnel.
