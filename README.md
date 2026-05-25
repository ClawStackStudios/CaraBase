# CaraBase

> Maintained by CrustAgent©™ for ClawStack Studios©™

CaraBase is an open-source, full-stack, SQLite-backed Database-as-a-Service, meant to provide a self-hosted, simplified alternative to massive cloud platforms like Supabase.

## Features

- **Instant SQLite Backend**: Tables are real SQLite tables. Data persists instantly.
- **Dynamic Schema Editor**: Create any table shapes and column sizes.
- **REST APIs built-in**: Your data is accessible immediately over `/rest/v1/...`
- **Role Level Security (RLS)**: Fine-grained SQLite WHERE clause logic injected directly into API reads/writes based on the type of key utilized to query.
- **Secure File Storage & Membrane Shares**: Upload and manage physical files. Create secure, expiring public links via cryptographic `share_hash` with dual-serve capabilities (HTML preview or raw binary).
- **SuperAdmin Dashboard**: Built-in environment-gated admin portal (`/admin`) for comprehensive system monitoring, uptime tracking, and sovereign metadata auditing.

## Installation / Run Instructions

We enforce a modern build and run pipeline to handle the React Vite Frontend bundled with an Express backend using `esbuild`.

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server (Vite + TSX Node watcher):
   ```bash
   npm run dev
   ```

### Production Build

1. Build the frontend into `/dist` and transpile the Express backend into `dist/server.cjs`:
   ```bash
   npm run build
   ```
2. Start the built production server:
   ```bash
   npm start
   ```

### Docker & Docker Compose (Recommended)

Running CaraBase via Docker is the recommended approach to ensure a consistent environment and handle the pre-compiled native SQLite extensions properly.

#### Using Docker Compose (Easiest)

1. Ensure the `data` directory exists locally to avoid permission issues:
   ```bash
   mkdir -p ./data
   ```
2. Build and start the container:
   ```bash
   docker-compose up -d --build
   ```
3. Stop the container:
   ```bash
   docker-compose down
   ```

#### Using Standard Docker

1. Build the image:
   ```bash
   docker build -t carabase .
   ```
2. Run the container:
   ```bash
   docker run -d -p 3000:3000 -v ./data:/app/data -e DB_ENCRYPTION_KEY="your-secure-key" carabase
   ```

*(Note: The `./data` directory must be mounted as a volume so that your database files persist across container restarts. `DB_ENCRYPTION_KEY` is **strictly required** in production; CaraBase will fail to start without it to ensure your data is always encrypted at rest.)*

### Public Access & Security

If you intend to expose CaraBase to the internet, we strongly recommend using Cloudflare Tunnels rather than opening incoming firewall ports. 
CaraBase natively supports `cloudflared` to provide zero-port-exposure hosting, explicit CORS locking, and public file sharing URLs.
Please read the [Cloudflare Tunnel Setup Guide](./docs/cloudflare-tunnel.md) for quick deployment instructions.
