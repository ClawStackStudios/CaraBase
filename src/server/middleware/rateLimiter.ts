import { Request, Response, NextFunction } from 'express';

const rateLimits = new Map<string, { count: number, resetAt: number }>();

// Cleanup stale limits every 5 minutes to prevent memory leaks over time
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimits.entries()) {
    if (now > limit.resetAt) {
      rateLimits.delete(ip);
    }
  }
}, 300000);

export function authLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const limit = rateLimits.get(ip);
  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 }); // 60s window
    next();
    return;
  }
  if (limit.count >= 10) {
    res.status(429).json({ success: false, error: 'Too many requests, please try again later.' });
    return;
  }
  limit.count++;
  next();
}
