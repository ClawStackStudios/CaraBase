# Custom Dynamic API Builder

While CaraBase automatically provides generic `/rest/v1/:table` routes for every table you create, there are times when you need explicit, predefined backend routes that execute complex logic, sanitize output, or lock down specific columns.

The **Custom Dynamic REST API Generator** allows you to build these custom endpoints visually from the dashboard.

## Dynamic Route Registration

Endpoints are defined in the `_carabase_custom_endpoints` system table. When the Express server boots (or when a new endpoint is created via the dashboard), it registers an interceptor.

Any request hitting `/rest/v1/custom/:path` will trigger the dynamic interceptor. CaraBase looks up the associated configuration, evaluates the security context, and executes the pre-configured schema.

## Endpoint Schema Configuration

When creating an endpoint, you configure a strict schema:

1. **Path & Method:** Determine the URL structure (e.g., `GET /test-users`)
2. **Target Table:** The underlying SQLite table to query.
3. **Column Projection:** Explicitly define which columns the API is allowed to return. This is critical for preventing the leakage of sensitive data (like password hashes or private keys).
4. **Predefined Filters:** Hardcode `WHERE` clauses into the endpoint (e.g., `status = 'active'`). Clients cannot override these filters.

## Sanitization and Security

The Custom API Builder respects the exact same Opaque Token Architecture and Transactional RLS Engine as the generic REST pipeline.

If a client hits your custom `GET /rest/v1/custom/active-users`, CaraBase will:
1. Validate their API key and Session Token.
2. Apply the table's RLS policies via `rlsContext`.
3. Append your predefined schema filters.
4. Execute the query.
5. **Sanitize the Output:** CaraBase iterates over the result set and dynamically strips out any columns that were not explicitly permitted in your endpoint's configuration.

This ensures that even if an RLS policy grants access to a row, the custom endpoint can serve as a secondary data-omission membrane.
