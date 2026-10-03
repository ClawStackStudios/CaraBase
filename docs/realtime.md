# Realtime Event Streaming

CaraBase offers realtime subscription capabilities, allowing your client applications to instantly react to database mutations (`INSERT`, `UPDATE`, `DELETE`) without polling.

## Server-Sent Events (SSE)

Rather than maintaining heavy, bidirectional WebSocket state, CaraBase uses lightweight **Server-Sent Events (SSE)**. This protocol is natively supported by modern browsers and relies entirely on the browser's native `EventSource` automatic reconnection behavior.

Clients subscribe via a standard `GET /rest/v1/:table` request equipped with the `Accept: text/event-stream` header.

::: code-group

```typescript [TypeScript / React]
import { createClient } from 'carabase-js';

const cb = createClient('http://localhost:5353', 'ls-your-public-key');

// Subscribe to live mutations on the 'posts' table
const unsubscribe = cb.realtime.subscribe('posts', (payload) => {
  console.log('Action:', payload.action);   // 'INSERT' | 'UPDATE' | 'DELETE'
  console.log('Data:', payload.data);       // Row data
});
```

```bash [cURL Stream]
curl -N -H "Accept: text/event-stream" \
     -H "apikey: ls-your-public-key" \
     "http://localhost:5353/rest/v1/posts"
```

:::

## Application-Level Event Bus Architecture

Contrary to advanced systems like Supabase that use PostgreSQL logical replication, CaraBase's realtime architecture is purely an **Application-Level Event Bus**.

- **No SQLite WAL Hooking:** The server does not listen to the SQLite WAL (`-wal`) file or utilize SQLite triggers for realtime.
- **Event Bus:** It uses a standard Node.js `EventEmitter`.
- **Scope Limitation:** Because it relies on the application layer, **only mutations performed via the standard REST API (`/rest/v1/:table`) trigger realtime events**. Modifications made via direct database connections, `systemApi.post('/query')`, or crucially, dynamic Custom Endpoints (`/rest/v1/custom/*`) **are entirely invisible to the realtime stream**.
- **No Multiplexing:** There is no connection multiplexing. If a client wants to listen to 3 different tables, they must open 3 distinct SSE HTTP connections. The event channels are strictly isolated by table.

To prevent phantom reads, mutations occur inside a synchronous database transaction. The code collects the modified row data during the transaction, but **delays emitting to the event bus until after the transaction successfully commits**.

## RLS Evaluation & Security Constraints

> [!WARNING]
> **RLS is evaluated statically at connection time, not per-event.**

RLS application in the realtime pipeline is currently naive. It operates as follows:

1. **At Connection Time (Static Check):** When a client requests the SSE stream, CaraBase checks if the client has *any* valid `SELECT` policy on the table. If no RLS policy exists, it returns `'0=1'`, and the server rejects the connection (`403 Forbidden`). If a policy exists, the connection opens.
2. **During Fan-out (No Check):** When a mutation occurs, the server emits the event to the Node.js `EventEmitter`. The bus broadcasts this event payload to **all attached listeners on that table**.
3. **The Vulnerability:** The server **does not re-evaluate the RLS SQL clause against the specific row for each connected client socket**. If User A updates a row, the event broadcasts to User B's open connection, exposing User A's row data to User B, even if User B's `SELECT` policy strictly dictates they shouldn't see it. 

The only gatekeeping is that User B had to have *some* valid SELECT policy on the table to open the connection in the first place. **Do not enable Realtime on tables containing highly sensitive, tenant-isolated data until this is addressed.**
