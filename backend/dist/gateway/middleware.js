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
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireKYC = exports.requireAdmin = exports.requireRole = exports.verifyFirebaseToken = void 0;
exports.verifyJWT = verifyJWT;
const jwt = __importStar(require("jsonwebtoken"));
const index_1 = require("./index");
// Lazy check for JWT_SECRET - only validate when verifyJWT is actually called
function getJWTSecret() {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET || JWT_SECRET === 'changeme') {
        throw new Error('JWT_SECRET must be set in environment variables and cannot be "changeme". ' +
            'Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    return JWT_SECRET;
}
/**
 * Re-export all authentication middleware from auth-middleware
 */
var auth_middleware_1 = require("./auth-middleware");
Object.defineProperty(exports, "verifyFirebaseToken", { enumerable: true, get: function () { return auth_middleware_1.verifyFirebaseToken; } });
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return auth_middleware_1.requireRole; } });
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return auth_middleware_1.requireAdmin; } });
Object.defineProperty(exports, "requireKYC", { enumerable: true, get: function () { return auth_middleware_1.requireKYC; } });
Object.defineProperty(exports, "optionalAuth", { enumerable: true, get: function () { return auth_middleware_1.optionalAuth; } });
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
        const decoded = jwt.verify(token, getJWTSecret());
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
