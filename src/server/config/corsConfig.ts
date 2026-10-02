import { CorsOptions } from 'cors';
import db from '../db.js';

export function getCorsConfig(): CorsOptions {
  const isProduction = process.env.NODE_ENV === "production";
  const corsOriginEnv = process.env.CORS_ORIGINS || process.env.CLOUDFLARE_TUNNEL_URL;
  const envOrigins = corsOriginEnv ? corsOriginEnv.split(",").map((o) => o.trim()) : [];

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

        // Fetch dynamic origins from DB
        let dbOrigins: string[] = [];
        try {
          const row = db.prepare("SELECT value FROM system_settings WHERE key = 'cors_origins'").get() as any;
          if (row && row.value) {
            dbOrigins = row.value.split(',').map((o: string) => o.trim()).filter(Boolean);
          }
        } catch (e) {
          console.error('[CORS] Failed to read dynamic origins from DB', e);
        }

        // Sanitize origins: ignore '*', parse with URL to extract proper origin
        const rawOrigins = [...envOrigins, ...dbOrigins];
        const allowedOrigins = rawOrigins
          .filter(o => o !== '*')
          .map(o => {
            try {
              return new URL(o).origin;
            } catch {
              return null;
            }
          })
          .filter((o): o is string => o !== null);

        // 1. Always allow localhost
        if (isLocalhost(hostname)) return callback(null, true);

        // 2. Allow LAN access (Private IPs) ONLY in development
        if (!isProduction && isPrivateIP(hostname)) return callback(null, true);

        // 3. Strictly enforce allowed origins
        if (allowedOrigins.includes(url.origin)) return callback(null, true);

        console.warn(`[CORS] ⚠️ Rejected origin in ${isProduction ? 'production' : 'development'}: ${origin}`);
        return callback(null, false);
      } catch (err) {
        console.warn(`[CORS] ⚠️ Invalid origin format: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "apikey", "Accept"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: isProduction ? 86400 : 3600,
  };
}
