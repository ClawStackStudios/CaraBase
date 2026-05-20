# CaraBase Roadmap

> Maintained by CrustAgent©™ for ClawStack Studios©™

## Current Phase: Vanguard MVP
- [x] Basic SQLite abstraction
- [x] Simple raw dynamic schema migrations via Web Dashboard
- [x] Public & Private API token layer implementation
- [x] System/External route isolation
- [x] Row Level Security (RLS) simulation for direct dynamic SQLite querying
- [x] For CaraBase, integrate Row Level Security (RLS) capabilities. Allow users to define policies that grant or deny access to specific rows in a table based on conditions like the authenticated user's ID, user roles, or custom claims. Ensure RLS applies to all database operations (CRUD).
- [x] Storage: Includes integrated file storage for handling user uploads.
- [x] Real-time: Provides real-time updates via Server-Sent Events (SSE)
- [x] Implement Server-Sent Events (SSE) for the '/rest/v1/:table' endpoint to push realtime database changes to connected clients.
- [x] The application has a theme toggle functionality that uses a circular reveal animation. Add support for a dark mode. Apply dark mode styles globally and ensure the theme toggle button correctly switches between light and dark themes.
- [x] The application needs a dark mode. Globally apply dark mode styles and ensure the existing theme toggle button correctly switches between light and dark themes. This should leverage the CSS variables or a similar mechanism for theming.
- [x] Add realtime database functionality to CaraBase. Users should be able to subscribe to database changes and receive updates in real-time, similar to how services like Firebase or Supabase offer this feature. Ensure efficient handling of concurrent connections and data broadcasts.
- [ ] Develop a feature within the CaraBase web UI that allows users to automatically generate RESTful APIs for their SQLite databases. The builder should let users define endpoints, specify HTTP methods (GET, POST, PUT, DELETE), and configure request/response schemas based on their database tables. Include options for pagination, filtering, and sorting.


## Phase 2: Structural Integrity
- [x] User Authentication Module (Session management and `users` table auto-provisioning). 
- [x] For CaraBase, implement the ClawKeys System, Ensuring secure password hashing and session management. Make sure the login flow is correctly wired up in the back end so user accounts are able to be created, clawkeys can be generated. and the user is able to make it all the way to the dashboard.  
- [ ] Develop a user-friendly interface for CaraBase where users can visually design and manage their database schemas. This should include creating tables, defining columns with various data types (text, integer, boolean, timestamp, etc.), setting constraints (like primary keys, foreign keys, and not null), and indexing options.
- [ ] Provide clearer visual feedback to the user when data operations (add, delete, update) are in progress or have failed. This could include loading spinners, success/error messages, or disabling buttons during operations to prevent duplicate requests.
- [x] Implement confirmation dialogs for destructive actions within the CaraBase application. Specifically, add dialogs before revoking API keys or deleting RLS policies to prevent accidental data loss.
- [ ] Implement user role management to assign different permissions (e.g., admin, editor, viewer) to users, allowing for granular access control within the application.
- [x] Add audit logging to track all significant user actions (e.g., data modifications, API key revocations, policy changes) and store these logs for security and compliance purposes.
- [ ] Storage abstraction interface layer for local FS uploads.
- [x] For operations involving multiple database writes (e.g., creating a table and its initial policies), implement database transactions to ensure atomicity. If any part of the operation fails, roll back all changes to maintain data consistency.
- [x] Implement server-side validation for all incoming data in API endpoints related to data manipulation (e.g., creating/updating tables, managing policies, API keys). Ensure data conforms to expected types, formats, and constraints before processing to prevent corruption.
- [x] Enhance error handling for API requests (POST /api/system/keys, DELETE /api/system/keys/:id) and database operations. Ensure all errors are caught, logged appropriately, and returned to the client with meaningful messages. Consider a centralized error handling middleware.
- [x] In the API Keys page, implement the functionality to generate a new API key. When a user provides a name and type (public/private) for a new API key, generate a unique key, store it in the database, and display it to the user. Ensure the generated key is only shown once upon creation.
- [x] Add confirmation dialogs for destructive actions like deleting tables or revoking API keys.
- [ ] Implement a daily automated backup mechanism for the SQLite database. The backups should be stored in a separate directory, ideally configurable via environment variables, and the system should retain a reasonable number of recent backups to allow for restoration.
- [x] The CaraBase application has a page for managing Row Level Security (RLS) policies. Add functionality to delete existing policies. Include a confirmation dialog to prevent accidental deletion.
- [x] Create a new page or section in the dashboard to display audit logs. This should show details of user actions, including timestamp, event type, actor, action, and outcome. Allow filtering and searching of logs.

## Phase 3: Table Editor
- [ ] Add a feature to fetch data from the '/rest/v1/:table' endpoint for a selected table and display it in a table format.
- [ ] Improve the Table Editor UI by adding client-side sorting and filtering for table columns and implementing a search input for filtering tables by name.
- [ ] The Table Editor currently allows creating and viewing tables. Enhance the table editor by implementing client-side sorting and filtering for the displayed table data. Also, add a search input to filter the list of tables in the sidebar.
- [ ] Enhance the Table Editor's table view to include client-side sorting and filtering options for columns to improve data exploration.
- [ ] In the Table Editor, add a search input to the table list sidebar to filter tables by name.
- [ ] Allow users to edit existing table schemas in the Table Editor. This includes renaming tables, adding new columns, and modifying existing column definitions (e.g., changing type, adding constraints).
In the Table Editor, allow users to edit existing table schemas. Implement functionality to rename tables, add new columns, and modify column definitions (type, constraints) after table creation.
In the Table Editor component, enhance the table view to allow client-side sorting of columns. Add clickable headers that toggle ascending/descending sort order for each column.
- [ ] Implement a confirmation dialog before deleting a table in the Table Editor to prevent accidental data loss.
- [ ] In the Table Editor, enhance the table view with client-side sorting and filtering options for columns to improve data exploration.
- [ ] In the Table Editor, implement a modal or inline form to allow users to insert new rows into the selected table. This form should dynamically generate input fields based on the table's columns.
- [ ] Enhance the Table Editor page to allow users to edit existing table schemas, including renaming tables, adding/modifying columns, and setting constraints.
- [ ] In the Table Editor, add functionality to allow users to edit existing table schemas, including renaming tables, adding new columns, and modifying existing column definitions.
- [ ] In the Table Editor, enhance the 'Create New Table' form to allow users to specify constraints for columns, such as NOT NULL, UNIQUE, and DEFAULT values.
- [ ] In the Table Editor page, allow users to edit column definitions (e.g., rename, change type, add constraints) after table creation.
- [ ] In the Table Editor page, enhance the table view with sorting and filtering options for columns.
- [ ] In the Table Editor page, implement a modal or inline form to insert new rows into the selected table.
- [ ] In the Table Editor page, add a search input to filter the list of tables by name.
- [ ] In the Table Editor's table view, add client-side filtering options for columns to improve data exploration.

## Phase 4: Developer Experience
- [x] Implement robust Docker and Docker Compose support for simplified deployment, ensuring native build compatibility and volume mounts for SQLite data persistence.
- [ ] Integrate realtime database functionality using WebSockets or HTTP Long-Polling. This will allow the frontend to receive live updates when data changes in the database, enhancing the user experience for collaborative features or live dashboards.
- [ ] CaraBase Client JS library (Axios wrapper mapping to `/rest/v1`).
- [ ] Realtime Database functionality via HTTP Long-Polling or standard WebSockets integration.
- [ ] Advanced graphical column editor (Foreign Keys, Triggers, Views). 

### Next Prompts, Never execute. 