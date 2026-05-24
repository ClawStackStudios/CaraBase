# Installation & Hosting

CaraBase is designed to be easily hosted either as a bare-metal Node.js application or inside a Docker container.

## Local Development (Source)

If you are developing CaraBase or want to run it locally on your machine:

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Start the Development Server**
   ```bash
   npm run dev
   ```
   This command concurrently runs Vite (for the React frontend) and `tsx watch` (for hot-reloading the Express backend). The backend will output `CaraBase API running on port 5353`.

## Production Build (Bare Metal)

1. **Build the Assets**
   ```bash
   npm run build
   ```
   This command compiles the React frontend into `/dist` and transpiles the Express backend into `dist/server.cjs` using `esbuild`.

2. **Run the Server**
   ```bash
   npm start
   ```

## Docker Deployment (Recommended)

Running CaraBase via Docker ensures that native SQLite extensions (like `better-sqlite3`) are properly compiled for the runtime environment.

### Using Docker Compose

1. **Create the Data Directory**
   Ensure the `data` directory exists locally so the container can mount it without creating permission issues.
   ```bash
   mkdir -p ./data
   ```

2. **Configure your `.env` (Optional but recommended)**
   ```env
   ADMIN_TOKEN=your_secure_superadmin_password
   PORT=3000
   CORS_ORIGINS=https://your-frontend.com
   ```

3. **Start the Container**
   ```bash
   docker-compose up -d --build
   ```

Your CaraBase instance will now be running on port `3000`. The SQLite database files will be safely persisted inside the `./data` directory on your host machine.

### Next Steps

If you intend to host CaraBase publicly without opening firewall ports, we highly recommend reading the [Cloudflare Tunnels](cloudflare-tunnel.md) guide.
