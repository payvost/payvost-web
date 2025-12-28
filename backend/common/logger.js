"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.requestLogger = requestLogger;
exports.logError = logError;
exports.createChildLogger = createChildLogger;
const pino_1 = __importDefault(require("pino"));
// Create logger instance
const isDevelopment = process.env.NODE_ENV === 'development';
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
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
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    base: {
        env: process.env.NODE_ENV || 'development',
        service: 'payvost-backend',
    },
});
/**
 * Request logger middleware for Express
 * Logs request details with correlation ID
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    const correlationId = req.headers['x-correlation-id'] ||
        req.headers['x-request-id'] ||
        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Add correlation ID to request for use in other middleware
    req.correlationId = correlationId;
    // Log request
    exports.logger.info({
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
        const logData = {
            correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        };
        // Add user info if available
        if (req.user) {
            logData.userId = req.user.uid;
            logData.userEmail = req.user.email;
        }
        if (res.statusCode >= 400) {
            exports.logger.warn(logData, 'Request completed with error');
        }
        else {
            exports.logger.info(logData, 'Request completed');
        }
    });
    next();
}
/**
 * Error logger helper
 */
function logError(error, context) {
    exports.logger.error({
        err: {
            message: error.message,
            stack: error.stack,
            name: error.name,
        },
        ...context,
    }, 'Error occurred');
}
/**
 * Create child logger with additional context
 */
function createChildLogger(context) {
    return exports.logger.child(context);
}
//# sourceMappingURL=logger.js.map