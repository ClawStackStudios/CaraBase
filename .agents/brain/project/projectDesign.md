# Project Design

## Canonical Reference
This project maintains a detailed design system specification in the repository root:
👉 [DESIGN.md](file:///config/Local-Storage/workspace-lucas/projects/Agents/CaraBase/DESIGN.md)

## Design Vision & Philosophy
CaraBase embodies the spirit of a sovereign developer vault — a secure, high-performance database workspace where developers and autonomous machine agents delegate authority cleanly.

### Core Principles
1. **Sovereign Vault (Carapace Security)**: Armored aesthetic, high-contrast grid frames, semi-transparent overlays (`backdrop-blur-md`), and carbon backgrounds (`bg-[#0f1419]` / `bg-slate-950`).
2. **High-Density Parity**: Optimized for data-dense developer tools. Tiny crisp sticky headers, inline constraint badges (PK, NOT NULL, DEFAULT), and compact table rows.
3. **Cybernetic Micro-Interactions**: Real-time SSE logs, directional sort animations via Motion, and liquid metal theme transitions between light and dark modes.

## Screen Topology
- **SuperAdmin Dashboard**: System health overview, audit logs, active connections, and database metrics.
- **Table Editor & Schema Builder**: Visual grid view of SQLite tables with column type constraints, primary keys, and instant REST endpoint generation.
- **API & Access Tokens**: Multi-tier token manager (`hu-` human, `api-` keys, `lb-` sessions) and role permissions.
- **Storage Browser**: File browser with ShellProxy Membrane links and cryptographic `share_hash` generators.
- **Settings & Backups**: Database encryption key status, WAL checkpoint controls, and backup snapshot retention.
