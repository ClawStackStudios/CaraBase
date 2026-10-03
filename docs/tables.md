# Tables and the Table Editor

![Screenshot: Table Editor Overview Placeholder](https://via.placeholder.com/800x400.png?text=Table+Editor)

The CaraBase Table Editor is a visual spreadsheet-like interface for managing your SQLite database. It allows you to create tables, modify schemas, and insert or update data directly from the browser.

## The Table Editor vs. Data Viewer

CaraBase enforces a strict separation between modifying the structure of your database and modifying the data inside it, based on how you logged in:

1. **SuperAdmin Dashboard (`/admin-login`)**: When logged in with your `ADMIN_TOKEN`, you can create new tables, add columns, change data types, and manage primary keys. You can also edit the data inside the tables.
2. **Data Dashboard (Default)**: When logged in as a normal user (`hu-`), the dashboard acts purely as a Data Viewer. You can view, insert, update, and delete rows (subject to Row-Level Security), but you **cannot** alter the table structure.

## Creating a Table

To create a table in the SuperAdmin Dashboard:
1. Navigate to the **Table Editor** using the sidebar.
2. Click **New Table**.
3. Define your columns and their SQLite data types (`TEXT`, `INTEGER`, `REAL`, `BLOB`, `BOOLEAN`).
4. (Optional) Set up primary keys and default values.

> [!TIP]
> The Table Editor uses standard SQLite syntax under the hood. There is no CaraBase-specific schema language to learn.

## Interacting with Data

Once your table exists, you can interact with it just like a spreadsheet:
- **Insert Row**: Click the "Insert Row" button to add a new record.
- **Edit Cells**: Double-click any cell to edit its value directly.
- **Delete Rows**: Select rows using the checkboxes and click the trash icon.

Remember, if you are in the Data Dashboard (not the SuperAdmin portal), all data interactions are subject to Row-Level Security (RLS). If a policy prevents you from updating a row, the UI will present a `403 Forbidden` error.
