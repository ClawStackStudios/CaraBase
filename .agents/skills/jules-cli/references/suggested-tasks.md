# Reference: Proactive Task Discovery & `// TODO:` Scanner

This reference document details the technical mechanics, formatting patterns, and strategic guidelines for leveraging **Google Jules's Suggested Tasks (Proactivity)** engine.

---

## 1. Scanner Overview

Jules features an autonomous background scanner that continuously surveys repositories for maintenance and improvement opportunities.

Unlike static task lists (`TODO.md`, `ROADMAP.md`), the scanner specifically detects **inline code comments**:

> *"Jules focuses on identifying #TODO comments in your code. It reads the context, formulates a plan, and presents it for your approval."*

---

## 2. Syntax & Parsing Rules

The scanner looks for standard single-line and block comment annotations across major programming languages:

| Language | Supported Formats |
|---|---|
| JavaScript / TypeScript | `// TODO: ...`, `// TODO(...) : ...`, `/* TODO: ... */` |
| Python | `# TODO: ...`, `# TODO(...): ...` |
| Go / Rust / C / C++ | `// TODO: ...` |
| Shell / Dockerfile | `# TODO: ...` |

### Key Parsing Characteristics
- **Case-Insensitive Prefix**: `#TODO`, `#todo`, `// TODO:`, `// todo:`.
- **Context Window**: Jules does not just read the single line; it ingests the surrounding enclosing block (the function, class, or module) to understand the semantic intent.
- **Ignored Targets**: Markdown documents (`TODO.md`), documentation drafts, or vendor directories (`node_modules/`, `vendor/`) are typically ignored.

---

## 3. High-Signal Comment Patterns

To ensure Jules formulates an accurate, executable plan from an inline comment, follow these structural patterns:

### Pattern 1: Scoped Refactoring / Decomposition
```typescript
// TODO(refactor): decompose this handler into a dedicated router under src/routes/
// Constraints: preserve existing route paths, status codes, and error response schemas.
```

### Pattern 2: Defensive Edge Case Handling
```typescript
// TODO(security): sanitize user-provided column data types before SQL interpolation.
// Vector: unescaped c.type in CREATE TABLE allows DDL injection. Use safeIdent().
```

### Pattern 3: Performance & Resource Leak Fixes
```typescript
// TODO(perf): replace unbounded in-memory array with an expiring LRU cache.
// Constraint: maximum 500 entries with 15-minute TTL to prevent OOM in production.
```

---

## 4. Antigravity Agent Planting Protocol

When an Antigravity architect audits a codebase and identifies technical debt:
1. **Target Boundary Violations**: Files exceeding granularity thresholds (e.g. 500 lines) or lacking defensive checks.
2. **Plant Inline Comments**: Add concise, self-contained `// TODO:` comments directly above the target code blocks.
3. **Commit to Repository**: Ensure the comments are committed to `main` or an active feature branch.
4. **Trigger / Wait for Jules**: In Jules's Web UI, the "Suggested Tasks" pane will populate with candidate tasks. The developer can approve the generated plan with a single click.
