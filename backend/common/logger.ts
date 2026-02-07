import pino from 'pino';
import { Request, Response } from 'express';

// Create logger instance
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  redact: {
    // Avoid accidental logging of sensitive card data (PAN/CVV) anywhere in nested payloads.
    // This is defense-in-depth; we also avoid persisting these fields entirely.
    paths: [
      '*.pan',
      '*.PAN',
      '*.card_number',
      '*.cardNumber',
      '*.cvv',
      '*.cvc',
      '*.cvc2',
      '*.security_code',
      '*.securityCode',
      '*.fullNumber',
      'pan',
      'card_number',
      'cvv',
      'fullNumber',
    ],
    censor: '[REDACTED]',
  },
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'payvost-backend',
  },
});

/**
 * Request logger middleware for Express
 * Logs request details with correlation ID
 */
export function requestLogger(req: Request, res: Response, next: any) {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'] as string || 
                        req.headers['x-request-id'] as string || 
                        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add correlation ID to request for use in other middleware
  (req as any).correlationId = correlationId;

  // Log request
  logger.info({
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  }, 'Incoming request');

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData: any = {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    // Add user info if available
    if ((req as any).user) {
      logData.userId = (req as any).user.uid;
      logData.userEmail = (req as any).user.email;
    }

    if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed with error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
}

/**
 * Error logger helper
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    'Error occurred'
  );
}

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

