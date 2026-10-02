# Reference: Pre-loading Jules Persistent Memory & Knowledge Integration

This reference document explains how to synthesize and transfer project knowledge directly into **Google Jules's persistent memory system** using short, atomic declarative "unit" statements.

---

## 1. Jules's Persistent Memory Architecture

In the Jules Web UI, Jules maintains an active repository memory store (represented by purple octopus cards 🐙). These memories persist across sessions for a given repository.

Memories are formatted as **concise, atomic declarative units** (typically 1–2 sentences):

Examples from live Jules memory:
- *"Never force-reset, rebase root, or force-push the main branch."*
- *"E2E tests (npm test) require the development server to be actively running on port 5353 first (e.g., by running npm run scuttle:dev-start & beforehand)."*
- *"The project is a Node.js (TypeScript) web server using Express and better-sqlite3-multiple-ciphers for its database."*

---

## 2. Why Pre-load Knowledge via Files?

While Jules can learn empirically through trial and error (e.g. hitting a build failure, reading error logs, and storing a lesson), this exploratory learning costs significant VM compute time and can lead to merge churn.

By providing a structured knowledge transfer document:
1. **Zero-Day Grounding**: Jules boots into a task with established architectural rules, avoiding rookie mistakes (like force-resetting `main` or omitting PUID permissions).
2. **Deterministic Invariants**: Non-negotiable security redlines (like `safeIdent()` on column types, volatile admin sessions, loopback rate-limiting bypass) are respected from the first commit.
3. **Dual Ingestion**: Jules can read the file directly during planning or synthesize individual bullet points into its permanent memory bank.

---

## 3. The Declarative "Unit" Style Format

When authoring `.jules/jules-knowledge-memory-integration.md`, format each memory unit to adhere to these rules:

1. **Self-Contained**: Each bullet point must be completely understandable in isolation without referencing neighboring bullets.
2. **Factual & Imperative**: Use direct, unambiguous statements (*"To run tests, use npm test...", "System tables use the _carabase_ prefix..."*).
3. **Executable Commands**: Include the exact terminal commands, port numbers, flags, and file paths when describing operational tasks.
4. **Negative Guardrails**: Explicitly state what NOT to do (*"Never force-reset...", "Agent keys (lb-) are completely barred from accessing system tables..."*).

---

## 4. How to Prompt Jules to Absorb Knowledge

When launching a session with `jules new` or posting in the Web UI:

```
Please read .jules/jules-knowledge-memory-integration.md.
Ingest these architectural invariants, command primitives, and security guidelines into your working context and memory.
```
