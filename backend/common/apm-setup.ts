/**
 * APM (Application Performance Monitoring) Setup
 * Supports multiple APM providers: New Relic, Datadog, Prometheus
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface APMConfig {
  provider: 'newrelic' | 'datadog' | 'prometheus' | 'none';
  enabled: boolean;
  apiKey?: string;
  appName?: string;
}

class APMManager {
  private config: APMConfig;
  private newrelic: any = null;
  private datadog: any = null;

  constructor() {
    this.config = {
      provider: (process.env.APM_PROVIDER as any) || 'none',
      enabled: process.env.APM_ENABLED === 'true',
      apiKey: process.env.APM_API_KEY,
      appName: process.env.APM_APP_NAME || 'payvost-backend',
    };

    this.initialize();
  }

  private async initialize() {
    if (!this.config.enabled || this.config.provider === 'none') {
      logger.info('APM monitoring disabled');
      return;
    }

    try {
      switch (this.config.provider) {
        case 'newrelic':
          await this.initNewRelic();
          break;
        case 'datadog':
          await this.initDatadog();
          break;
        case 'prometheus':
          // Prometheus uses pull model, no initialization needed
          logger.info('Prometheus APM enabled (pull model)');
          break;
      }
      logger.info({ provider: this.config.provider }, 'APM initialized');
    } catch (error) {
      logger.error({ err: error, provider: this.config.provider }, 'Failed to initialize APM');
    }
  }

  private async initNewRelic() {
    try {
      // Dynamic import to avoid requiring newrelic as dependency
      const newrelic = await import('newrelic' as any).catch(() => null);
      if (newrelic) {
        this.newrelic = (newrelic as any).default || newrelic;
        logger.info('New Relic APM initialized');
      }
    } catch (error) {
      logger.warn('New Relic not installed. Install with: npm install newrelic');
      this.config.enabled = false;
    }
  }

  private async initDatadog() {
    try {
      // Dynamic import
      const tracer = await import('dd-trace' as any).catch(() => null);
      if (tracer) {
        (tracer as any).init({
          service: this.config.appName,
          env: process.env.NODE_ENV || 'development',
        });
        this.datadog = tracer;
        logger.info('Datadog APM initialized');
      }
    } catch (error) {
      logger.warn('Datadog tracer not installed. Install with: npm install dd-trace');
      this.config.enabled = false;
    }
  }

  /**
   * Express middleware for APM transaction tracking
   */
  trackTransaction() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      const transactionName = `${req.method} ${req.path}`;

      switch (this.config.provider) {
        case 'newrelic':
          if (this.newrelic) {
            this.newrelic.setTransactionName(transactionName);
            this.newrelic.addCustomAttribute('http.method', req.method);
            this.newrelic.addCustomAttribute('http.url', req.url);
          }
          break;
        case 'datadog':
          if (this.datadog) {
            const span = this.datadog.scope().active();
            if (span) {
              span.setTag('http.method', req.method);
              span.setTag('http.url', req.url);
              span.setTag('resource.name', transactionName);
            }
          }
          break;
      }

      next();
    };
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;

    switch (this.config.provider) {
      case 'newrelic':
        if (this.newrelic) {
          this.newrelic.recordMetric(name, value);
        }
        break;
      case 'datadog':
        if (this.datadog) {
          // Datadog metrics would be sent via StatsD or HTTP API
          logger.debug({ name, value, tags }, 'Datadog metric (requires StatsD client)');
        }
        break;
      case 'prometheus':
        // Prometheus metrics are exposed via /metrics endpoint
        logger.debug({ name, value, tags }, 'Prometheus metric');
        break;
    }
  }

  /**
   * Record custom event
   */
  recordEvent(name: string, attributes: Record<string, any>): void {
    if (!this.config.enabled) return;

    switch (this.config.provider) {
      case 'newrelic':
        if (this.newrelic) {
          this.newrelic.recordCustomEvent(name, attributes);
        }
        break;
      case 'datadog':
        if (this.datadog) {
          const span = this.datadog.scope().active();
          if (span) {
            Object.entries(attributes).forEach(([key, value]) => {
              span.setTag(`event.${key}`, String(value));
            });
          }
        }
        break;
    }
  }

  /**
   * Record error
   */
  recordError(error: Error, attributes?: Record<string, any>): void {
    if (!this.config.enabled) return;

    switch (this.config.provider) {
      case 'newrelic':
        if (this.newrelic) {
          this.newrelic.noticeError(error, attributes);
        }
        break;
      case 'datadog':
        if (this.datadog) {
          const span = this.datadog.scope().active();
          if (span) {
            span.setTag('error', true);
            span.setTag('error.message', error.message);
            span.setTag('error.type', error.name);
            if (attributes) {
              Object.entries(attributes).forEach(([key, value]) => {
                span.setTag(`error.${key}`, String(value));
              });
            }
          }
        }
        break;
    }
  }
}

// Singleton instance
export const apmManager = new APMManager();

/**
 * Express middleware for APM
 */
export const apmMiddleware = apmManager.trackTransaction();

/**
 * Helper functions
 */
export const recordMetric = (name: string, value: number, tags?: Record<string, string>) => {
  apmManager.recordMetric(name, value, tags);
};

export const recordEvent = (name: string, attributes: Record<string, any>) => {
  apmManager.recordEvent(name, attributes);
};

export const recordError = (error: Error, attributes?: Record<string, any>) => {
  apmManager.recordError(error, attributes);
};

