# Generate Your Secrets

CaraBase is designed to be highly secure by default. It relies on two fundamental cryptographic secrets that you must provide before the server will start. 

> [!CAUTION]
> Never commit these secrets to version control, and ensure they are injected securely into your environment (e.g., via Docker Secrets, `.env` files, or cloud provider environment variables).

## 1. The Database Encryption Key (`DB_ENCRYPTION_KEY`)

CaraBase does not store your data in plaintext. It uses **SQLCipher** to encrypt the underlying SQLite database file (`carabase.sqlite`) at rest using 256-bit AES encryption.

The `DB_ENCRYPTION_KEY` is the master key that unlocks this file.

### How to generate it:
You must provide an exact 64-character hexadecimal string. Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Important constraints:
- If you launch CaraBase in `production` mode and the `DB_ENCRYPTION_KEY` is missing, the server will **fatally crash** and refuse to boot. This prevents accidental plaintext deployments.
- If you lose this key, your database file becomes a useless block of random bytes. **Back up this key.**
- **Auto-Migration:** If you attach a `DB_ENCRYPTION_KEY` to an existing plaintext CaraBase installation, the server will detect it and automatically encrypt the database in-place on boot.

## 2. The Admin Token (`ADMIN_TOKEN`)

The `ADMIN_TOKEN` is your master password for the CaraBase SuperAdmin Dashboard. 

### How to generate it:
You can use any strong, random string. We recommend a 48-byte base64 encoded string:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### Important constraints:
- **Optional but Recommended:** If you omit this token, the SuperAdmin dashboard (`/admin-login`) will return a `503 Service Unavailable` error and be completely inaccessible.
- **Client-Side Hashing:** When you type this token into the browser, CaraBase hashes it using SHA-256 *before* sending it over the network. The server compares the hash against the hashed environment variable. The raw token never leaves your machine.
- **The SuperLobster:** When the server boots with an `ADMIN_TOKEN`, it automatically provisions a system-level user known as the `superlobster` (with a `superadmin` role). This allows you to interact with your data API as a superuser without having to create a manual account.
