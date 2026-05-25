import { Request, Response, NextFunction } from 'express';

// Simple in-memory global rate limiter (for single-node deployments like CaraBase)
// Limit: 600 requests per 5 minutes per IP
const globalRateLimits = new Map<string, { count: number, resetAt: number }>();

// Cleanup stale limits every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of globalRateLimits.entries()) {
    if (now > limit.resetAt) {
      globalRateLimits.delete(ip);
    }
  }
}, 600000);

export function globalLimiter(req: Request, res: Response, next: NextFunction): void {
  // Respect 'trust proxy' if set by using req.ip (which parses X-Forwarded-For)
  // If undefined, fallback to remoteAddress
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Do not bypass localhost completely in production unless it's a test environment
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const now = Date.now();
  const limit = globalRateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    // 5 minutes window
    globalRateLimits.set(ip, { count: 1, resetAt: now + 300000 });
    next();
    return;
  }
  
  if (limit.count >= 600) {
    res.status(429).json({ 
      success: false, 
      error: 'Global Rate Limit Exceeded: Too many requests, please try again later.' 
    });
    return;
  }
  
  limit.count++;
  next();
}
