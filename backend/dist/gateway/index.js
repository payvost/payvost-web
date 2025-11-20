"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalLimiter = exports.transactionLimiter = exports.authLimiter = exports.requestLogger = exports.ServiceError = exports.KYCError = exports.ValidationError = exports.AuthorizationError = exports.AuthenticationError = void 0;
exports.errorHandler = errorHandler;
exports.createGateway = createGateway;
exports.registerServiceRoutes = registerServiceRoutes;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("../common/logger");
Object.defineProperty(exports, "requestLogger", { enumerable: true, get: function () { return logger_1.requestLogger; } });
const error_tracker_1 = require("../common/error-tracker");
const rateLimiter_1 = require("./rateLimiter");
Object.defineProperty(exports, "generalLimiter", { enumerable: true, get: function () { return rateLimiter_1.generalLimiter; } });
Object.defineProperty(exports, "authLimiter", { enumerable: true, get: function () { return rateLimiter_1.authLimiter; } });
Object.defineProperty(exports, "transactionLimiter", { enumerable: true, get: function () { return rateLimiter_1.transactionLimiter; } });
// Domain-specific error classes
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class KYCError extends Error {
    constructor(message) {
        super(message);
        this.name = 'KYCError';
    }
}
exports.KYCError = KYCError;
class ServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ServiceError';
    }
}
exports.ServiceError = ServiceError;
// Global error handler middleware
function errorHandler(err, req, res, next) {
    const correlationId = req.correlationId || 'unknown';
    (0, logger_1.logError)(err, {
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
// Create and configure the gateway router
function createGateway() {
    const app = (0, express_1.default)();
    // Error tracker request handler (must be first)
    app.use((0, error_tracker_1.errorTrackerHandler)());
    // Security headers
    app.use((0, helmet_1.default)({
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
        throw new Error('FRONTEND_URL must be set in production environment. ' +
            'Provide comma-separated list of allowed origins (e.g., "https://app.payvost.com,https://www.payvost.com")');
    }
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.) in development only
            if (!origin && process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }
            // In production, require origin
            if (!origin) {
                return callback(new Error('CORS: Origin header required'));
            }
            // Check if origin is allowed
            if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS: Origin ${origin} not allowed`));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Correlation-ID', 'X-Request-ID'],
        credentials: true,
    }));
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Request logging (with correlation IDs)
    app.use(logger_1.requestLogger);
    // Rate limiting
    app.use(rateLimiter_1.generalLimiter);
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
    // Error tracker error handler (must be before other error handlers)
    app.use((0, error_tracker_1.errorTrackerErrorHandler)());
    return app;
}
// Route registration helper
function registerServiceRoutes(app, serviceName, routePath, routes) {
    logger_1.logger.info({ serviceName, routePath }, 'Registering service routes');
    app.use(routePath, routes);
}
exports.default = createGateway;
