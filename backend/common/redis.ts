import Redis from 'ioredis';
import { logger } from './logger';

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.warn('Redis URL not configured. Caching will be disabled.');
    return null;
  }

  try {
    const defaultMaxRetryAttempts = process.env.NODE_ENV === 'production' ? 50 : 10;
    const parsedMaxRetryAttempts = Number(process.env.REDIS_MAX_RETRY_ATTEMPTS);
    const maxRetryAttempts =
      Number.isFinite(parsedMaxRetryAttempts) && parsedMaxRetryAttempts >= 0
        ? parsedMaxRetryAttempts
        : defaultMaxRetryAttempts;

    const client = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        // If the hostname doesn't exist (ENOTFOUND), retrying forever just spams logs.
        if (times > maxRetryAttempts) {
          logger.error(
            { attempt: times, maxRetryAttempts },
            'Redis connection retry limit reached; giving up'
          );
          if (redisClient === client) redisClient = null;
          return null; // Stop reconnecting.
        }

        const delay = Math.min(times * 50, 2000);
        logger.warn({ delay, attempt: times }, 'Redis connection retry');
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient = client;

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('error', (error: Error) => {
      logger.error({ err: error }, 'Redis client error');
    });

    client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    // Connect to Redis
    client.connect().catch((error: Error) => {
      logger.error({ err: error }, 'Failed to connect to Redis');
      try {
        client.disconnect();
      } catch {
        // Ignore: disconnect is best-effort.
      }
      if (redisClient === client) redisClient = null;
    });

    return client;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Redis');
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedis(): Redis | null {
  return redisClient;
}

/**
 * Cache helper functions
 */
export class CacheService {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (!client) {
      return null;
    }

    try {
      const value = await client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    const client = getRedis();
    if (!client) {
      return false;
    }

    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache set error');
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) {
      return false;
    }

    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const client = getRedis();
    if (!client) {
      return 0;
    }

    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await client.del(...keys);
    } catch (error) {
      logger.error({ err: error, pattern }, 'Cache delete pattern error');
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client) {
      return false;
    }

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ err: error, key }, 'Cache exists error');
      return false;
    }
  }

  /**
   * Get or set with cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

