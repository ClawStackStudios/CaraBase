# 📋 Jules Atomic Tasks Directory

This directory holds isolated task specifications for Google Jules fleet sessions.

Each task is defined in its own independent file:
- `task-1.md`
- `task-2.md`
- `task-3.md`
...

### Task File Structure
Each `task-<N>.md` file contains:
1. **Title & Target**: Feature or fix name, specific file paths, and line boundaries.
2. **Context & Problem**: Exactly what is broken or needs refactoring.
3. **Task Shape & Expected Output**: The target modular structure or solution design.
4. **Acceptance Criteria**: Strict verification requirements (`npm run lint`, `npm run build`, `npm test`).

### Benefits
- **Zero Cross-Task Context Bleed**: A session only ingests its assigned task.
- **Zero Git Merge Conflicts on Task Plans**: Multiple sessions never edit a shared task roster.
