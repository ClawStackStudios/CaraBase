---
description: Migrate a legacy memory-bank architecture to the Antigravity Brain architecture (Self vs Environment split).
---

<migrate-to-brain>
The user invoked /migrate-to-brain (or requested migration) to convert the legacy `.agents/brain/` structure into the modern `.agents/brain/` structure, enforcing the "Self vs Environment" cognitive boundary.

## Prerequisites
1. The git worktree MUST be clean. Run `git status --porcelain` to verify. If it is dirty, halt and tell the user to commit or stash their changes first.
2. The `.agents/brain/` directory MUST exist. If it doesn't, halt.

## Phase 1: Directory & Rule Rename
1. Rename the root brain directory:
   ```bash
   git mv .agents/brain .agents/brain
   ```
2. If `.agents/rules/brain.md` exists, rename it:
   ```bash
   if [ -f .agents/rules/brain.md ]; then git mv .agents/rules/brain.md .agents/rules/brain.md; fi
   ```

## Phase 2: Self vs Environment Split
The new architecture requires separating internal agent cognition (Self) from the external world model (Environment).

1. Create the environment directory:
   ```bash
   mkdir -p .agents/brain/project
   ```
2. Move project-specific files into the `project/` directory (ignoring any that don't exist; `activeContext.md` remains in the root as active Self working memory):
   ```bash
   for file in projectBrief.md productContext.md systemPatterns.md techContext.md progress.md changelog.md; do
     if [ -f .agents/brain/$file ]; then
       git mv .agents/brain/$file .agents/brain/project/
     fi
   done
   ```

## Phase 3: Global Reference Update
Run a search-and-replace sweep across all Markdown files in the `.agents/` directory to update references. 

Run the following commands to safely update textual and path references:
```bash
find .agents/ -type f -name "*.md" -exec sed -i \
  -e 's|\.agents/brain|.agents/brain|g' \
  -e 's|brain/project/projectBrief.md|brain/project/projectBrief.md|g' \
  -e 's|brain/project/productContext.md|brain/project/productContext.md|g' \
  -e 's|brain/activeContext.md|brain/activeContext.md|g' \
  -e 's|brain/project/systemPatterns.md|brain/project/systemPatterns.md|g' \
  -e 's|brain/project/techContext.md|brain/project/techContext.md|g' \
  -e 's|brain/project/progress.md|brain/project/progress.md|g' \
  -e 's|brain/project/changelog.md|brain/project/changelog.md|g' \
  -e 's|brain/|brain/|g' \
  -e 's|memory-bank\.md|brain.md|g' \
  -e 's|Brain|Brain|g' \
  -e 's|brain|brain|g' \
  -e 's|Brain|Brain|g' \
  {} +
```

## Phase 4: Commit
Once the migration is complete and paths are updated, stage the `.agents/` directory and commit the changes.

```bash
git add .agents/
git commit -m "refactor(brain): migrate to antigravity brain architecture

User: Requested migration from legacy memory-bank to modern Brain architecture.
AI: Renamed memory-bank to brain. Enforced Self vs Environment cognitive boundary by moving project files to \`brain/project/\`. Updated all internal workflows, rules, and references to point to the new structure."
```

## Phase 5: Complete
Confirm to the user that the migration is complete. The agent is now operating with a structural Antigravity Brain, with clear boundaries between the episodic self and the external project state.
</migrate-to-brain>
