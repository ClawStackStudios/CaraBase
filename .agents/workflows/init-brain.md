---
description: An Onboarding Reconnaissance workflow to initialize the brain with mechanical ground truths, tribal knowledge, and architectural seams.
---

# 🧠 /init-brain: Onboarding Reconnaissance Pass

> **Use When:** The user invokes `/init-brain` on a fresh project, or when migrating an existing repository to the Antigravity Brain architecture.
> **Purpose:** Emulates an advanced initialization scan by looking past syntax. It searches for implicit tribal knowledge, mechanical realities, and load-bearing verification gates to build a strong atomic ground floor.
> **Outcome:** Fully populates the `.agents/brain/` structure with verified, low-level technical realities.

---

## 🛑 The Golden Rule of Reconnaissance
**Do not document what the model can already read from the code.**
If the information is obvious from reading a class definition, skip it. Focus on *how the pieces connect*, *how they break*, and *what the developer must keep in their head* to avoid friction.

---

## 🔍 Step 1: Mechanical Empathy (Toolchain & Primitives)
Do not assume standard environments. Find the exact mechanical reality.

1. **Find the Build Driver:** Search for `build.gradle`, `package.json`, `Cargo.toml`, `Makefile`, etc.
2. **Execute a Dry Run:** Run version checks (e.g., `./gradlew --version`, `node -v`) to extract the exact JVM/Node/Compiler constraints.
3. **Identify Primitives:** Search for port bindings, memory limits (e.g., `16 KB page alignment`), and container configurations (`Dockerfile`).
4. **Action:** Synthesize these findings into `.agents/brain/project/runtimeEnv.md`. *Never use absolute machine paths — extract portable abstract primitives.*

## 🛡️ Step 2: Quality Gates & The Test Oracle
Find out how the code is *actually* verified, not just how it is written.

1. **CI/CD Inspection:** Read `.github/workflows/` or equivalent CI configurations. What commands do the robots run to pass a PR?
2. **Load-Bearing Redlines:** Search the codebase for critical failure boundaries (e.g., security invariants, memory leaks, unhandled crypto states).
3. **Test Suites:** Find the command to run unit, integration, and UI tests.
4. **Action:** Codify these gates into `.agents/brain/project/testOracle.md`.

## 🗺️ Step 3: Architecture Seams & Tribal Knowledge
Find the implicit rules that aren't written in the syntax.

1. **Topology Scan:** Look for module boundaries, IPC boundaries, database configurations (e.g., Room, SQLCipher), and network client setups.
2. **Friction Search:** Look through the recent `git log --oneline -n 20`. What is breaking most often? Are there undocumented commit conventions?
3. **Action:** Map the architecture and implicit rules into `.agents/brain/project/systemPatterns.md` and `.agents/brain/project/techContext.md`.

## 🎨 Step 4: Design, Version, and Scope Anchoring
Establish the visual identity and current timeline pointer.

1. **Design Discovery:** Search for a root-level `DESIGN.md` or global style tokens (`colors.xml`, `Theme.kt`, `tailwind.config.js`). Extract the core design metaphor, color palette, and component DNA.
2. **Action:** Populate `.agents/brain/project/projectDesign.md` and `.agents/brain/project/brandIdentity.md`.
3. **Version Pointer:** Inspect the latest Git tags (`git tag -l -n 5`) and version files (`build.gradle.kts` versionCode, `package.json` version).
4. **Action:** Record the current version calculus in `.agents/brain/project/productVersion.md` and the chronological state in `progress.md` and `changelog.md`.

## 🧱 Step 5: Ground Truth Synthesis
1. Verify that the `.agents/brain/` structure is complete and follows the rules established in `.agents/rules/brain.md`.
2. Generate an **Artifact:** `initialization_report.md`. Summarize the ground truth anchors discovered, the mechanical realities mapped, and the implicit tribal knowledge uncovered. Present this to the user as their solid starting floor.
