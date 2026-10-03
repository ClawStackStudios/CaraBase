# Realtime Event Streaming

CaraBase offers out-of-the-box realtime subscription capabilities, allowing your client applications to instantly react to database mutations (INSERT, UPDATE, DELETE) without polling.

---

## Server-Sent Events (SSE)

Rather than maintaining heavy, bidirectional WebSocket state and custom reconnect protocols, CaraBase uses lightweight **Server-Sent Events (SSE)**. This protocol is natively supported by modern browsers and is perfectly suited for unidirectional database mutation streams (Database → Client).

Clients connect to the `/api/realtime` endpoint, maintaining a persistent HTTP stream. When a row changes in SQLite, CaraBase pushes an event down the wire.

::: code-group

```typescript [TypeScript / Browser SDK]
import { createClient } from '@carabase/sdk';

const carabase = createClient({
  baseUrl: 'http://localhost:5353',
  apiKey: 'ls-your-public-key'
});

// Subscribe to live mutations on the 'posts' table
const subscription = carabase.realtime.subscribe('posts', (event) => {
  console.log('Action:', event.action);   // 'INSERT' | 'UPDATE' | 'DELETE'
  console.log('Payload:', event.payload); // Row data
});
```

```bash [cURL Stream]
curl -N -X GET "http://localhost:5353/api/realtime?table=posts" \
  -H "apikey: ls-your-public-key" \
  -H "Authorization: Bearer api-your-session-token"
```

:::

---

## Database Mutation Hooks

To capture changes, CaraBase taps directly into write operations inside the REST API pipeline. When an `INSERT`, `UPDATE`, or `DELETE` executes successfully:
1. The server generates an internal mutation event containing `tableName`, `action`, and `payload` (the affected row data).
2. The mutation broadcaster distributes the event across all active client streams.

---

## RLS Event Filtering

Security does not stop at the REST boundary. The Realtime Engine rigorously enforces Row-Level Security (RLS) *before* pushing an event to a client:

1. When a client establishes an SSE connection, they provide their `apikey` and `Authorization` Bearer token.
2. The server creates an ongoing session context for that connection.
3. When an `INSERT` or `UPDATE` event fires across the system, the Realtime engine intercepts the payload.
4. It dynamically evaluates the target table's RLS `SELECT` policy *against the specific client's context*.
5. If the client does not have permission to view the row, the payload is silently dropped.
6. If permission is granted, the event is transmitted down the SSE stream to the client.

This ensures that User A will never receive a realtime SSE notification containing User B's private data, maintaining perfect cross-user isolation.
