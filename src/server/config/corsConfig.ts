import { CorsOptions } from 'cors';

export function getCorsConfig(): CorsOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const corsOrigin = process.env.CORS_ORIGINS || process.env.CLOUDFLARE_TUNNEL_URL;
  const allowedOrigins = corsOrigin ? corsOrigin.split(",").map((o) => o.trim()) : [];

  const isLocalhost = (hostname: string) => 
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  const isPrivateIP = (hostname: string) =>
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      try {
        const url = new URL(origin);
        const hostname = url.hostname;

        // 1. Always allow localhost
        if (isLocalhost(hostname)) return callback(null, true);

        // 2. Allow LAN access (Private IPs)
        if (isPrivateIP(hostname)) return callback(null, true);

        if (isProduction) {
          // 3. In Prod: Allow explicit CORS origins (CF tunnels, etc.)
          if (allowedOrigins.includes(origin)) return callback(null, true);

          console.warn(`[CORS] ⚠️ Rejected origin in production: ${origin}`);
          return callback(new Error("CORS: Origin not allowed in production"));
        } else {
          // In Dev: Allow configured origins or reject
          if (allowedOrigins.includes(origin)) return callback(null, true);
          console.warn(`[CORS] ⚠️ Rejected origin in development: ${origin}`);
          return callback(new Error("CORS: Origin not allowed"));
        }
      } catch (err) {
        callback(new Error(`CORS: Invalid origin format: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: isProduction ? 86400 : 3600,
  };
}
