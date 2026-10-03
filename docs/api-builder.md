# Custom Dynamic API Builder

While CaraBase automatically provides generic `/rest/v1/:table` routes for every table you create, there are times when you need explicit, predefined backend routes that execute complex logic, sanitize output, enforce static filters, or lock down specific columns.

The **Custom Dynamic REST API Generator** allows you to build and manage these custom endpoints visually from the dashboard or programmatically via the System API.

## Dynamic Route Architecture

Endpoints are persisted in the `_carabase_custom_endpoints` SQLite table. Any incoming request hitting `/rest/v1/custom/:path` triggers CaraBase's dynamic routing interceptor:

```
Client Request
      │
      ▼
[/rest/v1/custom/:path]
      │
      ├─► [Public API Guard] (Validates ls- / api- / lb- token)
      │
      ├─► [Schema Lookup] (SELECT FROM _carabase_custom_endpoints)
      │
      ├─► [Body Validation] (Enforces required fields and types)
      │
      ├─► [RLS Engine] (Evaluates auth_uid() / auth_role())
      │
      ├─► [Static Builder Filters] (Appends AND column OP value)
      │
      ├─► [Column Projection] (Filters response to permitted columns)
      │
      ▼
JSON Response
```

## Endpoint Schema Definition

When creating an endpoint, you define a JSON schema configuration:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Human-readable label (e.g. `"Active Public Users"`). |
| `path` | `string` | Relative path matched under `/rest/v1/custom/` (e.g. `"active-users"`). |
| `method` | `string` | HTTP method: `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`. |
| `table_name` | `string` | Target SQLite table. Must match `/^[a-zA-Z0-9_]+$/`. |
| `schema.columns` | `string[]` | Permitted columns in response. Strips all unlisted columns. |
| `schema.validation` | `Rule[]` | Array of `{ field, required: boolean, type: 'number' \| 'boolean' }`. |
| `schema.filters` | `Filter[]` | Array of `{ field, operator: '=' \| '!=' \| '>' \| '<' \| '>=' \| '<=' \| 'LIKE', value }`. |
| `schema.pagination` | `boolean` | Enables `?limit=` and `?offset=` query parameters. |

## Programmatic Management (System API)

All custom endpoint management routes live under `/api/system/endpoints` and require an authenticated token with the `admin` or `superadmin` role.

::: code-group

```bash [Create Custom Endpoint]
curl -X POST http://localhost:5353/api/system/endpoints \
  -H "Authorization: Bearer api-your-admin-session-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Public Active Users",
    "path": "public-users",
    "method": "GET",
    "table_name": "users",
    "schema": {
      "columns": ["id", "username", "created_at"],
      "filters": [
        { "field": "is_active", "operator": "=", "value": 1 }
      ],
      "pagination": true,
      "defaultLimit": 20
    }
  }'
```

```bash [List Custom Endpoints]
curl http://localhost:5353/api/system/endpoints \
  -H "Authorization: Bearer api-your-admin-session-token"
```

```bash [Delete Custom Endpoint]
curl -X DELETE http://localhost:5353/api/system/endpoints/ENDPOINT_UUID \
  -H "Authorization: Bearer api-your-admin-session-token"
```

:::

## Querying Dynamic Endpoints

Once registered, clients query the endpoint directly at `/rest/v1/custom/:path` using standard public keys (`ls-`) or session tokens (`api-`):

::: code-group

```bash [cURL]
curl "http://localhost:5353/rest/v1/custom/public-users?limit=10" \
  -H "apikey: ls-your-public-key"
```

```typescript [TypeScript / React]
import { createClient } from 'carabase-js';

const cb = createClient('http://localhost:5353', 'ls-your-public-key');

// Fetch via native client fetch
const response = await fetch('http://localhost:5353/rest/v1/custom/public-users?limit=10', {
  headers: {
    'apikey': 'ls-your-public-key'
  }
});
const users = await response.json();
```

:::

## Multi-Layer Security Guarantees

1. **Table Integrity**: Table names are validated against strict regex (`/^[a-zA-Z0-9_]+$/`) to prevent dynamic SQL injection in table selectors.
2. **Column Projection**: Even if an underlying SQLite row contains sensitive columns (such as `password_hash` or `auth_token`), CaraBase strips all unpermitted columns before JSON serialization.
3. **RLS Composition & Active Constraint**: 
   > [!WARNING]
   > **RLS Context Gap (Security Vector):** Currently, Custom API Builder endpoints evaluate Row-Level Security (RLS) policies without the `rlsContext.run()` wrapper. This means that UDFs like `auth_uid()` and `auth_role()` will evaluate to `null` (anon) during custom endpoint execution. Do not rely on identity-bound RLS policies for custom endpoints until this gap is patched. Use static schema filters instead.
4. **Audit Trail**: Every endpoint creation (`ENDPOINT_CREATED`) and deletion (`ENDPOINT_DELETED`) is immutably logged to `audit_logs` with actor UUID, IP address, and timestamp.

