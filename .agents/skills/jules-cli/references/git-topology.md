# Reference: Git Topology Grounding & Container VM Workarounds

This reference document outlines common Git topology edge cases, defenses against container VM hallucinations, and CLI workarounds when collaborating with **Google Jules**.

---

## 1. Container VM Git Hallucination Defenses

Because Jules executes inside an isolated container VM, it sometimes encounters unusual Git histories (e.g., merge commits with octopus topologies, squashed branches, or root commits):

### The "Empty Main" Hallucination
- **Root Cause**: An agent running `git log` might inspect a merge commit or shallow clone and mistakenly conclude that `main` is empty if it does not explicitly traverse tree objects.
- **Consequence**: The agent might propose destructive actions like `git reset --hard` or force-pushing over `main`.
- **Defense Prompt**:
  Always ground Jules with concrete verification commands:
  ```
  Verify that main is NOT empty before touching it:
  Run `git ls-tree -r --name-only HEAD | wc -l` to verify all tracked files.
  DO NOT force-reset or rebase root on main.
  ```

---

## 2. Multi-PR Consolidation Strategy

When dealing with a backlog of Dependabot bumps, feature PRs, and security fixes:

1. **Prioritize Security Fixes**:
   Merge security/hotfix PRs (e.g. Sentinel SQL injection) first to harden `main`.
2. **Consolidate Dependency Bumps**:
   Group independent minor and patch bumps into a single consolidated update to avoid lockfile merge churn across multiple PRs.
3. **Structured Commits**:
   Instruct Jules to separate discrete concerns into distinct commits rather than a giant squash commit or raw merge artifacts:
   - Commit 1: Security fix (e.g., `fix(security): ...`)
   - Commit 2: Docker/infra update (e.g., `build(docker): ...`)
   - Commit 3: Dependency updates (e.g., `build(deps): ...`)

---

## 3. Terminal PTY Width & Session ID Truncation

### The Issue
By default, the `jules remote list --session` CLI command formats output for a standard 80-column terminal, truncating 19–20 digit numeric session IDs with ellipses (`17983432046…`). Passing a truncated ID to `jules remote pull --session` or `jules teleport` produces an API `404 Not Found` error.

### Portable Python PTY Workaround
Run the command inside a wide pseudo-terminal buffer (cols >= 250):

```bash
python3 -c "import pty, os, termios, struct, subprocess; master, slave = pty.openpty(); fcntl = __import__('fcntl'); fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack('HHHH', 50, 300, 0, 0)); p = subprocess.Popen(['jules', 'remote', 'list', '--session'], stdin=slave, stdout=slave, stderr=slave); os.close(slave); print(os.read(master, 10000).decode('utf-8', errors='ignore'))"
```

This ensures the full 20-digit session ID is cleanly captured without truncation.
