# Cloudflare Tunnel Setup for CaraBase

To expose CaraBase securely to the internet without opening any incoming firewall ports (like port 3000), you can use [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/). 

CaraBase natively supports Cloudflare Tunnels by intelligently picking up the tunnel URL for file sharing, public endpoints, and CORS validation.

## 1. Get a Cloudflare Tunnel Token
1. Go to the **Cloudflare Zero Trust Dashboard** > **Networks** > **Tunnels**.
2. Click **Create a Tunnel**.
3. Choose **Cloudflared** (the daemon).
4. Give it a name (e.g., `carabase-prod`).
5. In the **Install and run a connector** step, choose the **Docker** environment.
6. Copy the token provided in the command. It looks like this: `eyJh...`

## 2. Route the Tunnel
In the Cloudflare dashboard, configure a **Public Hostname**:
- **Public Hostname**: `carabase.yourdomain.com` (Select your domain)
- **Service**: `http://carabase:3000` (This connects `cloudflared` directly to the CaraBase container via the Docker bridge network).

## 3. Update Environment Variables
In your `.env` file for CaraBase, add the tunnel URL and your explicit CORS domains. This allows the backend to securely lock down requests.

```bash
# Provide the public URL of your tunnel
CLOUDFLARE_TUNNEL_URL="https://carabase.yourdomain.com"

# Define allowed origins for CORS (Optional: defaults to CLOUDFLARE_TUNNEL_URL if omitted)
CORS_ORIGINS="https://carabase.yourdomain.com,https://your-frontend-app.com"
```

## 4. Run via Docker Compose
We have provided a template in `docker-compose.yml` to run the tunnel right next to CaraBase. 

Simply uncomment the `cloudflared` service and supply your token:

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: carabase-tunnel
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=eyJh... # Paste your token here
    restart: unless-stopped
    depends_on:
      - carabase
```

Then run `docker-compose up -d`.

### Why this is secure
- **Zero Open Ports**: You do not need to map `- "3000:3000"` in `docker-compose.yml` if you use the tunnel. You can remove it entirely. CaraBase remains completely unreachable from the local LAN.
- **Strict CORS Validation**: CaraBase detects it is running in production and uses the `CORS_ORIGINS` to explicitly reject API requests originating from unauthorized domains.
- **Content Security Policy (CSP)**: The server automatically sets `helmet` policies to reject framing from unapproved ancestors, protecting against Clickjacking.
