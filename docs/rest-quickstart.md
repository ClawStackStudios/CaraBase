# REST API Quickstart

CaraBase automatically generates a RESTful API for every table you create. This API is accessible at `/rest/v1/:table`.

If you prefer not to use the official SDKs, you can interact with CaraBase using standard HTTP requests from any language.

## Authentication

Every request to the data API must include an Authorization header containing a valid `api-` session token. (You can generate this token by exchanging a `hu-` or `lb-` key at `/api/auth/token`).

```http
Authorization: Bearer api-your-session-token
```

## Basic CRUD Operations

Assuming you have a table named `posts`:

### Read (GET)
```bash
curl -X GET "http://localhost:5353/rest/v1/posts?limit=10" \
  -H "Authorization: Bearer api-your-session-token"
```
**Filters:** You can append query parameters to filter data. For example, `?status=eq.published` translates to `WHERE status = 'published'`.

### Insert (POST)
```bash
curl -X POST "http://localhost:5353/rest/v1/posts" \
  -H "Authorization: Bearer api-your-session-token" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello World", "content": "My first post."}'
```
*Note: A successful insert returns the newly created row.*

### Update (PATCH)
```bash
curl -X PATCH "http://localhost:5353/rest/v1/posts?id=eq.1" \
  -H "Authorization: Bearer api-your-session-token" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```
*Note: You must provide a filter (e.g., `?id=eq.1`) so CaraBase knows which row(s) to update.*

### Delete (DELETE)
```bash
curl -X DELETE "http://localhost:5353/rest/v1/posts?id=eq.1" \
  -H "Authorization: Bearer api-your-session-token"
```

## RLS Enforcement
Every request made via the REST API is strictly evaluated against your Row-Level Security (RLS) policies. If an `INSERT`, `UPDATE`, or `DELETE` violates a policy, the API will return a `403 Forbidden` error and rollback the transaction.
