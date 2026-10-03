# Error Codes

CaraBase uses standard HTTP status codes combined with JSON error bodies to indicate the result of your API requests.

## Standard Error Format

When an error occurs, CaraBase returns a JSON response in the following format:

```json
{
  "error": "Short Error Code",
  "message": "Human-readable description of what went wrong."
}
```

## HTTP Status Codes

| Code | Meaning | Description |
|---|---|---|
| `400` | Bad Request | The request was malformed. E.g., invalid JSON body, missing required fields, or invalid query parameters. |
| `401` | Unauthorized | No valid API key or session token was provided. |
| `403` | Forbidden | The authenticated user does not have permission to perform this action. This is the standard response for **Row-Level Security (RLS)** violations. |
| `404` | Not Found | The requested route, table, or resource does not exist. |
| `429` | Too Many Requests | The client has exceeded the rate limit. |
| `500` | Internal Server Error | An unexpected error occurred on the server. If `NODE_ENV=development`, the response may include a stack trace. |

## Common Error Scenarios

### RLS Violation (403)
If you attempt to `INSERT`, `UPDATE`, or `DELETE` a row that you are not authorized to mutate according to the table's RLS policy, CaraBase will return a `403 Forbidden` and instantly rollback the transaction.

### Rate Limiting (429)
CaraBase includes built-in rate limiters (e.g., 500 requests per minute globally). If you hit this limit, wait a few seconds and try again. 

### Invalid MIME Type (400)
If you attempt to upload an executable file (`.exe`, `.sh`) to the Storage Engine, the membrane will reject it with a `400 Bad Request` citing a dangerous MIME type.
