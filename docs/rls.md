# Row-Level Security (RLS)

CaraBase provides powerful Row-Level Security (RLS) directly inside SQLite. Instead of writing application-level logic to filter data for each user, you define security policies directly attached to your tables, guaranteeing that security is never accidentally bypassed by a forgotten `WHERE` clause.

## The Contextual SQLite Bridge

Because SQLite does not have native PostgreSQL-style RLS, CaraBase implements a robust **Contextual RLS Evaluator** at the Node.js database driver layer.

### Context Binding via `AsyncLocalStorage`

When a request enters the `/rest/v1` pipeline, CaraBase resolves the user's identity from their `api-` session token. It then wraps the entire SQLite transaction inside Node.js's `AsyncLocalStorage` using `rlsContext.run()`.

This allows CaraBase to register custom SQLite User-Defined Functions (UDFs) globally that magically know *who* is executing the query at that exact moment:
- `auth_uid()`: Returns the UUID of the current user.
- `auth_role()`: Returns the role of the current user (`viewer`, `admin`, `superadmin`).
- `auth_username()`: Returns the username.

### Policy Compilation

Before a query executes, CaraBase retrieves the user-defined SQL definitions from `_carabase_policies`.
- If no policies exist for public requests, it yields `'0=1'` (Default deny).
- If multiple policies exist, they are logically chained together using `OR`: `((policy_1) OR (policy_2))`.

## Pre- and Post-Write Validation

CaraBase enforces RLS differently depending on the operation to ensure complete security without race conditions.

### SELECT and DELETE (Pre-flight wrapper)
For simple reads and deletions, CaraBase dynamically parses the AST of your query and securely appends the compiled RLS filter via an `AND (...)` clause.

If your policy is `user_id = auth_uid()`, CaraBase rewrites your query under the hood securely:
```sql
SELECT * FROM posts WHERE (user_id = auth_uid()) AND (status = ?)
```

### INSERT and UPDATE (Transactional Validation)
SQLite does not natively support `WITH CHECK` constraints for RLS. To prevent users from inserting records on behalf of someone else, CaraBase uses a post-mutation transactional check:
1. CaraBase opens a transaction.
2. It executes your raw `INSERT` or `UPDATE`.
3. It immediately executes a secondary read check inside the transaction: `SELECT 1 FROM table WHERE id = ? AND (${rlsFilter})`.
4. If the query returns a row, the user is authorized to own this new data state, and the transaction commits.
5. If zero rows are returned, the inserted/updated data violated the policy. CaraBase issues a `ROLLBACK` and returns an `RLS_VIOLATION` error (`403 Forbidden`).

## Bypassing RLS

If your backend code connects using a SuperAdmin session, or a Private Request Context (e.g., legacy `ls-p-` keys), the RLS Engine forces the policy to `'1=1'`. This entirely bypasses all RLS checks, allowing your server-side logic unhindered access to the database.

> [!WARNING]
> **Active RLS Gap in Realtime & Custom Endpoints**
> Due to the architectural boundaries of SQLite, RLS applies differently to two specific features:
> 1. **Realtime**: RLS is evaluated *once* at connection time. When a mutation occurs, the event broadcasts to all connected sockets. Ensure Realtime is only enabled on tables where connected users share access privileges.
> 2. **Custom Endpoints**: Custom endpoints currently execute `db.prepare().all()` *without* the `rlsContext.run()` wrapper. `auth_uid()` resolves to `null` (anon) inside custom endpoints.
