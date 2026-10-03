# Security Checklist

Before exposing your CaraBase instance to the internet or migrating from local development to production, complete this security checklist to ensure your data remains protected.

## 1. Environment & Network Security

- [ ] **Run behind a reverse proxy or tunnel**: Never expose port 5353 directly to the open internet. Use Cloudflare Tunnels (recommended) or a reverse proxy like Nginx/Caddy with SSL termination.
- [ ] **Set `NODE_ENV=production`**: This enforces production-grade behaviors, such as suppressing stack traces in API errors.
- [ ] **Set `ENFORCE_HTTPS="true"`**: If you are running behind a reverse proxy that handles HTTPS, this tells CaraBase to mark the Admin dashboard `cb_admin_session` cookie as `Secure`, preventing it from being intercepted over plaintext HTTP.
- [ ] **Configure `CORS_ORIGINS`**: Explicitly whitelist the domain names of your frontend applications. This prevents unauthorized domains from making API requests to your database from users' browsers.

## 2. Secrets Management

- [ ] **Use a strong `DB_ENCRYPTION_KEY`**: Ensure your SQLite database is encrypted with a 64-character hex key. *Do not use a password or short string.*
- [ ] **Use a strong `ADMIN_TOKEN`**: Ensure your SuperAdmin dashboard is protected by a long, random string. *Do not use "admin123".*
- [ ] **Never commit `.env`**: Ensure your `.env` file is added to your `.gitignore`.

## 3. Row-Level Security (RLS)

- [ ] **Enable RLS on all sensitive tables**: Do not rely on frontend routing to hide data. Write RLS policies for every table containing user data.
- [ ] **Test public access**: Verify that a request without an `Authorization` header cannot read or write to tables unless explicitly allowed by an RLS policy (e.g. `public = true`).

## 4. Operational Best Practices

- [ ] **Automate Backups**: Ensure `BACKUP_DIR` and `BACKUP_RETENTION_COUNT` are configured and verify backups are actually being created.
- [ ] **Monitor Audit Logs**: Periodically log into the SuperAdmin dashboard to review the Audit Logs for unauthorized access attempts or suspicious token revocations.
- [ ] **Isolate Agent Keys**: If you generate an `lb-` Agent Key for a background worker, grant it only the specific permissions it needs (e.g., Read-only, or restricted to a specific table via its parent user's RLS policies). Do not give full CRUD access to an agent unless absolutely necessary.
