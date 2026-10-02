---
description: API & Express routing hygiene — route ordering precedence, scoped body parsers, HTTP 207 Multi-Status batch ingestion, and mutation field preservation.
---

# API & Express Routing Hygiene

## 1. Route Ordering Precedence (Static & Bulk Before Parameterized)
- In Express routers, routes are evaluated in strict order of declaration.
- **Invariant**: Static paths, sub-resources, and batch endpoints (e.g. `POST /bulk-import`, `DELETE /bulk`, `GET /export`, `POST /validate`) MUST be declared **strictly before** parameterized routes (e.g. `GET /:id`, `PUT /:id`, `DELETE /:id`).
- **Failure Mode**: Declaring `/bulk` after `/:id` causes Express to match `/:id` with `req.params.id = 'bulk'`, silently routing batch requests to single-entity handlers.

## 2. High-Throughput Batch Ingestion & HTTP 207 Multi-Status Engine
When building batch endpoints where individual item failures must not block valid records:
1. **Scoped Body Parsers**: Mount larger parsers (e.g. `express.json({ limit: '10mb' })`) strictly on the specific bulk route, placed before global body parser limits.
2. **Container-Level Middleware Validation**: Middleware validates only the outer container bounds (e.g. `z.array(z.any()).min(1).max(1000)`). Never validate inner item schema in middleware if partial failure is supported.
3. **Per-Record Route Handler Validation**: Use `schema.safeParse(item)` inside the route handler loop. Aggregate rejected records into `{ index, reason }` error descriptors.
4. **Atomic Transaction Persistence**: Persist all valid items inside a single atomic database transaction (`db.transaction(...)`). If database execution fails, rollback atomically.
5. **Multi-Status Wire Contract**:
   - Return `201 Created` with `{ inserted: string[] }` when all items succeed.
   - Return `207 Multi-Status` with `{ inserted: string[], errors: [{ index, reason }] }` when there are partial failures.
   - Return `400 Bad Request` only when the outer container schema or auth fails completely.

## 3. Bulk Mutation Field Preservation
- When executing batch updates across existing entities, handlers and client adapters MUST explicitly preserve all existing metadata fields (e.g. `tags: item.tags`, `category`) unless the route is explicitly designed to clear them.
- Endpoints that overwrite column values will silently clear unmentioned fields if not preserved by the caller.
