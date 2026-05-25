# Integrating RLS: Cross-Boundary Setup Guides

Row-Level Security (RLS) is only as strong as its context mapping. CaraBase's 3-Key Architecture ensures that data access is mathematically proven at the SQLite driver layer, regardless of what frontend framework or backend service connects to it.

This manual provides comprehensive, structurally aligned instructions for setting up and authenticating RLS context from various external application boundaries.

---

## 🔑 The 3-Key Architecture Refresher

Before connecting any application, you must select the correct Key Topology:

1. **LobsterKeys (`lb-`)**: The Agent Sandbox. Use these when giving an AI agent controlled access to data on behalf of a human user. RLS is enforced based on the parent user's context.
2. **Public Data Keys (`ls-`)**: The External Frontend. Use these in React, Vue, iOS, or AI Studio apps. These keys **strictly enforce RLS**. If no policies exist, data access is inherently denied (`0 rows returned`).
3. **Private Admin Keys (`ls-p-`)**: The Server Membrane. Use these exclusively in secure backend server environments (Node.js, Python, Go). These keys **bypass RLS completely**, granting root-level SQLite access. *Never expose these to the client.*

---

## 🌐 1. Setting up RLS in a React/Vite Frontend

When building a client-side application, you must use a Public Key (`ls-`) to ensure no user can read another user's data.

### Step 1: Initialize the Client
In your React application, initialize your HTTP client using the Public Key.

```javascript
// src/lib/carabase.js
const CARABASE_URL = "http://localhost:3000";
const CARABASE_PUBLIC_KEY = "ls-your-public-key-here";

export const carabaseFetch = async (endpoint, options = {}) => {
  return fetch(`${CARABASE_URL}/rest/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": CARABASE_PUBLIC_KEY,
      ...options.headers
    }
  }).then(res => res.json());
};
```

### Step 2: Define the RLS Policy in CaraBase
In the CaraBase SuperAdmin dashboard, navigate to **Policies** for your `posts` table and create a `SELECT` policy:
```sql
-- Only allow reading posts where the author matches the current context
author_id = @user_id
```

### Step 3: Pass Context via Query Parameters
Because CaraBase parses URL query parameters as policy bindings, you can securely pass context down the wire. RLS prevents the user from simply changing the URL to read someone else's data, because CaraBase will bind the provided `user_id` parameter to the `@user_id` SQLite variable. If the row's `author_id` doesn't match the bound `@user_id`, the row is physically omitted from the JSON response.

```javascript
// React Component
import { useEffect, useState } from 'react';
import { carabaseFetch } from '../lib/carabase';

export function UserPosts({ currentUserId }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // The query parameter ?user_id=... provides the context for the RLS policy
    carabaseFetch(`/posts?user_id=${currentUserId}`)
      .then(data => setPosts(data));
  }, [currentUserId]);

  return (
    <ul>
      {posts.map(post => <li key={post.id}>{post.content}</li>)}
    </ul>
  );
}
```

> [!WARNING]
> Do not attempt to write complex `WHERE` logic in your React components to hide data. Always fetch blindly and rely on CaraBase's RLS engine to return the inherently secured payload.

---

## 🧠 2. Setting up RLS in AI Studio (Testing & Prototyping)

When prototyping tools in Google AI Studio, you often need an Agent to fetch data from your database. You should use the `ls-` public key to ensure the Agent cannot be jailbroken into reading unauthorized data.

### Step 1: Configure the OpenAPI Tool
In AI Studio, define an OpenAPI schema tool that hits your CaraBase instance:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "CaraBase RLS Read",
    "version": "1.0.0"
  },
  "paths": {
    "/rest/v1/confidential_data": {
      "get": {
        "operationId": "getConfidentialData",
        "parameters": [
          {
            "name": "apikey",
            "in": "header",
            "required": true,
            "schema": { "type": "string" }
          },
          {
            "name": "department_id",
            "in": "query",
            "required": true,
            "description": "The RLS context binding for the department",
            "schema": { "type": "string" }
          }
        ]
      }
    }
  }
}
```

### Step 2: The Security Guarantee
If the AI is jailbroken and attempts to fetch data for `department_id=hr` instead of its assigned `department_id=engineering`, the CaraBase RLS engine will evaluate the policy: `department = @department_id`. If the AI isn't supposed to see HR data, the query returns an empty array `[]`. The prompt injection is neutralized at the database driver level.

---

## ⚙️ 3. Setting up Server-Side Admin Bypasses

In secure environments (like a Node.js webhook handler, or a Python cron job), you often need to perform global aggregations or mass updates. RLS is an obstacle here.

### Step 1: Use the Private Key (`ls-p-`)
Instead of `ls-`, initialize your backend connection using the Private Key.

```python
# python_backend.py
import requests

CARABASE_URL = "http://localhost:3000"
CARABASE_PRIVATE_KEY = "ls-p-your-secret-admin-key"

def trigger_global_backup():
    # Because we use ls-p-, RLS is bypassed. We can read all rows from all users.
    response = requests.get(
        f"{CARABASE_URL}/rest/v1/metrics",
        headers={"apikey": CARABASE_PRIVATE_KEY}
    )
    return response.json()
```

> [!CAUTION]
> The `ls-p-` key possesses absolute sovereign control over the Data API. If this key is exposed in a public GitHub repository or bundled into a React Native app, your RLS invariants are compromised. Treat it with the same reverence as your `DB_ENCRYPTION_KEY`.
