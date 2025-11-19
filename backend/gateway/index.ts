import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRequire } from 'module';
import path from 'path';
import { logger, requestLogger, logError } from '../common/logger';
import { sentryRequestHandler, sentryErrorHandler } from '../common/sentry';
import { generalLimiter, authLimiter, transactionLimiter } from './rateLimiter';

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

  // Sentry request handler (must be first)
  app.use(sentryRequestHandler());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for API usage
  }));

  // CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Correlation-ID', 'X-Request-ID'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging (with correlation IDs)
  app.use(requestLogger);

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

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Payvost API Gateway',
      version: '1.0.0',
      status: 'running',
    });
  });

  // Sentry error handler (must be before other error handlers)
  app.use(sentryErrorHandler());

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
