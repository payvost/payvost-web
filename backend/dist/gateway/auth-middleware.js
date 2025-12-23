"use strict";
/**
 * Standardized Authentication Middleware
 * Centralized authentication for all backend services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.verifyFirebaseToken = verifyFirebaseToken;
exports.requireRole = requireRole;
exports.requireKYC = requireKYC;
exports.optionalAuth = optionalAuth;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const logger_1 = require("../common/logger");
/**
 * Verify Firebase ID token or session cookie
 * Standard authentication middleware for all protected routes
 */
async function verifyFirebaseToken(req, res, next) {
    try {
        let decodedToken;
        // Try to get token from Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token && token.trim().length > 0) {
                // Verify Firebase ID token
                decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
            }
            else {
                res.status(401).json({
                    error: 'Authentication required',
                    message: 'Token is required'
                });
                return;
            }
        }
        else {
            // Try to get session cookie from cookies
            const cookies = req.headers.cookie || '';
            const sessionCookieMatch = cookies.match(/(?:^|;\s*)(?:writer_session|session|support_session)=([^;]*)/);
            if (sessionCookieMatch && sessionCookieMatch[1]) {
                const sessionCookie = sessionCookieMatch[1];
                try {
                    // Verify session cookie
                    decodedToken = await firebase_admin_1.default.auth().verifySessionCookie(sessionCookie, true);
                }
                catch (cookieError) {
                    logger_1.logger.warn({ error: cookieError.message }, 'Session cookie verification failed');
                    res.status(401).json({
                        error: 'Authentication required',
                        message: 'Missing or invalid authorization. Please log in again.'
                    });
                    return;
                }
            }
            else {
                res.status(401).json({
                    error: 'Authentication required',
                    message: 'Missing or invalid authorization header. Expected: Bearer <token> or session cookie'
                });
                return;
            }
        }
        // Fetch user data from Firestore for additional context
        let userData = {};
        try {
            const userDoc = await firebase_admin_1.default.firestore().collection('users').doc(decodedToken.uid).get();
            userData = userDoc.data() || {};
        }
        catch (firestoreError) {
            logger_1.logger.warn({ uid: decodedToken.uid, error: firestoreError }, 'Failed to fetch user data from Firestore');
            // Continue without Firestore data - token is still valid
        }
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || userData.email,
            role: userData.role || 'user',
            kycStatus: userData.kycStatus || 'pending',
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn({ error: error.message }, 'Firebase token verification failed');
        if (error.code === 'auth/id-token-expired' || error.code === 'auth/session-cookie-expired') {
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
function requireRole(...roles) {
    return (req, res, next) => {
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
exports.requireAdmin = requireRole('admin', 'super_admin');
/**
 * Require KYC verification
 */
function requireKYC(req, res, next) {
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
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        if (!token || token.trim().length === 0) {
            return next();
        }
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        const userDoc = await firebase_admin_1.default.firestore().collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data() || {};
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || userData.email,
            role: userData.role || 'user',
            kycStatus: userData.kycStatus || 'pending',
        };
    }
    catch (error) {
        // Ignore auth errors for optional auth
    }
    next();
}
