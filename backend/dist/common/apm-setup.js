"use strict";
/**
 * APM (Application Performance Monitoring) Setup
 * Supports multiple APM providers: New Relic, Datadog, Prometheus
 */
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
exports.recordError = exports.recordEvent = exports.recordMetric = exports.apmMiddleware = exports.apmManager = void 0;
const logger_1 = require("./logger");
class APMManager {
    constructor() {
        this.newrelic = null;
        this.datadog = null;
        this.config = {
            provider: process.env.APM_PROVIDER || 'none',
            enabled: process.env.APM_ENABLED === 'true',
            apiKey: process.env.APM_API_KEY,
            appName: process.env.APM_APP_NAME || 'payvost-backend',
        };
        this.initialize();
    }
    async initialize() {
        if (!this.config.enabled || this.config.provider === 'none') {
            logger_1.logger.info('APM monitoring disabled');
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
                    logger_1.logger.info('Prometheus APM enabled (pull model)');
                    break;
            }
            logger_1.logger.info({ provider: this.config.provider }, 'APM initialized');
        }
        catch (error) {
            logger_1.logger.error({ err: error, provider: this.config.provider }, 'Failed to initialize APM');
        }
    }
    async initNewRelic() {
        try {
            // Dynamic import to avoid requiring newrelic as dependency
            const newrelic = await Promise.resolve(`${'newrelic'}`).then(s => __importStar(require(s))).catch(() => null);
            if (newrelic) {
                this.newrelic = newrelic.default || newrelic;
                logger_1.logger.info('New Relic APM initialized');
            }
        }
        catch (error) {
            logger_1.logger.warn('New Relic not installed. Install with: npm install newrelic');
            this.config.enabled = false;
        }
    }
    async initDatadog() {
        try {
            // Dynamic import
            const tracer = await Promise.resolve(`${'dd-trace'}`).then(s => __importStar(require(s))).catch(() => null);
            if (tracer) {
                tracer.init({
                    service: this.config.appName,
                    env: process.env.NODE_ENV || 'development',
                });
                this.datadog = tracer;
                logger_1.logger.info('Datadog APM initialized');
            }
        }
        catch (error) {
            logger_1.logger.warn('Datadog tracer not installed. Install with: npm install dd-trace');
            this.config.enabled = false;
        }
    }
    /**
     * Express middleware for APM transaction tracking
     */
    trackTransaction() {
        return (req, res, next) => {
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
    recordMetric(name, value, tags) {
        if (!this.config.enabled)
            return;
        switch (this.config.provider) {
            case 'newrelic':
                if (this.newrelic) {
                    this.newrelic.recordMetric(name, value);
                }
                break;
            case 'datadog':
                if (this.datadog) {
                    // Datadog metrics would be sent via StatsD or HTTP API
                    logger_1.logger.debug({ name, value, tags }, 'Datadog metric (requires StatsD client)');
                }
                break;
            case 'prometheus':
                // Prometheus metrics are exposed via /metrics endpoint
                logger_1.logger.debug({ name, value, tags }, 'Prometheus metric');
                break;
        }
    }
    /**
     * Record custom event
     */
    recordEvent(name, attributes) {
        if (!this.config.enabled)
            return;
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
    recordError(error, attributes) {
        if (!this.config.enabled)
            return;
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
exports.apmManager = new APMManager();
/**
 * Express middleware for APM
 */
exports.apmMiddleware = exports.apmManager.trackTransaction();
/**
 * Helper functions
 */
const recordMetric = (name, value, tags) => {
    exports.apmManager.recordMetric(name, value, tags);
};
exports.recordMetric = recordMetric;
const recordEvent = (name, attributes) => {
    exports.apmManager.recordEvent(name, attributes);
};
exports.recordEvent = recordEvent;
const recordError = (error, attributes) => {
    exports.apmManager.recordError(error, attributes);
};
exports.recordError = recordError;
