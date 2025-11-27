import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticationError } from './index';
import type { AuthenticatedRequest } from './auth-middleware';

// Lazy check for JWT_SECRET - only validate when verifyJWT is actually called
function getJWTSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET || JWT_SECRET === 'changeme') {
    throw new Error(
      'JWT_SECRET must be set in environment variables and cannot be "changeme". ' +
      'Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return JWT_SECRET;
}

/**
 * Re-export AuthenticatedRequest from auth-middleware for backward compatibility
 */
export type { AuthenticatedRequest } from './auth-middleware';

/**
 * Re-export all authentication middleware from auth-middleware
 */
export { 
  verifyFirebaseToken, 
  requireRole, 
  requireAdmin, 
  requireKYC, 
  optionalAuth 
} from './auth-middleware';

/**
 * Middleware to verify JWT tokens (alternative to Firebase)
 */
export function verifyJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJWTSecret()) as any;

    req.user = {
      uid: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      kycStatus: decoded.kycStatus,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    }
    next(new AuthenticationError('Authentication failed'));
  }
}
