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
exports.requireAdmin = void 0;
exports.verifyFirebaseToken = verifyFirebaseToken;
exports.verifyJWT = verifyJWT;
exports.requireRole = requireRole;
exports.requireKYC = requireKYC;
exports.optionalAuth = optionalAuth;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const jwt = __importStar(require("jsonwebtoken"));
const index_1 = require("./index");
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'changeme') {
    throw new Error('JWT_SECRET must be set in environment variables and cannot be "changeme". ' +
        'Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}
/**
 * Middleware to verify Firebase ID tokens
 */
async function verifyFirebaseToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new index_1.AuthenticationError('Missing or invalid authorization header');
        }
        const token = authHeader.substring(7);
        // Verify Firebase token
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        // Fetch user data from Firestore
        const userDoc = await firebase_admin_1.default.firestore().collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: userData?.role || 'user',
            kycStatus: userData?.kycStatus || 'pending',
        };
        next();
    }
    catch (error) {
        if (error.code === 'auth/id-token-expired') {
            return next(new index_1.AuthenticationError('Token expired'));
        }
        if (error.code === 'auth/argument-error') {
            return next(new index_1.AuthenticationError('Invalid token format'));
        }
        next(new index_1.AuthenticationError('Authentication failed'));
    }
}
/**
 * Middleware to verify JWT tokens (alternative to Firebase)
 */
function verifyJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new index_1.AuthenticationError('Missing or invalid authorization header');
        }
        const token = authHeader.substring(7);
        // JWT_SECRET is validated at module load time, so it's safe to use here
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            uid: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            kycStatus: decoded.kycStatus,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new index_1.AuthenticationError('Token expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new index_1.AuthenticationError('Invalid token'));
        }
        next(new index_1.AuthenticationError('Authentication failed'));
    }
}
/**
 * Middleware to check if user has required role
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new index_1.AuthenticationError('Not authenticated'));
        }
        if (!roles.includes(req.user.role || 'user')) {
            return next(new index_1.AuthorizationError('Insufficient permissions'));
        }
        next();
    };
}
/**
 * Middleware to check if user has completed KYC
 */
function requireKYC(req, res, next) {
    if (!req.user) {
        return next(new index_1.AuthenticationError('Not authenticated'));
    }
    if (req.user.kycStatus !== 'verified') {
        return next(new index_1.KYCError('KYC verification required. Please complete identity verification to access this feature.'));
    }
    next();
}
/**
 * Middleware to check if user is admin
 */
exports.requireAdmin = requireRole('admin', 'superadmin');
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
        const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
        const userDoc = await firebase_admin_1.default.firestore().collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: userData?.role || 'user',
            kycStatus: userData?.kycStatus || 'pending',
        };
    }
    catch (error) {
        // Ignore auth errors for optional auth
    }
    next();
}
