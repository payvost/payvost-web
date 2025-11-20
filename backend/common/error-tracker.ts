// backend/common/error-tracker.ts
import { logger } from './logger';
import { prisma } from './prisma';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ErrorStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED' | 'IGNORED';

interface ErrorContext {
  userId?: string;
  correlationId?: string;
  method?: string;
  path?: string;
  query?: any;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

// Errors to ignore (similar to Sentry's ignoreErrors)
const IGNORED_ERRORS = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNABORTED',
];

/**
 * Initialize error tracking
 */
export function initErrorTracker() {
  const environment = process.env.NODE_ENV || 'development';
  
  // Don't track errors in development unless explicitly enabled
  if (environment === 'development' && !process.env.ENABLE_ERROR_TRACKING) {
    logger.info('Error tracking disabled in development mode');
    return;
  }
  
  logger.info({ environment }, 'Error tracking initialized');
}

/**
 * Determine error severity based on error type and message
 */
function determineSeverity(error: Error): ErrorSeverity {
  const errorName = error.name?.toUpperCase() || '';
  const message = error.message?.toUpperCase() || '';
  
  // Critical errors
  if (
    errorName.includes('DATABASE') ||
    errorName.includes('AUTHENTICATION') ||
    errorName.includes('AUTHORIZATION') ||
    message.includes('CRITICAL') ||
    message.includes('SECURITY')
  ) {
    return 'CRITICAL';
  }
  
  // High severity
  if (
    errorName.includes('VALIDATION') ||
    errorName.includes('PAYMENT') ||
    errorName.includes('TRANSACTION') ||
    message.includes('FAILED')
  ) {
    return 'HIGH';
  }
  
  // Medium severity (default)
  return 'MEDIUM';
}

/**
 * Check if error should be ignored
 */
function shouldIgnoreError(error: Error): boolean {
  const errorName = error.name?.toUpperCase() || '';
  const message = error.message?.toUpperCase() || '';
  
  return IGNORED_ERRORS.some(ignored => 
    errorName.includes(ignored) || message.includes(ignored)
  );
}

/**
 * Capture exception to database
 */
export async function captureException(
  error: Error,
  context?: ErrorContext
): Promise<void> {
  try {
    // Ignore certain errors
    if (shouldIgnoreError(error)) {
      return;
    }
    
    // Don't track in development unless enabled
    const environment = process.env.NODE_ENV || 'development';
    if (environment === 'development' && !process.env.ENABLE_ERROR_TRACKING) {
      logger.error({ err: error, ...context }, 'Error occurred (not tracked)');
      return;
    }
    
    const errorType = error.name || 'Error';
    const severity = determineSeverity(error);
    
    // Check if similar error exists (same type and message)
    const existingError = await prisma.errorLog.findFirst({
      where: {
        errorType,
        message: error.message,
        status: { not: 'RESOLVED' },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
    
    if (existingError) {
      // Update existing error occurrence
      await prisma.errorLog.update({
        where: { id: existingError.id },
        data: {
          occurrenceCount: { increment: 1 },
          lastSeenAt: new Date(),
          context: context ? JSON.parse(JSON.stringify(context)) : null,
        },
      });
      
      logger.warn(
        { errorId: existingError.id, occurrenceCount: existingError.occurrenceCount + 1 },
        'Error occurrence updated'
      );
    } else {
      // Create new error log
      const errorLog = await prisma.errorLog.create({
        data: {
          message: error.message,
          errorType,
          severity,
          stack: error.stack || null,
          context: context ? JSON.parse(JSON.stringify(context)) : null,
          method: context?.method,
          path: context?.path,
          query: context?.query ? JSON.parse(JSON.stringify(context.query)) : null,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          userId: context?.userId,
          correlationId: context?.correlationId,
          environment,
          release: process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || null,
        },
      });
      
      logger.error(
        { errorId: errorLog.id, severity, errorType },
        'Error captured and logged'
      );
      
      // Send alert for critical errors
      if (severity === 'CRITICAL') {
        await sendCriticalErrorAlert(errorLog);
      }
    }
  } catch (trackingError) {
    // Fallback to logger if database fails
    logger.error(
      { err: trackingError, originalError: error },
      'Failed to track error in database'
    );
  }
}

/**
 * Capture message (for non-error events)
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  context?: ErrorContext
): Promise<void> {
  try {
    const environment = process.env.NODE_ENV || 'development';
    if (environment === 'development' && !process.env.ENABLE_ERROR_TRACKING) {
      if (level === 'warn') {
        logger.warn({ ...context }, message);
      } else {
        logger[level]({ ...context }, message);
      }
      return;
    }
    
    // Only track warnings and errors as messages
    if (level === 'info') {
      logger.info({ ...context }, message);
      return;
    }
    
    const severity: ErrorSeverity = level === 'error' ? 'HIGH' : 'MEDIUM';
    
    await prisma.errorLog.create({
      data: {
        message,
        errorType: 'Message',
        severity,
        context: context ? JSON.parse(JSON.stringify(context)) : null,
        method: context?.method,
        path: context?.path,
        userId: context?.userId,
        correlationId: context?.correlationId,
        environment,
      },
    });
    
    if (level === 'warn') {
      logger.warn({ ...context }, message);
    } else {
      logger[level]({ ...context }, message);
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to capture message');
  }
}

/**
 * Send alert for critical errors (implement based on your notification system)
 */
async function sendCriticalErrorAlert(errorLog: any): Promise<void> {
  // TODO: Implement email/SMS/push notification for critical errors
  // You can use your existing notification service (Mailgun, Twilio, etc.)
  logger.error(
    { errorId: errorLog.id, severity: 'CRITICAL' },
    'CRITICAL ERROR - Alert should be sent'
  );
}

/**
 * Error handler middleware for Express
 */
export function errorTrackerHandler() {
  return (req: any, res: any, next: any) => {
    // Store request context for error tracking
    req.errorContext = {
      method: req.method,
      path: req.path,
      query: req.query,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.uid || req.user?.id,
      correlationId: req.correlationId,
    };
    
    next();
  };
}

/**
 * Express error handler middleware
 */
export function errorTrackerErrorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    // Don't capture 4xx errors (client errors)
    if (err.status && err.status < 500) {
      return next(err);
    }
    
    // Capture server errors
    captureException(err, req.errorContext || {});
    
    next(err);
  };
}

