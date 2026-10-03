# Quickstart

Get CaraBase up and running in under 5 minutes. This guide walks you through launching the database, opening the dashboard, and making your first API request.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Docker** and **Docker Compose**
- **Node.js** (v18 or higher) — *Optional, but useful for generating secure tokens.*

## 2. Generate Your Secrets

CaraBase requires two cryptographic secrets to operate securely. Do not skip this step!

Run the following commands in your terminal to generate secure, random strings:

```bash
# Generate the DB_ENCRYPTION_KEY (64-character hex string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate the ADMIN_TOKEN (base64 string)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Save both of these output strings. You will need them in the next step.

## 3. Configure Your Environment

Create a new directory for your CaraBase instance, and create a `.env` file inside it:

```bash
mkdir carabase-server
cd carabase-server
touch .env
```

Open the `.env` file and paste the secrets you generated:

```env
# The 64-character hex string you generated
DB_ENCRYPTION_KEY="your_64_character_hex_string_here"

# The base64 string you generated
ADMIN_TOKEN="your_base64_string_here"

# Standard configuration
NODE_ENV="production"
PORT=5353
```

> [!IMPORTANT]
> The `DB_ENCRYPTION_KEY` encrypts your SQLite database at rest using SQLCipher. If you lose this key, your data is **permanently unrecoverable**.

## 4. Launch CaraBase

Create a `docker-compose.yml` file in the same directory:

```yaml
version: '3.8'

services:
  carabase:
    image: ghcr.io/clawstackstudios/carabase:latest
    container_name: carabase
    ports:
      - "5353:5353"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    env_file: .env
```

Launch the container:

```bash
docker compose up -d
```

Verify that the server is healthy by checking the logs:

```bash
docker compose logs -f
```
You should see a message indicating the server is listening on port 5353.

## 5. Open the Dashboard

Open your browser and navigate to:

```text
http://localhost:5353
```

Because this is a fresh installation, you will automatically be redirected to the **Setup Wizard**.

1. When prompted for the Admin Token, paste your `ADMIN_TOKEN`.
2. Follow the wizard to initialize the system schemas.
3. Once complete, you will be redirected to the CaraBase SuperAdmin Dashboard!

## Next Steps

Now that your server is running, it's time to build your app.

- [Create your first Table](/tables)
- [Connect your React App](/react-integration)
- [Learn about Row-Level Security](/rls)
