import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend Express Request to include rateLimit property
type RateLimitedRequest = Request & {
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: RateLimitedRequest, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900),
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitedRequest, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900),
    });
  },
});

/**
 * Rate limiter for financial transactions
 * 20 requests per minute per IP
 */
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 transactions per minute
  message: 'Too many transaction requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitedRequest, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many transaction requests, please try again later.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
    });
  },
});

/**
 * Rate limiter for API key-based requests
 * Uses a custom key generator based on API key instead of IP
 */
export const createApiKeyLimiter = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request) => {
      // Use API key from header if present, otherwise fall back to IP
      const r = req as any;
      const apiKey = r.headers?.['x-api-key'] as string;
      return apiKey || r.ip || 'unknown';
    },
    message: 'API rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

