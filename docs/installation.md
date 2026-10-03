# Installation & Hosting

CaraBase is packaged as a single unified container (combining both the React frontend and the Express/SQLite backend). You can host it anywhere that runs Docker, or run it directly from source on bare metal.

## 1. Docker Compose (Recommended)

Docker Compose is the easiest way to deploy CaraBase, as it cleanly manages your environment variables and persistent volume mounts.

Create a `docker-compose.yml` file and a `.env` file in your project directory:

::: code-group

```yaml [docker-compose.yml]
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

```env [.env]
# Ensure you generate these secrets securely!
DB_ENCRYPTION_KEY="your_64_character_hex_string"
ADMIN_TOKEN="your_base48_string"

NODE_ENV="production"
PORT=5353
```

:::

Then, launch the stack:

```bash
docker compose up -d
```

## 2. Docker CLI

If you prefer to use the standard Docker CLI without Compose, you can run the image directly. Ensure you pass your environment variables and mount the `/app/data` volume so your database survives container restarts.

```bash
docker run -d \
  --name carabase \
  -p 5353:5353 \
  -v ./data:/app/data \
  -e DB_ENCRYPTION_KEY="your_64_character_hex_string" \
  -e ADMIN_TOKEN="your_base48_string" \
  -e NODE_ENV="production" \
  ghcr.io/clawstackstudios/carabase:latest
```

> [!WARNING]
> Do not omit the `-v ./data:/app/data` volume mount. Without it, your SQLite database and all uploaded files will be destroyed instantly when the container stops or updates.

## 3. Local Development (Source)

If you are developing CaraBase itself or prefer running bare metal Node.js:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env` and fill in your keys.

3. **Start the Development Stack**
   ```bash
   npm run scuttle
   ```
   This concurrently launches the Express API Backend (port `5353`) and the Vite React Frontend (port `5454`) with Hot Module Replacement (HMR).

### Production Build (Bare Metal)

To build and run from source in production mode:

1. **Build the Artifacts**
   ```bash
   npm run build
   ```
   This compiles the React frontend into `dist/` and bundles the backend into `dist/server.cjs`.

2. **Run the Server**
   ```bash
   npm start
   ```
   Serves the unified frontend and backend on port `5353`.

## Next Steps

Once your server is running, navigate to `http://localhost:5353` in your browser. 
Read the [First Login & Roles](/first-login) guide to understand how to access the system.
