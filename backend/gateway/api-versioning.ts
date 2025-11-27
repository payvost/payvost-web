/**
 * API Versioning Middleware
 * Supports /api/v1/, /api/v2/, etc. for backward compatibility
 */

import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../common/logger';

export interface VersionedRequest extends Request {
  apiVersion?: string;
}

/**
 * Extract API version from request path
 * Supports: /api/v1/..., /api/v2/..., /api/... (defaults to v1)
 */
export function extractApiVersion(req: VersionedRequest, res: Response, next: NextFunction): void {
  const path = req.path;
  
  // Match /api/v1/, /api/v2/, etc.
  const versionMatch = path.match(/^\/api\/v(\d+)\//);
  
  if (versionMatch) {
    req.apiVersion = `v${versionMatch[1]}`;
    // Remove version from path for route matching
    req.url = req.url.replace(`/v${versionMatch[1]}`, '');
    // Note: req.path is read-only, but req.url modification should be sufficient for routing
  } else if (path.startsWith('/api/')) {
    // Default to v1 for unversioned routes
    req.apiVersion = 'v1';
  }
  
  next();
}

/**
 * Create versioned router
 * Wraps routes with version prefix
 */
export function createVersionedRouter(version: string = 'v1'): Router {
  const router = Router();
  
  // Add version header to all responses
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('API-Version', version);
    next();
  });
  
  return router;
}

/**
 * Register routes with versioning support
 */
export function registerVersionedRoutes(
  app: any,
  serviceName: string,
  basePath: string,
  routes: Router,
  supportedVersions: string[] = ['v1']
): void {
  // Register for each supported version
  supportedVersions.forEach(version => {
    const versionedPath = `/api/${version}${basePath}`;
    logger.info({ serviceName, version, path: versionedPath }, 'Registering versioned service routes');
    app.use(versionedPath, routes);
  });
  
  // Also register unversioned routes (defaults to v1 behavior)
  logger.info({ serviceName, path: basePath }, 'Registering unversioned service routes (defaults to v1)');
  app.use(basePath, routes);
}

/**
 * Version compatibility helper
 * Check if requested version is supported
 */
export function isVersionSupported(requestedVersion: string, supportedVersions: string[]): boolean {
  return supportedVersions.includes(requestedVersion);
}

/**
 * Middleware to check version compatibility
 */
export function requireVersion(...supportedVersions: string[]) {
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
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

