/**
 * Rate limiting utility for Next.js API routes
 * Simple in-memory rate limiter (consider Redis for production)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production for multi-instance deployments)
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limiter for API routes
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the window
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier.toLowerCase();

  // Get or create entry
  let entry = store[key];

  // Reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    store[key] = entry;
  }

  // Increment count
  entry.count += 1;

  const remaining = Math.max(0, maxRequests - entry.count);
  const success = entry.count <= maxRequests;

  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: success ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Get client IP address from Next.js request
 */
export function getClientIP(request: Request): string {
  // Try various headers (common in different deployment environments)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default (shouldn't happen in production)
  return 'unknown';
}

/**
 * Rate limiter middleware for registration endpoint
 * 5 registrations per IP per hour
 */
export const registrationRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
};

/**
 * Rate limiter middleware for authentication endpoints
 * 10 attempts per IP per 15 minutes
 */
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
};
