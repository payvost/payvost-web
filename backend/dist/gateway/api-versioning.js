"use strict";
/**
 * API Versioning Middleware
 * Supports /api/v1/, /api/v2/, etc. for backward compatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractApiVersion = extractApiVersion;
exports.createVersionedRouter = createVersionedRouter;
exports.getRegisteredServices = getRegisteredServices;
exports.registerVersionedRoutes = registerVersionedRoutes;
exports.isVersionSupported = isVersionSupported;
exports.requireVersion = requireVersion;
const express_1 = require("express");
const logger_1 = require("../common/logger");
/**
 * Extract API version from request path
 * Supports: /api/v1/..., /api/v2/..., /api/... (defaults to v1)
 */
function extractApiVersion(req, res, next) {
    const path = req.path;
    // Match /api/v1/, /api/v2/, etc.
    const versionMatch = path.match(/^\/api\/v(\d+)\//);
    if (versionMatch) {
        req.apiVersion = `v${versionMatch[1]}`;
        // Remove version from path for route matching
        req.url = req.url.replace(`/v${versionMatch[1]}`, '');
        // Note: req.path is read-only, but req.url modification should be sufficient for routing
    }
    else if (path.startsWith('/api/')) {
        // Default to v1 for unversioned routes
        req.apiVersion = 'v1';
    }
    next();
}
/**
 * Create versioned router
 * Wraps routes with version prefix
 */
function createVersionedRouter(version = 'v1') {
    const router = (0, express_1.Router)();
    // Add version header to all responses
    router.use((req, res, next) => {
        res.setHeader('API-Version', version);
        next();
    });
    return router;
}
const serviceRegistry = [];
/**
 * Get all registered services
 */
function getRegisteredServices() {
    return [...serviceRegistry];
}
/**
 * Register routes with versioning support
 */
function registerVersionedRoutes(app, serviceName, basePath, routes, supportedVersions = ['v1']) {
    // Register service in registry
    serviceRegistry.push({
        name: serviceName,
        basePath,
        supportedVersions,
        status: 'active',
    });
    // Register for each supported version
    supportedVersions.forEach(version => {
        const versionedPath = `/api/${version}${basePath}`;
        logger_1.logger.info({ serviceName, version, path: versionedPath }, 'Registering versioned service routes');
        app.use(versionedPath, routes);
    });
    // Also register unversioned routes (defaults to v1 behavior)
    logger_1.logger.info({ serviceName, path: basePath }, 'Registering unversioned service routes (defaults to v1)');
    app.use(basePath, routes);
}
/**
 * Version compatibility helper
 * Check if requested version is supported
 */
function isVersionSupported(requestedVersion, supportedVersions) {
    return supportedVersions.includes(requestedVersion);
}
/**
 * Middleware to check version compatibility
 */
function requireVersion(...supportedVersions) {
    return (req, res, next) => {
        const requestedVersion = req.apiVersion || 'v1';
        if (!isVersionSupported(requestedVersion, supportedVersions)) {
            res.status(400).json({
                error: 'Unsupported API version',
                message: `API version ${requestedVersion} is not supported. Supported versions: ${supportedVersions.join(', ')}`,
                requestedVersion,
                supportedVersions,
            });
            return;
        }
        next();
    };
}
