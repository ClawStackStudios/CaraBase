# CaraBase React Integration Guide

This guide demonstrates how to integrate the CaraBase JavaScript SDK (`carabase-js`) into a standard React application to fetch, display, and mutate data.

## 1. Installation

First, install the SDK (assuming it's published or linked locally):

```bash
npm install carabase-js
```

## 2. Initialization

Initialize the CaraBase client in a separate file (e.g., `src/carabase.ts`) so it can be reused across your application. You will need your project URL and a public Lobster Key (starting with `pb-`).

```typescript
// src/carabase.ts
import { createClient } from 'carabase-js';

// Always use a public key (pb-...) in the frontend!
// Secret keys (sk-...) should never be exposed in the browser.
const CARABASE_URL = import.meta.env.VITE_CARABASE_URL;
const CARABASE_KEY = import.meta.env.VITE_CARABASE_ANON_KEY;

export const cb = createClient(CARABASE_URL, CARABASE_KEY);
```

## 3. Data Fetching & Mutations in a React Component

Here is a full example of a React component that fetches a list of tasks, adds new tasks, and deletes tasks using the CaraBase client.

```tsx
// src/components/TaskList.tsx
import React, { useEffect, useState } from 'react';
import { cb } from '../carabase';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await cb
        .from('tasks')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Insert a new task
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const { data, error } = await cb
        .from('tasks')
        .insert({ title: newTaskTitle, completed: false });

      if (error) throw error;
      
      // Clear input and refetch to get the latest list
      setNewTaskTitle('');
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Delete a task
  async function deleteTask(id: number) {
    try {
      const { error } = await cb
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refetch after deletion
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Task List</h2>
      
      <form onSubmit={addTask} style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title..."
          required
        />
        <button type="submit">Add Task</button>
      </form>

      <ul>
        {tasks.map(task => (
          <li key={task.id} style={{ marginBottom: '0.5rem' }}>
            <span>{task.title} {task.completed ? '(Done)' : ''}</span>
            <button 
              onClick={() => deleteTask(task.id)}
              style={{ marginLeft: '1rem', color: 'red' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p>No tasks found. Create one!</p>}
    </div>
  );
}
```

## Security Considerations

1. **Row Level Security (RLS)**: If you have RLS policies enabled on the `tasks` table, the public Lobster Key will only be able to fetch or mutate rows that the policy permits. 
2. **Never expose `sk-` or `su-` keys**: If your app requires bypassing RLS, you must make those requests from a secure backend environment (like a Node.js server or Serverless Function) using a Secret or SuperAdmin key, never directly from the React frontend.
