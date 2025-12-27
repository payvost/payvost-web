"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const performance_monitor_1 = require("../common/performance-monitor");
const apm_setup_1 = require("../common/apm-setup");
const api_versioning_1 = require("./api-versioning");
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
    // CORS configuration with conditional origin checking
    app.use((req, res, next) => {
        // Health check and monitoring endpoints that don't require strict CORS
        const noCorsPaths = ['/health', '/'];
        const isHealthCheck = noCorsPaths.includes(req.path);
        const isSimpleRequest = ['GET', 'HEAD'].includes(req.method);
        // Helper function to check if IP is internal/localhost
        const isInternalIP = (ip) => {
            if (!ip)
                return false;
            // Check for localhost IPv4 and IPv6
            if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
                return true;
            }
            // Check for private IP ranges
            const ipParts = ip.split('.');
            if (ipParts.length === 4) {
                const [a, b, c] = ipParts.map(Number);
                // 10.0.0.0/8
                if (a === 10)
                    return true;
                // 172.16.0.0/12
                if (a === 172 && b >= 16 && b <= 31)
                    return true;
                // 192.168.0.0/16
                if (a === 192 && b === 168)
                    return true;
            }
            return false;
        };
        // Helper function to check if request has valid internal API key
        const hasValidInternalApiKey = () => {
            const internalApiKey = process.env.INTERNAL_API_KEY;
            if (!internalApiKey)
                return false;
            const apiKey = req.headers['x-api-key'];
            return apiKey === internalApiKey;
        };
        // Create CORS middleware with access to request context
        const corsMiddleware = (0, cors_1.default)({
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
                }
                else {
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
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Request logging (with correlation IDs)
    app.use(logger_1.requestLogger);
    // APM monitoring (if enabled)
    app.use(apm_setup_1.apmMiddleware);
    // Performance monitoring
    app.use(performance_monitor_1.performanceMiddleware);
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
    // Root endpoint with API version info
    app.get('/', (req, res) => {
        const registeredServices = (0, api_versioning_1.getRegisteredServices)();
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
    app.get('/api/admin/performance', performance_monitor_1.getPerformanceStats);
    // Test endpoint for Mailgun configuration
    app.post('/api/test/mailgun', async (req, res) => {
        try {
            const { searchParams } = new URL(`http://localhost${req.url}`);
            const testEmail = searchParams.get('email');
            if (!testEmail) {
                return res.status(400).json({
                    error: 'Email parameter required',
                    usage: 'POST /api/test/mailgun?email=test@example.com',
                    headers: { 'Authorization': 'Bearer <firebase_token>' }
                });
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(testEmail)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            const { sendEmail, isMailgunConfigured } = await Promise.resolve().then(() => __importStar(require('../common/mailgun')));
            if (!isMailgunConfigured()) {
                return res.status(500).json({
                    error: 'Mailgun is not configured',
                    required_env_vars: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'],
                    environment_check: {
                        mailgun_api_key: !!process.env.MAILGUN_API_KEY ? 'SET' : 'NOT SET',
                        mailgun_domain: !!process.env.MAILGUN_DOMAIN ? 'SET' : 'NOT SET',
                        mailgun_from_email: !!process.env.MAILGUN_FROM_EMAIL ? 'SET' : 'NOT SET',
                    }
                });
            }
            // Send test email (without template, using raw HTML/text)
            const result = await sendEmail({
                to: testEmail,
                subject: 'Payvost Mailgun Test Email',
                html: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Mailgun Test Email</h2>
              <p>This is a test email from Payvost to verify Mailgun integration is working.</p>
              <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
              <p><strong>Recipient Email:</strong> ${testEmail}</p>
              <hr/>
              <p style="color: #666; font-size: 12px;">This is an automated test message from Payvost.</p>
            </body>
          </html>
        `,
                text: 'This is a test email from Payvost to verify Mailgun integration is working.',
            });
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Failed to send test email',
                });
            }
            return res.status(200).json({
                success: true,
                message: `Test email sent successfully to ${testEmail}`,
                messageId: result.messageId,
                details: {
                    recipient: testEmail,
                    template: 'test-email',
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error({ err: error }, '[test/mailgun] Error sending test email');
            res.status(500).json({
                success: false,
                error: error.message || 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            });
        }
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
