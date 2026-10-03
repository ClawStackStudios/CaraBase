# Storage Engine & Membrane

CaraBase provides an integrated file storage engine that handles physical asset uploading, metadata tracking, and cryptographic public sharing without requiring external services like AWS S3.

> [!NOTE] 
> CaraBase deliberately avoids traditional S3-like "buckets" in favor of a single unified storage pool. Furthermore, Row-Level Security (RLS) is intentionally decoupled from physical file storage.

## The File Upload Journey (The Membrane)

File uploads pass through a rigorous, multi-layered "membrane" before persisting:

1. **Pre-flight Check**: The system checks the extension and MIME against a dangerous blocklist (e.g., `.exe`, `.sh`, `.elf`, `application/x-executable`).
2. **Physical Write**: The file is written to the `data/storage/` directory using a randomized UUID (`[uuid].[ext]`) to prevent directory traversal.
3. **Magic Bytes Validation**: CaraBase reads the first 4 bytes of the physical file. If it detects `4D5A` (Windows MZ), `7F454C46` (Linux ELF), or `2321` (Shell `#!`), it forcefully unlinks (deletes) the file from disk immediately.
4. **Metadata Persistence**: Only after surviving the membrane is the file metadata registered in `_carabase_storage`. If the DB insert fails (e.g., disk full), a catch block unlinks the orphaned filesystem file to prevent storage leaks.

## Storage Architecture & Access Control

CaraBase's storage is a flat, unified system:
- **Filesystem**: Assets are physically saved in the `data/storage/` directory.
- **Database (The Index)**: Metadata (MIME, original name, size) is recorded in the `_carabase_storage` system table.

### Access Control (RLS vs. Files)
RLS policies **do not apply** to storage. The dynamic REST engine (`/rest/v1/:table`) strictly blocks queries against core system tables (including `_carabase_storage`). Instead, storage relies on standard authentication:
- **Internal files** (`/storage/v1/file/:id`) require a valid session/API token in the Authorization header.
- **Share Hashes** are completely public but protected by time-to-live (TTL) bounds and dedicated rate limiters.
- **Management actions** (deletion, share creation) strictly require the `admin` or `superadmin` role.

## MIME Handling & Safe Delivery

When delivering raw files, CaraBase enforces strict headers to prevent browsers from executing malicious payloads disguised as safe MIME types (MIME-sniffing attacks).

- `Content-Type`: Set to the trusted DB-stored `mime_type`.
- `Content-Disposition: inline`: Allows images/videos to render directly in `<img>` tags.
- `X-Content-Type-Options: nosniff`: Critical security header preventing the browser from interpreting the file as HTML or JavaScript if the MIME type is misrepresented.

## Share Hash Mechanics (ShellProxy Membrane)

Share Hashes allow controlled public access to files without exposing the underlying storage ID. 

> [!IMPORTANT]
> The Share Hash is not just a link; it's a structural membrane (`GET /storage/v1/share/:share_hash`) that provides Content Negotiation, analytics, and DDoS protection.

- **Creation**: Admins invoke `POST /api/admin/storage/:id/shares`. CaraBase generates a secure 64-character hex crypto string (`crypto.randomBytes(32).toString('hex')`) and maps it to the file in `_carabase_storage_shares` with an optional TTL.
- **Validation Gates**:
  1. **Regex Drop**: Drops any request not matching exactly 64 hex characters silently, deflecting brute-force scanners.
  2. **TTL Check**: Verifies the expiration is null or in the future.
  3. **Dedicated Rate Limiter**: Limits access to 100 requests per minute per IP + Share Hash combination to prevent bandwidth exhaustion.

### Dual-Serve Content Negotiation
- **Browser Preview (`Accept: text/html`)**: If a user opens the link in a web browser, the membrane renders a responsive Tailwind-styled HTML interface displaying file metadata, an image/video preview, and a secure download button.
- **Raw Binary Stream**: When accessed without an HTML accept header (e.g. directly in an `<img>` tag or via an automated tool), the membrane bypasses the HTML shell and streams the raw bytes with `nosniff` protections.
