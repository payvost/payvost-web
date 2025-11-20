"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
exports.initRedis = initRedis;
exports.getRedis = getRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
let redisClient = null;
/**
 * Initialize Redis connection
 */
function initRedis() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        logger_1.logger.warn('Redis URL not configured. Caching will be disabled.');
        return null;
    }
    try {
        redisClient = new ioredis_1.default(redisUrl, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                logger_1.logger.warn({ delay, attempt: times }, 'Redis connection retry');
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
        });
        redisClient.on('connect', () => {
            logger_1.logger.info('Redis client connected');
        });
        redisClient.on('ready', () => {
            logger_1.logger.info('Redis client ready');
        });
        redisClient.on('error', (error) => {
            logger_1.logger.error({ err: error }, 'Redis client error');
        });
        redisClient.on('close', () => {
            logger_1.logger.warn('Redis client connection closed');
        });
        // Connect to Redis
        redisClient.connect().catch((error) => {
            logger_1.logger.error({ err: error }, 'Failed to connect to Redis');
            redisClient = null;
        });
        return redisClient;
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to initialize Redis');
        return null;
    }
}
/**
 * Get Redis client instance
 */
function getRedis() {
    return redisClient;
}
/**
 * Cache helper functions
 */
class CacheService {
    constructor() {
        this.client = getRedis();
    }
    /**
     * Get value from cache
     */
    async get(key) {
        if (!this.client) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error({ err: error, key }, 'Cache get error');
            return null;
        }
    }
    /**
     * Set value in cache with TTL
     */
    async set(key, value, ttlSeconds = 300) {
        if (!this.client) {
            return false;
        }
        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(value));
            return true;
        }
        catch (error) {
            logger_1.logger.error({ err: error, key }, 'Cache set error');
            return false;
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key) {
        if (!this.client) {
            return false;
        }
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            logger_1.logger.error({ err: error, key }, 'Cache delete error');
            return false;
        }
    }
    /**
     * Delete multiple keys matching pattern
     */
    async deletePattern(pattern) {
        if (!this.client) {
            return 0;
        }
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            return await this.client.del(...keys);
        }
        catch (error) {
            logger_1.logger.error({ err: error, pattern }, 'Cache delete pattern error');
            return 0;
        }
    }
    /**
     * Check if key exists
     */
    async exists(key) {
        if (!this.client) {
            return false;
        }
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error({ err: error, key }, 'Cache exists error');
            return false;
        }
    }
    /**
     * Get or set with cache
     */
    async getOrSet(key, fetchFn, ttlSeconds = 300) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await fetchFn();
        await this.set(key, value, ttlSeconds);
        return value;
    }
}
exports.CacheService = CacheService;
// Export singleton instance
exports.cacheService = new CacheService();
