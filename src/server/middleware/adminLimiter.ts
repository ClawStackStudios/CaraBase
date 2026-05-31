import { Request, Response, NextFunction } from 'express';

// Strict in-memory rate limiter for Admin Auth
// Limit: 5 requests per 15 minutes per IP
const adminAuthRateLimits = new Map<string, { count: number, resetAt: number }>();

// Cleanup stale limits every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of adminAuthRateLimits.entries()) {
    if (now > limit.resetAt) {
      adminAuthRateLimits.delete(ip);
    }
  }
}, 900000);

export function adminAuthLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const now = Date.now();
  const limit = adminAuthRateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    // 15 minutes window
    adminAuthRateLimits.set(ip, { count: 1, resetAt: now + 900000 });
    next();
    return;
  }
  
  if (limit.count >= 5) {
    res.status(429).json({ 
      success: false, 
      error: 'Too many admin authentication attempts. Please try again later.' 
    });
    return;
  }
  
  limit.count++;
  next();
}
