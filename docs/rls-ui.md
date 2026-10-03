# RLS Policies in the UI

Writing raw SQL for Row-Level Security (RLS) can be tedious and prone to syntax errors. To simplify this, the CaraBase SuperAdmin dashboard provides a visual Policy Editor.

## The Policy Editor

Navigate to the **Policies** tab in the SuperAdmin dashboard to view all active RLS rules across your database. 

The dashboard provides visual toggles and guided inputs to generate the underlying SQLite policies without requiring you to write a single line of SQL.

### Visual Wizards (The "Lobster Guides")

When creating a new policy for a table, you can select from common templates:

1. **Public Read Access**: Generates `'1=1'` or `true` for `SELECT` operations, allowing anyone to read the table.
2. **Only the Creator**: Generates `author_id = auth_uid()`. This ensures that a user can only read, update, or delete rows where their UUID matches the `author_id` column.
3. **Role-Based Access**: Generates policies based on `auth_role()`, such as allowing only users with the `admin` role to mutate a specific table.

## Manual SQL Overrides

If your security requirements are too complex for the visual toggles (e.g., checking values in a related table via a subquery), the Policy Editor provides an "Advanced" tab.

Here, you can write the raw SQL boolean expression directly. 

**Example: Cross-table RLS**
Allow a user to read a document only if they belong to the document's organization:
```sql
organization_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth_uid())
```

> [!CAUTION]
> When writing manual SQL policies, ensure the expression evaluates to a valid boolean (`true`/`false` or `1`/`0`). CaraBase will inject this exact string into the `WHERE` clause of incoming queries. A syntax error in your policy will cause all queries against that table to fail.
