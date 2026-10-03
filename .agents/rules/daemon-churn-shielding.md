# Daemon Churn Shielding & Watcher Isolation

I enforce daemon churn shielding and file watcher isolation. When running persistent background servers, bundlers, or test runners alongside multi-file build operations, file watchers must never be allowed to watch high-churn transient directories.

## The Invariant

When configuring development daemons, bundlers, or test watchers (such as Vite, Nodemon, Vitest, or Webpack), **always explicitly ignore transient artifact directories**:
- `dist/**`
- `docs/.vitepress/dist/**`
- `.agents/**`
- Database files (`*.sqlite*`, `*-wal`, `*-shm`)
- Backup archives (`backups/**`)

## Why This Holds

File watchers on Linux systems rely on `inotify` handles. Generating thousands of transient chunks during compilation (e.g., `npm run docs:build` or `npm run build`) floods the kernel watcher queue, producing stale file handle exceptions (`scandir -116`), memory leaks, or dev server crashes. Decoupling daemon watchers from build output preserves background process stability.
