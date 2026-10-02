---
name: jules-cli
description: Google Antigravity framework skill for delegating coding tasks, bug fixes, and feature implementations asynchronously to Google Jules CLI using the .jules/ workspace directory, jules-task-plan.md, and proactive inline // TODO comments.
---

# Jules CLI Skill (Google Antigravity Edition)

This skill provides verified instructions, CLI command syntax, prompt protocols, and operational workflows for collaborating with **Google Jules CLI** inside the **Google Antigravity** framework.

---

## 🏛️ Architecture: Coordinator & Background Executor

In the **Google Antigravity** environment:
- **Antigravity (Gemini / Claude)** acts as the **architect and coordinator**: inspecting git trees, enforcing architectural ceilings, writing task plans, and auditing outputs.
- **Google Jules** operates as an **asynchronous executor in an isolated VM**: implementing code, running tests, resolving dependencies, and pushing GitHub PRs.

---

## 💻 Verified Jules CLI Command Reference

The `jules` CLI binary (`/config/Applications/node-v22.23.0-linux-x64/bin/jules`) exposes the following command structure:

### 1. Launch & Session Creation
```bash
# Launch interactive TUI
jules

# Create a session in current working directory's repository
jules new "task description or prompt"

# Create a session targeting a specific repository
jules new --repo ClawStackStudios/CaraBase "task description"

# Launch multiple parallel sessions for exploration
jules new --repo ClawStackStudios/CaraBase --parallel 3 "task description"
```

### 2. Inspect Remote Sessions
```bash
# List all remote sessions (shows ID, Description, Repo, Last active, Status)
jules remote list --session

# List all repositories connected to Jules
jules remote list --repo
```

> [!TIP]
> **Extracting Full Session IDs (Overcoming Ellipsis Truncation):**  
> In standard shell windows, `jules remote list --session` truncates 19–20 digit session IDs with an ellipsis (e.g. `17983432046…`). Passing a truncated ID to `jules remote pull` returns a `404 Not Found`.  
> To extract the untruncated ID, invoke Jules through a wide pseudo-terminal (cols >= 250):
> ```bash
> python3 -c "import pty, os, termios, struct, subprocess; master, slave = pty.openpty(); fcntl = __import__('fcntl'); fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 50, 300, 0, 0)); p = subprocess.Popen(['jules', 'remote', 'list', '--session'], stdin=slave, stdout=slave, stderr=slave); os.close(slave); print(os.read(master, 10000).decode('utf-8', errors='ignore'))"
> ```

### 3. Reviewing & Pulling Patches
```bash
# Inspect the remote diff without modifying local working copy
jules remote pull --session <FULL_SESSION_ID>

# Apply the patch directly to the local repository
jules remote pull --session <FULL_SESSION_ID> --apply

# Teleport: clone/checkout branch and apply remote changes in one step
jules teleport <FULL_SESSION_ID>
```

### 4. Interactive Feedback & Follow-ups
The CLI does not currently support viewing conversation transcripts or posting follow-up messages into an active session. When Jules enters `Awaiting User Feedback` or `Awaiting Plan Approval`:
- **Ask the user to fetch the prompt/question Jules is waiting on**: Because CLI output only reveals git diffs and status (not the conversational chat), the agent asks the user to copy whatever question, plan, or feedback Jules posted in the Web UI so the agent can work directly off of Jules's context.
- **Formulate a grounded response prompt**: The agent analyzes Jules's message, verifies the relevant git and code invariants, and creates a precise, ready-to-copy prompt for the user to pass back to Jules.
- **Provide the direct session link**:  
  **`https://jules.google.com/task/<FULL_SESSION_ID>`**
- **User paste**: The user pastes the grounded prompt directly into Jules's web chat interface to steer or unblock Jules.

---

## 🔍 Proactive Task Discovery: The `// TODO:` Scanner

Jules includes a **Suggested Tasks** feature controlled by the "proactivity" toggle.

### How It Works
- Jules specifically scans for **inline `#TODO` and `// TODO:` comments inside source code files** (e.g., `// TODO: handle edge case`).
- *Per documentation:* **"Jules focuses on identifying #TODO comments in your code. It reads the context, formulates a plan, and presents it for your approval."**
- It does **not** scan standalone `TODO.txt` or `TODO.md` files for suggestions.

### Antigravity Proactivity Strategy
Antigravity coordinators can proactively steer Jules by planting strategic `// TODO:` comments inline in source code:
1. Identify architectural violations (e.g. monolithic files exceeding the 500-line ceiling).
2. Insert clear, scoped `// TODO:` comments above target functions, routers, or components.
3. Jules will sniff them out on its next repo scan and formulate actionable task cards for approval.

---

## 🛡️ Git Grounding & Hallucination Defense

When dispatching tasks to Jules, always ground Jules with verifiable git facts:
1. **Never assume Jules infers branch state correctly**: In complex trees with merge commits, Jules may hallucinate that `main` is empty.
2. **Explicit Directives**: Always instruct Jules with:
   - The exact starting branch (e.g. `main`).
   - The file count confirmation command (`git ls-tree -r --name-only HEAD`).
   - Explicit negative constraints: *"DO NOT force-reset, rebase root, or force-push `main`."*

---

## 📋 The 4-Step Delegation Protocol

### Step 1: Prepare Context & Task Plan
1. Ensure project architecture rules in `.agents/brain/` and `USER.md` are up to date.
2. Create `.jules/tasks/jules-task-plan.md`:
   ```bash
   mkdir -p .jules/tasks
   ```
3. Detail the problem, target files, acceptance criteria, and verification commands (`npm run lint`, `npm test`).

### Step 2: Dispatch Task with Mandatory Prompt
When creating a session via `jules new`, ALWAYS include the mandatory directive:

> `"read your .jules/ directory, and read the jules-task-plan.md in the .jules/tasks/ directory."`

Example CLI Dispatch:
```bash
jules new "read your .jules/ directory, and read the jules-task-plan.md in the .jules/tasks/ directory to execute Task 1."
```

### Step 3: Monitor & Guide Execution
1. Monitor status with `jules remote list --session`.
2. Pull the latest code diff to inspect ongoing progress via `jules remote pull --session <ID>`.
3. If Jules pauses at `Awaiting User Feedback` or `Awaiting Plan Approval`:
   - **Ask the user to fetch the prompt/question Jules is waiting on** in the Web UI so the agent can work off Jules's exact context.
   - Formulate a grounded response prompt addressing Jules's plan or questions.
   - Give the user the copy-paste prompt and direct link (`https://jules.google.com/task/<ID>`) to submit in the web interface.

### Step 4: Audit & Teleport
1. Inspect the diff remotely via `jules remote pull --session <ID>`.
2. Apply changes locally via `jules remote pull --session <ID> --apply` or `jules teleport <ID>`.
3. Run the local verification gates (`npm run lint`, `npm run build`, `npm test`) before pushing.