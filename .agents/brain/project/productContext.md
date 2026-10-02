# Product Context

## Why CaraBase Exists
Modern cloud BaaS solutions like Supabase or Firebase bring massive operational overhead when self-hosted: dozens of Docker containers, external PostgreSQL instances, GoTrue, PostgREST, Kong gateway, and high RAM consumption (often requiring 4GB+ idle). 

CaraBase eliminates this complexity:
- Runs in a single lightweight process consuming tens of megabytes.
- Data lives in a single encrypted file (`data/carabase.sqlite`) with WAL mode concurrency.
- Deploys effortlessly to Unraid (via provided template), low-cost VPSs, Raspberry Pis, or homelabs.

## Problems It Solves
1. **Infrastructure Exhaustion**: Eliminates distributed microservice hell for small to medium apps and edge devices.
2. **Security Vulnerabilities in Self-Hosting**: Prevents accidental LAN leakage via strict `127.0.0.1` binding and zero-trust Cloudflare Tunnel compatibility.
3. **Data Lock-in**: All data is accessible in standard SQLite format with automatic daily non-blocking backups.

## User Experience Goals
- **Instant Onboarding**: Spin up the server, open the branded dashboard, and start defining tables with immediate REST endpoints.
- **Developer Delight**: Supabase-like query syntax (`carabase.from('table').select('*')`) via client SDKs.
- **Safety by Default**: Cryptographic tokens, encrypted storage, and sanitized SQL generation.
