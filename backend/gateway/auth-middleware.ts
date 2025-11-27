/**
 * Standardized Authentication Middleware
 * Centralized authentication for all backend services
 */

import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { logger } from '../common/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    kycStatus?: string;
  };
}

/**
 * Verify Firebase ID token
 * Standard authentication middleware for all protected routes
 */
export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or invalid authorization header. Expected: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim().length === 0) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Token is required'
      });
      return;
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Fetch user data from Firestore for additional context
    let userData: any = {};
    try {
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      userData = userDoc.data() || {};
    } catch (firestoreError) {
      logger.warn({ uid: decodedToken.uid, error: firestoreError }, 'Failed to fetch user data from Firestore');
      // Continue without Firestore data - token is still valid
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email,
      role: userData.role || 'user',
      kycStatus: userData.kycStatus || 'pending',
    };

    next();
  } catch (error: any) {
    logger.warn({ error: error.message }, 'Firebase token verification failed');
    
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
      return;
    }
    
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or malformed'
      });
      return;
    }
    
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify your identity. Please log in again.'
    });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
      return;
    }

    if (!roles.includes(req.user.role || '')) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Require KYC verification
 */
export function requireKYC(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
    return;
  }

  if (req.user.kycStatus !== 'verified') {
    res.status(403).json({
      error: 'KYC verification required',
      message: 'You must complete KYC verification before performing financial operations'
    });
    return;
  }

  next();
}

/**
 * Optional authentication - adds user to request if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    if (!token || token.trim().length === 0) {
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data() || {};

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email,
      role: userData.role || 'user',
      kycStatus: userData.kycStatus || 'pending',
    };
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  
  next();
}

