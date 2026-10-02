---
name: jules-cli
description: Google Antigravity framework skill for delegating coding tasks, bug fixes, and feature implementations asynchronously to Google Jules CLI using the .jules/ workspace directory, jules-task-plan.md, and proactive inline // TODO comments.
---

# Jules CLI Skill (Google Antigravity Edition)

This skill provides portable operational guidelines, verified CLI command syntax, prompt protocols, and asynchronous workflows for collaborating with **Google Jules CLI** inside the **Google Antigravity** framework.

---

## 🏛️ Architecture: Coordinator & Background Executor

In the **Google Antigravity** multi-agent paradigm:
- **Antigravity (Gemini / Claude)** operates as the **architect and coordinator**: mapping git topology, evaluating architectural constraints, constructing structured task plans, planting code annotations, and reviewing incoming patches.
- **Google Jules** operates as the **asynchronous background executor in an isolated VM**: writing code, executing automated test suites, resolving merge conflicts, and publishing GitHub Pull Requests.

---

## 💻 Portable Jules CLI Command Reference

All interactions rely strictly on the standard `jules` CLI binary in the user's `PATH`.

### 1. Launch & Session Creation
```bash
# Launch interactive TUI
jules

# Create a session in current working directory's repository
jules new "task description or prompt"

# Create a session targeting a specific repository
jules new --repo owner/repo "task description"

# Launch multiple parallel exploration sessions
jules new --repo owner/repo --parallel 3 "task description"
```

### 2. Inspecting Remote Sessions
```bash
# List all remote sessions (displays: ID, Description, Repo, Last active, Status)
jules remote list --session

# List all repositories connected to Jules
jules remote list --repo
```

> [!TIP]
> **Extracting Full Session IDs (Overcoming Terminal Ellipsis Truncation):**  
> In standard terminal widths, `jules remote list --session` truncates 19–20 digit numeric session IDs with an ellipsis (e.g. `17983432046…`). Passing a truncated ID to subsequent commands triggers a `404 Not Found` API error.  
> To capture the full session ID in non-interactive scripts or narrow shells, invoke Jules through a wide pseudo-terminal buffer (cols >= 250):
> ```bash
> python3 -c "import pty, os, termios, struct, subprocess; master, slave = pty.openpty(); fcntl = __import__('fcntl'); fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 50, 300, 0, 0)); p = subprocess.Popen(['jules', 'remote', 'list', '--session'], stdin=slave, stdout=slave, stderr=slave); os.close(slave); print(os.read(master, 10000).decode('utf-8', errors='ignore'))"
> ```

### 3. Reviewing & Pulling Patches
```bash
# Inspect the remote diff without altering local files
jules remote pull --session <SESSION_ID>

# Apply the patch directly to the local workspace
jules remote pull --session <SESSION_ID> --apply

# Teleport: clones repo / checks out branch and applies session patch in one step
jules teleport <SESSION_ID>
```

### 4. Interactive Feedback & Follow-ups
The CLI does not currently support viewing conversational transcripts or submitting replies to active sessions directly via terminal arguments. When Jules pauses in `Awaiting User Feedback` or `Awaiting Plan Approval`:
1. **Ask the user to fetch the prompt/question Jules is waiting on**: Because CLI inspection only reveals git diffs and status, ask the user to copy whatever question, plan proposal, or review comment Jules posted in the Web UI.
2. **Formulate a grounded response prompt**: Analyze Jules's message, cross-reference it against the codebase and git state, and generate a precise, copy-pasteable prompt for the user.
3. **Provide the direct session link**:  
   **`https://jules.google.com/task/<SESSION_ID>`**
4. **User submission**: The user pastes the grounded prompt directly into Jules's web chat to steer or unblock Jules.

---

## 🔍 Proactive Task Discovery: The `// TODO:` Scanner

Jules features an autonomous **Suggested Tasks** capability controlled by its "proactivity" toggle.

### How It Operates
- Jules actively parses repository source code specifically scanning for **inline `#TODO` or `// TODO:` comments** (e.g., `// TODO: handle edge case`).
- *Per documentation:* **"Jules focuses on identifying #TODO comments in your code. It reads the context, formulates a plan, and presents it for your approval."**
- It does **not** scan standalone static markdown files like `TODO.md` or `TODO.txt` for this feature.

### Antigravity Proactive Steering Protocol
Antigravity agents can proactively direct Jules's task pipeline without manual ticketing:
1. Audit the repository for technical debt, unhandled errors, or architectural boundary violations (such as files exceeding file-length guidelines).
2. Insert scoped, actionable `// TODO:` comments directly above target modules, handlers, or components.
3. When Jules executes its next background repo sweep, it automatically ingests these comments, synthesizes execution plans, and generates task cards for user review.

---

## 🛡️ Git Grounding & Hallucination Defenses

Because Jules operates in an isolated container VM, complex branching trees or merge histories can occasionally cause it to misinterpret the repository topology (e.g. assuming a branch is empty if inspecting merge commits without traversing tree objects).

Always ground Jules prompts with explicit git invariants:
1. **Specify the active base branch** (e.g., `main`).
2. **Provide tree verification commands** (e.g., instruct Jules to run `git ls-tree -r --name-only HEAD` to verify file presence).
3. **Set negative guardrails**: Explicitly state: *"DO NOT force-reset, rebase root, or force-push `main`."*

---

## 📋 The 4-Step Delegation Protocol

### Step 1: Context Preparation & Task Plan File
1. Ensure project guidelines, constraints, and architecture rules are up to date.
2. Create the task directory and plan file in the workspace root:
   ```bash
   mkdir -p .jules/tasks
   ```
3. Author `.jules/tasks/jules-task-plan.md` defining:
   - Scope and target files.
   - Architectural constraints and requirements.
   - Verification gates (e.g., typecheck, build, test suite).

### Step 2: Offload Task via Jules CLI
When dispatching a task with `jules new`, ALWAYS include the mandatory context directive:

> `"read your .jules/ directory, and read the jules-task-plan.md in the .jules/tasks/ directory."`

Example:
```bash
jules new "read your .jules/ directory, and read the jules-task-plan.md in the .jules/tasks/ directory to implement Task 1."
```

### Step 3: Monitor & Guide Execution
1. Periodically check session progress via `jules remote list --session`.
2. Inspect ongoing code diffs using `jules remote pull --session <SESSION_ID>`.
3. When Jules enters `Awaiting User Feedback` or `Awaiting Plan Approval`:
   - Ask the user to fetch the question or plan Jules posted in the Web UI.
   - Analyze Jules's input and produce a clear, grounded copy-paste prompt.
   - Provide the direct URL (`https://jules.google.com/task/<SESSION_ID>`).

### Step 4: Audit & Apply Results
1. Inspect the completed patch using `jules remote pull --session <SESSION_ID>`.
2. Apply changes locally with `jules remote pull --session <SESSION_ID> --apply` or `jules teleport <SESSION_ID>`.
3. Run local verification gates (lint, build, unit/integration test suites) to confirm total correctness before merging.