# Storage Engine & Membrane

CaraBase provides an integrated file storage engine that handles physical asset uploading, metadata tracking, and cryptographic public sharing without requiring external services like AWS S3.

---

## Uploads & Asset Security

Authenticated users upload files via `multipart/form-data` to `/api/system/storage/upload`.

### Security Hardening & MIME Validation
All uploads pass through Multer configured with strict MIME inspection:
- **Executable Blocking**: Dangerous MIME types (`application/x-msdownload`, `application/x-executable`, `application/x-sh`) are immediately rejected.
- **Physical Isolation**: Uploaded files are saved to `data/storage/` named with system-generated UUIDs, entirely neutralizing directory traversal and path collision injection attacks.
- **Metadata Persistence**: File size, original name, detected MIME type, and physical path are securely tracked in the `_carabase_storage_files` system table.

::: code-group

```bash [cURL Upload]
curl -X POST "http://localhost:5353/api/system/storage/upload" \
  -H "Authorization: Bearer api-your-session-token" \
  -F "file=@/path/to/image.png"
```

```typescript [TypeScript / React SDK]
import { createClient } from '@carabase/sdk';

const carabase = createClient({
  baseUrl: 'http://localhost:5353',
  apiKey: 'api-your-session-token'
});

const { data, error } = await carabase.storage.upload(fileBlob);
```

:::

---

## The ShellProxy Membrane

To securely share physical assets with the public internet without opening direct access to disk, CaraBase utilizes a cryptographic boundary called the **ShellProxy Membrane**.

You cannot access a file by guessing its physical path or its internal UUID. Direct requests to `/storage/v1/file/:id` without an Authorization header return `401 Unauthorized`. Instead, users must explicitly generate a **Share Hash**.

### Generating a Share Hash
1. The client requests a share link via `POST /api/system/storage/:fileId/shares`, optionally passing an expiration timestamp (`share_expires_at`).
2. The server generates a cryptographic 64-character hex string (`share_hash`).
3. This hash is persisted in the `_carabase_storage_shares` table and mapped to the underlying file.

::: code-group

```bash [Create Expiring Share]
curl -X POST "http://localhost:5353/api/system/storage/FILE_UUID/shares" \
  -H "Authorization: Bearer api-your-session-token" \
  -H "Content-Type: application/json" \
  -d '{"expiresInSeconds": 3600}'
```

:::

---

## Dual-Serve Content Negotiation

When a request reaches the public ShellProxy at `/storage/v1/file/:share_hash`, the membrane adapts based on the client's `Accept` HTTP header:

- **Browser Preview (`Accept: text/html`)**: If a user opens the link in a web browser, the membrane renders a responsive Tailwind-styled HTML interface displaying file metadata, image preview (for supported image formats), and a secure download button.
- **Raw Binary Stream (Direct Download / API)**: When accessed without an HTML accept header, the membrane streams raw binary bytes with strict `X-Content-Type-Options: nosniff` security headers to eliminate MIME-sniffing and cross-site scripting (XSS) risks.

---

## Expiration & Immediate Revocation

Because share hashes reside in SQLite, they can be revoked instantly via `DELETE /api/system/storage/shares/:shareHash`.

Once revoked, or if the `share_expires_at` TTL lapses:
- The ShellProxy membrane silently drops the request.
- The server responds with `404 Not Found` without revealing whether the underlying physical file exists.
