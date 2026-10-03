---
layout: home

hero:
  name: "CaraBase"
  text: "The Lobsterized©™ BaaS"
  tagline: "The Core You Actually Use — Your LAN-First, Self-Hosted SQLite DBaaS"
  image:
    src: /logo.png
    alt: CaraBase Lobster Mascot
  actions:
    - theme: brand
      text: Get Started
      link: /installation
    - theme: alt
      text: Architecture & Philosophy
      link: /architecture

features:
  - icon: ⚡
    title: Instant SQLite Backend
    details: Real SQLite tables running in WAL mode with SQLCipher encryption, powered by better-sqlite3.
  - icon: 🛡️
    title: Row-Level Security (RLS)
    details: Fine-grained SQLite WHERE clause logic injected directly into API reads/writes based on calling token scope.
  - icon: 🔌
    title: Dynamic REST & Realtime SSE
    details: Instant REST endpoints (/api/rest/:table) with live SSE event broadcasts deferred to post-commit atomicity.
  - icon: 📦
    title: Secure Physical Storage
    details: File storage engine with magic-bytes inspection, dangerous MIME guards, and expiring cryptographic share links.
  - icon: 🦞
    title: SuperAdmin Portal
    details: Sovereign monitoring dashboard with volatile in-memory sessions, zero-knowledge data auditing, and 1-click backups.
  - icon: 🌐
    title: Multi-Platform SDKs
    details: Official first-party TypeScript/React and Kotlin/Android SDKs with connection resilience and offline reconnect.
---

<div class="home-content vp-doc">

## Why CaraBase?

Many projects don't need a sprawling, multi-node PostgreSQL cluster. For local tooling, internal dashboards, and medium-scale applications, SQLite is often more than enough. CaraBase wraps SQLite in a secure, opaque-token ecosystem.

- **Instant SQLite Backend:** Tables are real SQLite tables. Data persists instantly via `better-sqlite3`.
- **Dynamic Schema Editor:** Create any table shapes, types, and constraints right from the dashboard.
- **REST APIs Built-In:** Your data is accessible immediately over `/api/rest/:table`.
- **Role Level Security (RLS):** Fine-grained SQLite `WHERE` clause logic injected directly into API reads/writes based on the type of API key used to query.
- **Secure File Storage & Membrane Shares:** Upload and manage physical files. Create secure, expiring public links via cryptographic `share_hash`.
- **SuperAdmin Dashboard:** Built-in environment-gated admin portal (`/admin`) for comprehensive system monitoring, uptime tracking, and sovereign metadata auditing.

## The Lobsterized©™ Ethos

This architecture is governed by strict invariants:
1. **Never trust the seams:** Every incoming API request passes through rigorous middleware.
2. **Build the floor before the ceiling:** Ensure the underlying SQLite query binds and permissions check out before rendering the UI.
3. **Data Sovereignty:** The SuperAdmin dashboard tracks system health and access metrics without ever peeking into user data contents.

</div>
