# Views, Indexes, and Triggers

Because CaraBase is built directly on SQLite, you have full access to advanced database features like Views, Indexes, and Triggers. While the CaraBase REST API simplifies basic CRUD operations, these tools allow you to optimize performance and enforce complex data integrity rules at the database level.

> [!NOTE]
> Currently, Views, Indexes, and Triggers must be created manually using the **[SQL Editor](/sql-editor)** in the SuperAdmin dashboard. 

## 1. Views

A View is a virtual table based on the result-set of an SQL statement. Views are excellent for encapsulating complex `JOIN`s or pre-filtering data without duplicating it.

**Example: Creating a View**
```sql
CREATE VIEW active_users AS
SELECT id, username, created_at 
FROM users 
WHERE status = 'active';
```

**Querying Views via the REST API**
CaraBase automatically exposes Views via the standard REST API! You can query a view exactly like a normal table:
```http
GET /rest/v1/active_users
```

> [!IMPORTANT]
> **Views and RLS:** If you query a View via the REST API, CaraBase evaluates Row-Level Security (RLS) policies attached to the *underlying tables*, not the View itself. Ensure the underlying tables have correct RLS policies.

## 2. Indexes

As your database grows, queries can slow down. Indexes allow SQLite to find rows much faster than scanning the entire table.

**Example: Creating an Index**
If you frequently query users by their email address:
```sql
CREATE INDEX idx_users_email ON users(email);
```

**When to use Indexes:**
- On columns frequently used in `WHERE` clauses.
- On columns used for sorting (`ORDER BY`).
- On foreign key columns to speed up `JOIN`s.

## 3. Triggers

Triggers are database operations that are automatically performed when a specified database event (INSERT, UPDATE, DELETE) occurs.

They are useful for maintaining audit trails, enforcing complex constraints, or automatically updating timestamps.

**Example: Auto-updating an `updated_at` timestamp**
```sql
CREATE TRIGGER update_post_timestamp 
AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
  UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

> [!WARNING]
> **Triggers and Realtime SSE:** Remember that CaraBase's Realtime architecture uses an Application-Level Event Bus, *not* SQLite WAL hooking. If a SQLite Trigger modifies a row in the background, that modification **will not** emit a Realtime SSE event to connected clients. Only mutations performed via the REST API trigger SSE events.
