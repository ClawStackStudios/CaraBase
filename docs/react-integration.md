# CaraBase React Integration Guide

This guide demonstrates how to integrate the official CaraBase JavaScript/TypeScript SDK (`carabase-js`) into a modern React application (Vite, Next.js, or Remix) to fetch, display, and mutate data securely.

## 1. Installation

> [!NOTE]
> **Manual SDK Distribution**
> The `carabase-js` SDK is currently not published to npm. It is distributed as a source module within the `sdk/` directory of the CaraBase repository.

To use the SDK in your project:
1. Copy the `sdk/` directory from the CaraBase repository into your project (or clone it).
2. Build the SDK from source:
   ```bash
   cd sdk
   npm install
   npm run build
   ```
3. Link or install the built package into your React application's `package.json`:
   ```bash
   npm install ../path/to/carabase/sdk
   ```

## 2. Client Initialization

Initialize the CaraBase client in a dedicated library module (e.g., `src/lib/carabase.ts`) so it can be reused across your application.

::: code-group

```typescript [src/lib/carabase.ts]
import { createClient } from 'carabase-js';

// Always use a public key (ls-...) in the browser!
// Private keys (ls-p-...) bypass RLS and must NEVER be bundled in frontend code.
const CARABASE_URL = import.meta.env.VITE_CARABASE_URL || 'http://localhost:5353';
const CARABASE_KEY = import.meta.env.VITE_CARABASE_PUBLIC_KEY || 'ls-your-public-api-key';

export const cb = createClient(CARABASE_URL, CARABASE_KEY);
```

```env [.env.local]
VITE_CARABASE_URL=http://localhost:5353
VITE_CARABASE_PUBLIC_KEY=ls-your-public-api-key
```

:::

## 3. Data Fetching & Mutations in a React Component

Here is a complete, production-ready React component demonstrating queries, inserts, updates, and deletes with optimistic local state and error handling.

```tsx
import React, { useEffect, useState } from 'react';
import { cb } from '../lib/carabase';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  created_at?: string;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await cb
        .from('tasks')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }

  // Insert a new task
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    try {
      setError(null);
      const { data, error } = await cb
        .from('tasks')
        .insert({ title, completed: false });

      if (error) throw error;
      
      setNewTaskTitle('');
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to insert task');
    }
  }

  // Toggle task completion status
  async function toggleTask(task: Task) {
    try {
      setError(null);
      const { error } = await cb
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  }

  // Delete a task
  async function deleteTask(id: number) {
    try {
      setError(null);
      const { error } = await cb
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  }

  if (loading) return <div className="p-4 text-slate-500">Loading tasks...</div>;

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Tasks</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <form onSubmit={addTask} className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title..."
          required
          className="flex-1 px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded transition-colors"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map(task => (
          <li 
            key={task.id} 
            className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={task.completed} 
                onChange={() => toggleTask(task)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                {task.title}
              </span>
            </div>
            <button 
              onClick={() => deleteTask(task.id)}
              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No tasks found. Create one!</p>
      )}
    </div>
  );
}
```

## Security Considerations

1. **Row-Level Security (RLS)**:
   - When communicating via `ls-` (public key), CaraBase strictly evaluates RLS policies attached to the target table.
   - If a table has no RLS policies enabled, all `ls-` queries are denied (`403 Forbidden` or `0 rows returned`).
2. **Never expose `ls-p-` keys**:
   - Private keys (`ls-p-...`) completely bypass RLS and possess root database privileges.
   - Never place `ls-p-` in client-side code, Git repos, or `.env` files exposed via `VITE_` or `NEXT_PUBLIC_` prefixes.
   - If backend-privileged operations are needed, proxy them through an authenticated backend route (e.g. Next.js API route or Express proxy).
3. **Session Tokens (`api-`)**:
   - For authenticated human users, trade the human secret (`hu-`) via `POST /api/auth/token` to receive an ephemeral `api-` session token.
   - Supply the session token in the `Authorization: Bearer api-...` header alongside your `apikey: ls-...`.

