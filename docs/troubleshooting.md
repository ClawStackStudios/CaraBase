# Troubleshooting and FAQ

## Common Issues

### 1. I forgot my `ADMIN_TOKEN`
Because the `ADMIN_TOKEN` is defined in your `.env` file, it is never permanently lost. Simply open your `.env` file on the server to retrieve it. If you need to change it, update the value in `.env` and restart the Docker container (`docker compose restart carabase`).

### 2. My Realtime events aren't firing
Remember that CaraBase uses an **Application-Level Event Bus**, not SQLite WAL hooking. 
- Realtime events are *only* triggered by mutations made through the standard `/rest/v1/:table` endpoints.
- If you use the **SQL Editor**, **Custom Dynamic APIs**, or backend `systemApi.post('/query')` calls, events **will not** be emitted.

### 3. I receive a 403 Forbidden when inserting a row
This is almost always a **Row-Level Security (RLS)** violation.
1. Check that the table has an `INSERT` policy.
2. Verify that the data you are inserting satisfies the policy. CaraBase performs a post-insert transactional check; if the newly inserted row doesn't match your policy (e.g., you tried to insert a row for `user_id = 2` but you are `user_id = 1`), the transaction rolls back.

### 4. My custom endpoint isn't applying my RLS policy
> [!WARNING]
> This is a known architectural gap. Custom Dynamic APIs currently evaluate without the `rlsContext.run()` wrapper, meaning `auth_uid()` resolves to `null`. Do not rely on identity-bound RLS policies for custom endpoints; use static schema filters instead.

### 5. Docker container port mapping fails
If you see `bind: address already in use` for port 5353:
1. Check if another service is using port 5353 (`lsof -i :5353` on macOS/Linux).
2. If you are using Cloudflare Tunnels (as shown in our [Cloudflare guide](/cloudflare-tunnel)), you do not need to expose port 5353 on the host at all. Simply remove the `ports` mapping from your `docker-compose.yml`.

## Getting Help

If you encounter an issue not covered here, please open an issue on the [CaraBase GitHub Repository](https://github.com/ClawStackStudios/CaraBase).
