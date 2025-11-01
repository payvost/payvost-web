"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = exports.KYCError = exports.ValidationError = exports.AuthorizationError = exports.AuthenticationError = void 0;
exports.errorHandler = errorHandler;
exports.requestLogger = requestLogger;
exports.createGateway = createGateway;
exports.registerServiceRoutes = registerServiceRoutes;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
}
// Create and configure the gateway router
function createGateway() {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }));
    app.use(express_1.default.json());
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
function registerServiceRoutes(app, serviceName, routePath, routes) {
    console.log(`Registering ${serviceName} routes at ${routePath}`);
    app.use(routePath, routes);
}
exports.default = createGateway;
