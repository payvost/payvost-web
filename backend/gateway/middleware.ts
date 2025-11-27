import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError, KYCError } from './index';

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

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    kycStatus?: string;
  };
}

/**
 * Middleware to verify Firebase ID tokens
 * Uses standardized authentication from auth-middleware
 */
export { verifyFirebaseToken, requireRole, requireAdmin, requireKYC, optionalAuth } from './auth-middleware';

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

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Not authenticated'));
    }

    if (!roles.includes(req.user.role || 'user')) {
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
}

/**
 * Middleware to check if user has completed KYC
 */
export function requireKYC(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AuthenticationError('Not authenticated'));
  }

  if (req.user.kycStatus !== 'verified') {
    return next(
      new KYCError(
        'KYC verification required. Please complete identity verification to access this feature.'
      )
    );
  }

  next();
}

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin', 'superadmin');

/**
 * Optional authentication - adds user to request if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData?.role || 'user',
      kycStatus: userData?.kycStatus || 'pending',
    };
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  
  next();
}
