# Storage Engine & Membrane

CaraBase provides an integrated file storage engine that handles physical asset uploading, metadata tracking, and cryptographic public sharing without requiring external services like AWS S3.

## Uploads and Asset Tracking

When an authenticated user uploads a file, CaraBase processes the `multipart/form-data` payload via the `/api/system/storage/upload` endpoint.
- The physical binary is securely saved to disk inside the `data/storage/` directory, named with a system-generated UUID to prevent directory traversal attacks.
- The metadata (original filename, MIME type, size, ownership, and physical path) is logged in the `_carabase_storage_files` system table.

## The ShellProxy Membrane

To securely share physical assets with the public internet, CaraBase utilizes a cryptographic proxy boundary called the **ShellProxy Membrane**.

You cannot access a file by guessing its physical path or its internal UUID. Instead, users must explicitly generate a **Share Hash**.

1. The client requests a share link via the API, optionally passing an expiration time (`share_expires_at`).
2. The server generates a cryptographic 64-character hex string (`share_hash`).
3. This hash is persisted in the `_carabase_storage_shares` table and mapped to the underlying file.

### Dual-Serve Content Negotiation

When a request hits the public ShellProxy at `/storage/v1/file/:share_hash`, the membrane adapts based on the client's `Accept` HTTP header:

- **Browser Preview (`Accept: text/html`)**: If a user opens the link in a web browser, the membrane renders a beautiful, Tailwind-styled HTML interface. It displays the file's metadata and provides an embedded preview (if it's an image) or a prominent "Download" button.
- **Raw Binary Stream (Automated / programmatic access)**: If the `Accept` header does not request HTML, or if a client downloads the file directly, the membrane streams the raw binary bytes. 

To prevent Cross-Site Scripting (XSS) and MIME-sniffing vulnerabilities, all raw binary responses are forced to include strict `X-Content-Type-Options: nosniff` headers.

### Expiration and Revocation

Because hashes are tracked in SQLite, they can be instantly revoked. Once revoked, or if the `share_expires_at` TTL lapses, the ShellProxy membrane silently drops the request, returning a `404 Not Found` without revealing whether the underlying file still exists.
