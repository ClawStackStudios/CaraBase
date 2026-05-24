# Realtime Event Streaming

CaraBase offers out-of-the-box realtime subscription capabilities, allowing your client applications to instantly react to database mutations (INSERT, UPDATE, DELETE) without polling.

## Server-Sent Events (SSE)

Rather than maintaining heavy WebSockets, CaraBase uses lightweight **Server-Sent Events (SSE)**. This protocol is natively supported by modern browsers and is perfectly suited for a unidirectional data flow (Database -> Client).

Clients connect to the `/api/realtime` endpoint, maintaining a long-lived HTTP connection. When a row changes in the database, CaraBase pushes an event down the wire.

## Database Mutation Hooks

To capture changes, CaraBase taps directly into the SQLite driver (`better-sqlite3` / `sqlite`). When a write operation completes successfully inside the REST API pipeline, the server broadcasts an internal event containing the `tableName`, the `action` (INSERT, UPDATE, DELETE), and the `payload` (the affected row data).

## RLS Event Filtering

Security does not stop at the REST boundary. The Realtime Engine rigorously enforces Row-Level Security (RLS) *before* pushing an event to a client.

1. When a client establishes an SSE connection, they provide their `apikey` and `Authorization` Bearer token.
2. The server creates an ongoing session context for that connection.
3. When an `INSERT` or `UPDATE` event fires across the system, the Realtime engine intercepts the payload.
4. It dynamically evaluates the target table's RLS `SELECT` policy *against the specific client's context*.
5. If the client does not have permission to view the row, the payload is silently dropped.
6. If permission is granted, the event is transmitted down the SSE stream to the client.

This ensures that User A will never receive a realtime WebSocket notification containing User B's private data, maintaining perfect cross-user isolation.
