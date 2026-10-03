# Installation & Hosting

CaraBase is designed to be easily hosted either as a bare-metal Node.js application or inside a Docker container.

---

## Local Development (Source)

If you are developing CaraBase or running it locally on your machine:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Stack**
   ```bash
   npm run scuttle
   ```
   This concurrently launches:
   - **Express API Backend**: Running on `http://localhost:5353` with TSX file watching and auto-reload.
   - **Vite React Frontend**: Running on `http://localhost:5454` with Hot Module Replacement (HMR).

   ::: tip Individual Component Scripts
   You can also run components separately:
   - Backend only: `npm run dev:server` (port 5353)
   - Frontend only: `npm run dev` (port 5454)
   :::

---

## Production Build (Bare Metal)

1. **Build the Production Artifacts**
   ```bash
   npm run build
   ```
   This command compiles the React frontend into `dist/` and bundles the Express backend into `dist/server.cjs` using `esbuild`.

2. **Run the Production Server**
   ```bash
   npm start
   ```
   Serves the unified frontend and backend on port `5353`.

---

## Docker Deployment (Recommended)

Running CaraBase via Docker ensures that native SQLite extensions (`better-sqlite3-multiple-ciphers`) are compiled and isolated inside the container environment.

::: code-group

```bash [Docker Compose (Easiest)]
# 1. Create the host data directory
mkdir -p ./data

# 2. Build and start in detached mode
docker-compose up -d --build

# 3. Stop containers when needed
docker-compose down
```

```bash [Standard Docker CLI]
# 1. Build the image
docker build -t carabase .

# 2. Run the container with volume bind and encryption key
docker run -d \
  -p 5353:5353 \
  -v ./data:/app/data \
  -e DB_ENCRYPTION_KEY="your-secure-key" \
  carabase
```

:::

> [!IMPORTANT]
> **Data Persistence & Encryption-at-Rest**
> The `./data` directory must be mounted as a volume so your database files persist across container restarts. `DB_ENCRYPTION_KEY` is **strictly required** in production; CaraBase will refuse to start without it to ensure your SQLite files are encrypted using SQLCipher AES-256.

---

## Living Documentation Suite

CaraBase includes a complete living documentation suite powered by VitePress, adhering to our **[Doc Automation](https://github.com/ClawStackStudios/CaraBase/blob/main/.agents/skills/doc-automation/SKILL.md)** protocols.


::: code-group

```bash [npm run docs:dev]
# Start interactive documentation server on port 5173
npm run docs:dev
```

```bash [npm run docs:build]
# Compile static HTML and audit internal links
npm run docs:build
```

```bash [npm run docs:preview]
# Preview compiled production documentation
npm run docs:preview
```

:::

---

## Public Access & Security

If you intend to expose CaraBase to the internet, we strongly recommend using Cloudflare Tunnels rather than opening incoming firewall ports. 
CaraBase natively supports `cloudflared` to provide zero-port-exposure hosting, explicit CORS locking, and public file sharing URLs.
Please read the [Cloudflare Tunnel Setup Guide](./cloudflare-tunnel.md) for quick deployment instructions.
