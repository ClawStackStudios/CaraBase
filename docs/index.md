---
layout: home

hero:
  name: "CaraBase"
  text: "The Core You Actually Use"
  tagline: "LAN-First, Self-Hosted SQLite DBaaS. Supabase experience, single-file simplicity, zero-config."
  image:
    src: /logo.png
    alt: CaraBase Logo
  actions:
    - theme: brand
      text: Quickstart Guide
      link: /quickstart
    - theme: alt
      text: Architecture Blueprint
      link: /architecture
    - theme: alt
      text: React SDK Integration
      link: /react-integration

features:
  - icon: 🗄️
    title: SQLite Bedrock
    details: Robust SQLite running in WAL mode with SQLCipher encryption at rest. No sprawling multi-node PostgreSQL cluster needed.
  - icon: 🔒
    title: Row-Level Security (RLS)
    details: Fine-grained SQLite WHERE clause logic injected directly into your API reads/writes to isolate user data securely.
  - icon: ⚡
    title: Realtime SSE
    details: Application-level event bus that broadcasts table mutations instantly to connected clients via Server-Sent Events.
  - icon: 🦞
    title: SuperLobster Dashboard
    details: Token-gated administrative plane to manage table schemas, audit logs, automated backups, and storage buckets.
---

<div class="vp-doc">

<div style="margin: 4rem auto; max-width: 1000px; padding: 0 20px;">
  <img src="/assets/dashboard.png" alt="CaraBase Dashboard" style="border-radius: 12px; border: 1px solid var(--vp-c-border); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); width: 100%;" />
</div>

## Explore the Documentation

<CardGrid cols="3">
  <Card title="Getting Started" href="/quickstart" icon="🚀" tag="Guide">
    Generate your secrets, launch the Docker container, and complete the 5-minute setup wizard.
  </Card>
  <Card title="Database & Tables" href="/tables" icon="🗃️" tag="Database">
    Visual Table Editor, SQL Editor, Views, Indexes, and Triggers.
  </Card>
  <Card title="Row-Level Security" href="/rls" icon="🛡️" tag="Security">
    Protect your REST API with policy expressions evaluated statically at the connection layer.
  </Card>
  <Card title="Storage Engine" href="/storage" icon="📦" tag="Storage">
    Secure file uploads with Magic Bytes inspection, dangerous MIME guards, and cryptographic share links.
  </Card>
  <Card title="Custom API Builder" href="/api-builder" icon="⚙️" tag="API">
    Map dynamic SQLite queries to standard REST GET endpoints directly from the dashboard.
  </Card>
  <Card title="Client Libraries" href="/react-integration" icon="💻" tag="SDK">
    Integrate the fully-typed JS/TS SDK into React or hook up a custom Android Kotlin client.
  </Card>
</CardGrid>

---

## The Three Doors of Access

```mermaid
flowchart TD
  subgraph Data ["Data Plane (Your App)"]
    A["Human User (hu-)"] -->|Governed by RLS| C["REST API (/rest/v1)"]
    B["Agent Token (lb-)"] -->|Full / Scoped Access| C
  end

  subgraph System ["System Plane (Control Plane)"]
    D["Developer (ADMIN_TOKEN)"] -->|Volatile Memory Session| E["SuperAdmin Dashboard"]
    E -->|Bypasses RLS| C
  end
```

---

## 3-Step Rapid Onboarding

<Steps>
  <Step title="1. Generate Your Secrets" number="1">

Generate your master database encryption key and SuperAdmin token:

```bash
# Generate 256-bit DB Encryption Key (SQLCipher)
openssl rand -hex 32

# Generate secure SuperAdmin Token
openssl rand -hex 24
```
  </Step>

  <Step title="2. Launch the Container" number="2">

Create a `docker-compose.yml` file:

```yaml
services:
  carabase:
    image: ghcr.io/clawstackstudios/carabase:latest
    ports:
      - "5353:5353"
    environment:
      - DB_ENCRYPTION_KEY=YOUR_GENERATED_KEY
      - ADMIN_TOKEN=YOUR_GENERATED_ADMIN_TOKEN
    volumes:
      - ./data:/app/data
```

Launch the stack:

```bash
docker compose up -d
```
  </Step>

  <Step title="3. Complete the Setup Wizard" number="3">

Open http://localhost:5353 in your web browser. 

You'll be redirected to the Setup Wizard. Enter your `ADMIN_TOKEN` to provision the foundational `superlobster` account, and you'll immediately land in the CaraBase SuperAdmin dashboard where you can start creating tables.
  </Step>
</Steps>

</div>
