# Setup Wizard Walkthrough

When you start CaraBase for the very first time with an `ADMIN_TOKEN`, the database is completely empty—it doesn't even have the core system tables required to function. 

To resolve this, CaraBase intercepts your first visit to `http://localhost:5353` and redirects you to the Setup Wizard.

## Step 1: Admin Authentication

You will be greeted by a minimalist lock screen.
- Enter the `ADMIN_TOKEN` you generated and placed in your `.env` file.
- The UI will SHA-256 hash your token locally in the browser and send the hash to the server to verify your identity.

## Step 2: System Initialization

Once authenticated, CaraBase will present a one-click button to **Initialize System Schemas**.

Clicking this button executes a bundled SQL migration script against your SQLite database. This script generates the required foundational tables:
- `_carabase_api_keys`
- `_carabase_policies` 
- `_carabase_custom_endpoints`
- `_carabase_storage`
- `_carabase_storage_shares`
- `users`
- `agent_keys`

*Note: Because you provided an `ADMIN_TOKEN`, the system has already silently inserted the `superlobster` root user into the `users` table during boot.*

## Step 3: Welcome to the Dashboard

Once the initialization succeeds, the wizard will immediately transition you into the SuperAdmin Dashboard.

From here, your CaraBase instance is fully operational. 

### What to do next:
1. **Create your first table**: Navigate to the Table Editor and create a new table for your application data.
2. **Review your Agent Keys**: Navigate to the API Keys section. You'll notice a pre-generated "Server Agent" key (`lb-`) which you can use for backend service integrations.
3. **Write an RLS Policy**: Secure your new table by writing a Row-Level Security policy in the Policies tab.
