import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRequire } from 'module';
import path from 'path';
import { logger, requestLogger, logError } from '../common/logger';
import { errorTrackerHandler, errorTrackerErrorHandler } from '../common/error-tracker';
import { generalLimiter, authLimiter, transactionLimiter } from './rateLimiter';
import { performanceMiddleware, getPerformanceStats } from '../common/performance-monitor';
import { apmMiddleware } from '../common/apm-setup';
import { getRegisteredServices } from './api-versioning';

// Domain-specific error classes
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class KYCError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KYCError';
  }
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const correlationId = (req as any).correlationId || 'unknown';
  logError(err, {
    correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Handle specific error types
  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: err.message,
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: 'Authorization failed',
      message: err.message,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
    });
  }

  if (err instanceof KYCError) {
    return res.status(403).json({
      error: 'KYC verification required',
      message: err.message,
    });
  }

  if (err instanceof ServiceError) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: err.message,
    });
  }

  // Default error response
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
}

// Re-export requestLogger from logger module
export { requestLogger };

// Create and configure the gateway router
export function createGateway() {
  const app = express();

  // Error tracker request handler (must be first)
  app.use(errorTrackerHandler());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Allow embedding for API usage
  }));

  // CORS - Security: Require explicit origin configuration
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim())
    : [];

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error(
      'FRONTEND_URL must be set in production environment. ' +
      'Provide comma-separated list of allowed origins (e.g., "https://app.payvost.com,https://www.payvost.com")'
    );
  }

  // CORS configuration with conditional origin checking
  app.use((req, res, next) => {
    // Health check and monitoring endpoints that don't require strict CORS
    const noCorsPaths = ['/health', '/'];
    const isHealthCheck = noCorsPaths.includes(req.path);
    const isSimpleRequest = ['GET', 'HEAD'].includes(req.method);

    // Helper function to check if IP is internal/localhost
    const isInternalIP = (ip: string): boolean => {
      if (!ip) return false;
      // Check for localhost IPv4 and IPv6
      if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
        return true;
      }
      // Check for private IP ranges
      const ipParts = ip.split('.');
      if (ipParts.length === 4) {
        const [a, b, c] = ipParts.map(Number);
        // 10.0.0.0/8
        if (a === 10) return true;
        // 172.16.0.0/12
        if (a === 172 && b >= 16 && b <= 31) return true;
        // 192.168.0.0/16
        if (a === 192 && b === 168) return true;
      }
      return false;
    };

    // Helper function to check if request has valid internal API key
    const hasValidInternalApiKey = (): boolean => {
      const internalApiKey = process.env.INTERNAL_API_KEY;
      if (!internalApiKey) return false;
      const apiKey = req.headers['x-api-key'] as string;
      return apiKey === internalApiKey;
    };

    // Create CORS middleware with access to request context
    const corsMiddleware = cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.) in development only
        if (!origin && process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        
        // Allow requests without origin for health checks and simple GET/HEAD requests
        // (used by load balancers, monitoring tools, etc.)
        if (!origin && (isHealthCheck || isSimpleRequest)) {
          return callback(null, true);
        }
        
        // Allow requests without origin if they come from internal IPs
        // (server-to-server calls, same-origin requests, Render internal systems)
        if (!origin && isInternalIP(req.ip || '')) {
          return callback(null, true);
        }
        
        // Allow requests without origin if they have a valid internal API key
        // (authenticated internal service-to-service calls)
        if (!origin && hasValidInternalApiKey()) {
          return callback(null, true);
        }
        
        // In production, require origin for API routes from external sources
        if (!origin) {
          return callback(new Error('CORS: Origin header required'));
        }

        // Check if origin is allowed
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Correlation-ID', 'X-Request-ID'],
      credentials: true,
    });

    return corsMiddleware(req, res, next);
  });

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging (with correlation IDs)
  app.use(requestLogger);

  // APM monitoring (if enabled)
  app.use(apmMiddleware);

  // Performance monitoring
  app.use(performanceMiddleware);

  // Rate limiting
  app.use(generalLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Root endpoint with API version info
  app.get('/', (req, res) => {
    const registeredServices = getRegisteredServices();
    
    res.status(200).json({
      name: 'Payvost API Gateway',
      version: '1.0.0',
      status: 'running',
      apiVersions: ['v1'],
      documentation: '/api/v1/docs',
      endpoints: {
        health: '/health',
        api: '/api/v1',
      },
      services: registeredServices.map(service => ({
        name: service.name,
        path: service.basePath,
        versions: service.supportedVersions,
        status: service.status,
      })),
      serviceCount: registeredServices.length,
    });
  });

  // API version info endpoint
  app.get('/api/versions', (req, res) => {
    res.status(200).json({
      currentVersion: 'v1',
      supportedVersions: ['v1'],
      defaultVersion: 'v1',
      deprecationPolicy: 'https://docs.payvost.com/api/versioning',
    });
  });

  // Performance metrics endpoint (admin only)
  app.get('/api/admin/performance', getPerformanceStats);

  // Error tracker error handler (must be before other error handlers)
  app.use(errorTrackerErrorHandler());

  return app;
}

// Route registration helper
export function registerServiceRoutes(
  app: express.Application,
  serviceName: string,
  routePath: string,
  routes: express.Router
) {
  logger.info({ serviceName, routePath }, 'Registering service routes');
  app.use(routePath, routes);
}

// Export rate limiters for use in specific routes
export { authLimiter, transactionLimiter, generalLimiter };

export default createGateway;
