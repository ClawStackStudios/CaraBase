# Row-Level Security (RLS)

CaraBase provides powerful Row-Level Security (RLS) directly inside SQLite. Instead of writing application-level logic to filter data for each user, you define security policies directly attached to your tables, guaranteeing that security is never accidentally bypassed by a forgotten `WHERE` clause.

## The Transactional RLS Engine

Because SQLite does not have native PostgreSQL-style RLS, CaraBase implements a robust **Transactional RLS Evaluator** at the database driver layer.

### Context Binding via `AsyncLocalStorage`

When a request enters the `/rest/v1` pipeline, CaraBase resolves the user's identity from their `api-` session token. It then wraps the entire SQLite transaction inside Node.js's `AsyncLocalStorage`.

This allows CaraBase to register custom SQLite User-Defined Functions (UDFs) that magically know *who* is executing the query:
- `auth_uid()`: Returns the UUID of the current user.
- `auth_role()`: Returns the role of the current user (`viewer`, `admin`, `superadmin`).
- `auth_username()`: Returns the username.

### Policy Syntax

A policy is simply a SQL boolean expression. For example, to only allow users to read rows they created:
```sql
user_id = auth_uid()
```
If this evaluates to `true`, the row is returned. If `false`, it is omitted.

## Pre- and Post-Write Validation

CaraBase enforces RLS differently depending on the operation to ensure complete security without race conditions.

### SELECT and DELETE
For simple reads and deletions, CaraBase dynamically parses the AST of your query and securely appends the RLS condition via an `AND (...)` clause.
If your policy is `user_id = auth_uid()`, CaraBase rewrites your query under the hood:
```sql
-- Original
SELECT * FROM posts;
-- Rewritten
SELECT * FROM posts WHERE (user_id = auth_uid());
```

### INSERT Validation
SQLite does not natively support `WITH CHECK` constraints for RLS. To prevent users from inserting records on behalf of someone else (e.g., passing a forged `user_id` in the JSON body), CaraBase uses a Transactional Check:
1. CaraBase opens a `BEGIN IMMEDIATE` transaction.
2. It executes your raw `INSERT`.
3. It immediately queries the newly inserted `rowid` and applies the RLS `INSERT` policy against it.
4. If the row is returned, the policy passed, and CaraBase commits the transaction.
5. If zero rows are returned, the inserted data violated the policy. CaraBase issues a `ROLLBACK` and returns a `403 Forbidden`.

### UPDATE Validation
Updates are even more complex, requiring both `SELECT` (Can they see the row to update it?) and `UPDATE` (Does the new data still satisfy the policy?) validation.
1. Inside a transaction, CaraBase identifies the `rowid`s of all rows that match your query *and* your `SELECT` / `UPDATE` policies.
2. It performs the `UPDATE`.
3. It re-verifies the modified rows against the `UPDATE` policy to prevent ownership hijacking.
4. If any row fails the post-update check, the entire transaction rolls back.

## Private Keys Bypass RLS

If your backend code connects using a Private LobsterService Key (`ls-...`), the RLS Engine is entirely bypassed. The UDFs will still resolve if called, but no policies will be appended or checked, allowing your server-side logic unhindered access.
