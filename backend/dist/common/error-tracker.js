"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initErrorTracker = initErrorTracker;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.errorTrackerHandler = errorTrackerHandler;
exports.errorTrackerErrorHandler = errorTrackerErrorHandler;
// backend/common/error-tracker.ts
const logger_1 = require("./logger");
const prisma_1 = require("./prisma");
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
function initErrorTracker() {
    const environment = process.env.NODE_ENV || 'development';
    // Don't track errors in development unless explicitly enabled
    if (environment === 'development' && !process.env.ENABLE_ERROR_TRACKING) {
        logger_1.logger.info('Error tracking disabled in development mode');
        return;
    }
    logger_1.logger.info({ environment }, 'Error tracking initialized');
}
/**
 * Determine error severity based on error type and message
 */
function determineSeverity(error) {
    const errorName = error.name?.toUpperCase() || '';
    const message = error.message?.toUpperCase() || '';
    // Critical errors
    if (errorName.includes('DATABASE') ||
        errorName.includes('AUTHENTICATION') ||
        errorName.includes('AUTHORIZATION') ||
        message.includes('CRITICAL') ||
        message.includes('SECURITY')) {
        return 'CRITICAL';
    }
    // High severity
    if (errorName.includes('VALIDATION') ||
        errorName.includes('PAYMENT') ||
        errorName.includes('TRANSACTION') ||
        message.includes('FAILED')) {
        return 'HIGH';
    }
    // Medium severity (default)
    return 'MEDIUM';
}
/**
 * Check if error should be ignored
 */
function shouldIgnoreError(error) {
    const errorName = error.name?.toUpperCase() || '';
    const message = error.message?.toUpperCase() || '';
    return IGNORED_ERRORS.some(ignored => errorName.includes(ignored) || message.includes(ignored));
}
/**
 * Capture exception to database
 */
async function captureException(error, context) {
    try {
        // Ignore certain errors
        if (shouldIgnoreError(error)) {
            return;
        }
        // Don't track in development unless enabled
        const environment = process.env.NODE_ENV || 'development';
        if (environment === 'development' && !process.env.ENABLE_ERROR_TRACKING) {
            logger_1.logger.error({ err: error, ...context }, 'Error occurred (not tracked)');
            return;
        }
        const errorType = error.name || 'Error';
        const severity = determineSeverity(error);
        // Check if similar error exists (same type and message)
        const existingError = await prisma_1.prisma.errorLog.findFirst({
            where: {
                errorType,
                message: error.message,
                status: { not: 'RESOLVED' },
            },
            orderBy: { lastSeenAt: 'desc' },
        });
        if (existingError) {
            // Update existing error occurrence
            await prisma_1.prisma.errorLog.update({
                where: { id: existingError.id },
                data: {
                    occurrenceCount: { increment: 1 },
                    lastSeenAt: new Date(),
                    context: context ? JSON.parse(JSON.stringify(context)) : null,
                },
            });
            logger_1.logger.warn({ errorId: existingError.id, occurrenceCount: existingError.occurrenceCount + 1 }, 'Error occurrence updated');
        }
        else {
            // Create new error log
            const errorLog = await prisma_1.prisma.errorLog.create({
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
            logger_1.logger.error({ errorId: errorLog.id, severity, errorType }, 'Error captured and logged');
            // Send alert for critical errors
            if (severity === 'CRITICAL') {
                await sendCriticalErrorAlert(errorLog);
            }
        }
    }
    catch (trackingError) {
        // Fallback to logger if database fails
        logger_1.logger.error({ err: trackingError, originalError: error }, 'Failed to track error in database');
    }
}
/**
 * Capture message (for non-error events)
 */
async function captureMessage(message, level = 'info', context) {
    try {
        const environment = process.env.NODE_ENV || 'development';
        if (environment === 'development' && !process.env.ENABLE_ERROR_TRACKING) {
            if (level === 'warn') {
                logger_1.logger.warn({ ...context }, message);
            }
            else {
                logger_1.logger[level]({ ...context }, message);
            }
            return;
        }
        // Only track warnings and errors as messages
        if (level === 'info') {
            logger_1.logger.info({ ...context }, message);
            return;
        }
        const severity = level === 'error' ? 'HIGH' : 'MEDIUM';
        await prisma_1.prisma.errorLog.create({
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
            logger_1.logger.warn({ ...context }, message);
        }
        else if (level === 'error') {
            logger_1.logger.error({ ...context }, message);
        }
        else {
            logger_1.logger.info({ ...context }, message);
        }
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to capture message');
    }
}
/**
 * Send alert for critical errors (implement based on your notification system)
 */
async function sendCriticalErrorAlert(errorLog) {
    // TODO: Implement email/SMS/push notification for critical errors
    // You can use your existing notification service (Mailgun, Twilio, etc.)
    logger_1.logger.error({ errorId: errorLog.id, severity: 'CRITICAL' }, 'CRITICAL ERROR - Alert should be sent');
}
/**
 * Error handler middleware for Express
 */
function errorTrackerHandler() {
    return (req, res, next) => {
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
function errorTrackerErrorHandler() {
    return (err, req, res, next) => {
        // Don't capture 4xx errors (client errors)
        if (err.status && err.status < 500) {
            return next(err);
        }
        // Capture server errors
        captureException(err, req.errorContext || {});
        next(err);
    };
}
