import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import path from 'path';

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
  console.error('Error:', err);

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

// Request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
}

// Create and configure the gateway router
export function createGateway() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestLogger);

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

  return app;
}

// Route registration helper
export function registerServiceRoutes(
  app: express.Application,
  serviceName: string,
  routePath: string,
  routes: express.Router
) {
  console.log(`Registering ${serviceName} routes at ${routePath}`);
  app.use(routePath, routes);
}

export default createGateway;
