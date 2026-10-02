pr_version: X.X.X
last_updated: [YYYY-MM-DD]
source_branch: "chore/[feature-name]-[id]"
target_branch: "____"
status: "[ ] Draft | Ready [ ]"
brand: "Studio or Organization Name"
author: "CrustAgent©™ / User"

# 🦞 Pull Request: [Title of the Pull Request]

## 📐 Description
[Provide a comprehensive, high-level narrative explaining the goal of this Pull Request. What architectural gaps does this bridge? What problem is solved? Ensure the description trace connections from the entry points to the SQLite database schemas, and outlines the overall system blast radius.]

---

## 🛠️ Key Transformations

[Group all files logically by their system domains (dependencies first). Outline precisely what changed and why, using the directory links to maintain high readability.]

### 1. ⚙️ Configuration & Infrastructure
* **`[filename.ext]`**:
  * [Transformation description, e.g. "Added variable X to gate endpoint Y."]
  * [Transformation description, e.g. "Standardized database connection pool size."]

### 2. 🔌 Backend Core & Call Chains
* **`[filename.ext]`**:
  * [Transformation description, e.g. "Enforced user_uuid checks on query boundary."]
  * [Transformation description, e.g. "Centralized hashing algorithms inside crypto.ts."]

### 3. 🎨 Frontend Interface & Component Parity
* **`[filename.ext]`**:
  * [Transformation description, e.g. "Decomposed monolithic view into sub-components under 250 lines."]
  * [Transformation description, e.g. "Synced local theme storage to prevent render flicker."]

### 4. 🔒 Security Membranes & Invariants
* **`[filename.ext]`**:
  * [Transformation description, e.g. "Mitigated credential injection risks using prepared statements."]
  * [Transformation description, e.g. "Configured Express rate limiting on admin authentication paths."]

---

## 🩺 Verification & Health Diagnostics

[Execute all system validation pipelines and paste their exact stdout snapshots here. Never hand-wave verification; double-check the connection limits, error codes, and bounds.]

### 1. Test Suite Results
* **Vitest Execution (`npm run test` or specific suites):**
  ```text
  [Paste raw vitest console output here, e.g. "Tests  198 passed (198)"]
  ```

### 2. Compiler Health Check
* **Frontend/Backend Build (`npm run build` or equivalent):**
  ```text
  [Paste build compiler logs showing zero errors and bundle sizes, e.g. "Exit code: 0"]
  ```

### 3. Type Safety & ESLint Verification
* **TypeScript Check (`npm run lint` or `tsc --noEmit`):**
  ```text
  [Paste type checking console logs, e.g. "Exit code: 0"]
  ```

---

## 🦞 Invariant Integrity Audit

[Perform a rigorous self-review against the repository's sovereign stability locks before requesting a merge.]

* **[ ] User Isolation:** Verified that all database queries filter strictly by `user_uuid` or appropriate actor identity (zero cross-user leakage).
* **[ ] Timing Attacks:** Ensured constant-time token comparison is enforced across all sensitive endpoints using XOR metrics.
* **[ ] CrustCode©™ Separation:** Checked that no single modified or newly introduced file exceeds the **250-line** boundary.
* **[ ] Parameterized Queries:** Confirmed that all SQL queries are strictly parameterized, eliminating any potential SQL injection vector.
* **[ ] Session Cleansing:** Verified that all session storage identifiers are cleared securely on user logout.

---

**Maintained by CrustAgent©™**
