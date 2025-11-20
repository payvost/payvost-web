"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiKeyLimiter = exports.transactionLimiter = exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900),
        });
    },
});
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true, // Don't count successful requests
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many authentication attempts, please try again later.',
            retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 900),
        });
    },
});
/**
 * Rate limiter for financial transactions
 * 20 requests per minute per IP
 */
exports.transactionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 transactions per minute
    message: 'Too many transaction requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many transaction requests, please try again later.',
            retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime.getTime() - Date.now()) / 1000 : 60),
        });
    },
});
/**
 * Rate limiter for API key-based requests
 * Uses a custom key generator based on API key instead of IP
 */
const createApiKeyLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => {
            // Use API key from header if present, otherwise fall back to IP
            const apiKey = req.headers['x-api-key'];
            return apiKey || req.ip || 'unknown';
        },
        message: 'API rate limit exceeded',
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createApiKeyLimiter = createApiKeyLimiter;
