"use strict";
/**
 * Rapyd Service for Backend
 *
 * Service for integrating with Rapyd API from the backend
 * Services: Wallets, Payments, Payouts, Virtual Accounts
 * Documentation: https://docs.rapyd.net/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rapydService = exports.RapydError = void 0;
const crypto_1 = require("crypto");
/**
 * Rapyd API Error
 */
class RapydError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = 'RapydError';
    }
}
exports.RapydError = RapydError;
/**
 * Rapyd API Endpoints
 */
const RAPYD_ENDPOINTS = {
    WALLETS: '/v1/user',
    WALLET_BY_ID: '/v1/user/:walletId',
};
/**
 * Get Rapyd base URL based on environment
 */
function getRapydBaseUrl() {
    const env = process.env.RAPYD_ENV || 'sandbox';
    const isProduction = env === 'production';
    return isProduction
        ? 'https://api.rapyd.net'
        : 'https://sandboxapi.rapyd.net';
}
/**
 * Rapyd Service Class
 */
class RapydService {
    constructor() {
        this.baseUrl = getRapydBaseUrl();
        this.accessKey = process.env.RAPYD_ACCESS_KEY || '';
        this.secretKey = process.env.RAPYD_SECRET_KEY || '';
    }
    /**
     * Generate HMAC signature for Rapyd API authentication
     * Rapyd uses a specific signature algorithm with salt and timestamp
     */
    generateSignature(httpMethod, urlPath, salt, timestamp, body = '') {
        try {
            // Build the string to sign
            const toSign = `${httpMethod}${urlPath}${salt}${timestamp}${this.accessKey}${this.secretKey}${body}`;
            // Create HMAC SHA-256 hash
            const hash = (0, crypto_1.createHmac)('sha256', this.secretKey)
                .update(toSign)
                .digest('hex');
            // Encode to base64
            return Buffer.from(hash).toString('base64');
        }
        catch (error) {
            throw new RapydError('Failed to generate signature');
        }
    }
    /**
     * Generate authentication headers for Rapyd API
     */
    getAuthHeaders(httpMethod, urlPath, body = '') {
        const salt = this.generateRandomString(12);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = this.generateSignature(httpMethod, urlPath, salt, timestamp, body);
        return {
            'access_key': this.accessKey,
            'salt': salt,
            'timestamp': timestamp,
            'signature': signature,
        };
    }
    /**
     * Generate random string for salt
     */
    generateRandomString(length) {
        return (0, crypto_1.randomBytes)(length).toString('base64').slice(0, length).replace(/[^a-zA-Z0-9]/g, '');
    }
    /**
     * Replace URL parameters
     */
    replaceUrlParams(url, params) {
        let result = url;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(`:${key}`, value);
        }
        return result;
    }
    /**
     * Make authenticated request to Rapyd API
     */
    async request(method, endpoint, data) {
        if (!this.accessKey || !this.secretKey) {
            throw new RapydError('Rapyd credentials not configured. Please set RAPYD_ACCESS_KEY and RAPYD_SECRET_KEY environment variables.');
        }
        const body = data ? JSON.stringify(data) : '';
        const urlPath = endpoint;
        const authHeaders = this.getAuthHeaders(method, urlPath, body);
        const url = `${this.baseUrl}${endpoint}`;
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: method !== 'GET' ? body : undefined,
            });
            // Check content type before parsing
            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            if (!isJson) {
                const text = await response.text();
                throw new RapydError(`Expected JSON response but received ${contentType || 'unknown content type'}: ${text.substring(0, 200)}`, response.status);
            }
            const result = await response.json();
            // Rapyd returns status in the body
            if (result.status?.status !== 'SUCCESS') {
                throw new RapydError(result.status?.message || 'Rapyd API request failed', response.status, result);
            }
            return result.data;
        }
        catch (error) {
            if (error instanceof RapydError) {
                throw error;
            }
            throw new RapydError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
    /**
     * Create a wallet
     */
    async createWallet(walletData) {
        try {
            return await this.request('POST', RAPYD_ENDPOINTS.WALLETS, walletData);
        }
        catch (error) {
            throw new RapydError(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get wallet by ID
     */
    async getWallet(walletId) {
        try {
            const endpoint = this.replaceUrlParams(RAPYD_ENDPOINTS.WALLET_BY_ID, { walletId });
            return await this.request('GET', endpoint);
        }
        catch (error) {
            throw new RapydError(`Failed to get wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
// Export singleton instance
exports.rapydService = new RapydService();
exports.default = exports.rapydService;
