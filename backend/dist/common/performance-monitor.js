"use strict";
/**
 * Performance Monitoring
 * Tracks API response times, error rates, and system metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = exports.performanceMonitor = void 0;
exports.getPerformanceStats = getPerformanceStats;
const logger_1 = require("./logger");
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.MAX_METRICS = 10000; // Keep last 10k metrics in memory
    }
    /**
     * Middleware to track request performance
     */
    trackRequest() {
        return (req, res, next) => {
            const startTime = Date.now();
            const endpoint = req.path;
            const method = req.method;
            // Track response time
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                const statusCode = res.statusCode;
                const metric = {
                    endpoint,
                    method,
                    responseTime,
                    statusCode,
                    timestamp: new Date(),
                    userId: req.user?.uid,
                    ipAddress: req.ip,
                };
                this.recordMetric(metric);
                // Log slow requests (>1 second)
                if (responseTime > 1000) {
                    logger_1.logger.warn({
                        endpoint,
                        method,
                        responseTime,
                        statusCode,
                    }, 'Slow request detected');
                }
                // Log errors
                if (statusCode >= 500) {
                    logger_1.logger.error({
                        endpoint,
                        method,
                        responseTime,
                        statusCode,
                    }, 'Server error detected');
                }
            });
            next();
        };
    }
    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        this.metrics.push(metric);
        // Keep only last MAX_METRICS
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics.shift();
        }
    }
    /**
     * Get performance statistics for an endpoint
     */
    getEndpointStats(endpoint, timeWindowMinutes = 60) {
        const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
        const relevantMetrics = this.metrics.filter(m => m.endpoint === endpoint && m.timestamp >= cutoff);
        if (relevantMetrics.length === 0) {
            return {
                count: 0,
                avgResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0,
                errorRate: 0,
                p50: 0,
                p95: 0,
                p99: 0,
            };
        }
        const responseTimes = relevantMetrics.map(m => m.responseTime).sort((a, b) => a - b);
        const errors = relevantMetrics.filter(m => m.statusCode >= 400).length;
        return {
            count: relevantMetrics.length,
            avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            minResponseTime: responseTimes[0],
            maxResponseTime: responseTimes[responseTimes.length - 1],
            errorRate: errors / relevantMetrics.length,
            p50: this.percentile(responseTimes, 50),
            p95: this.percentile(responseTimes, 95),
            p99: this.percentile(responseTimes, 99),
        };
    }
    /**
     * Calculate percentile
     */
    percentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)] || 0;
    }
    /**
     * Get all metrics (for export/analysis)
     */
    getAllMetrics() {
        return [...this.metrics];
    }
    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics = [];
    }
    /**
     * Get system health metrics
     */
    getSystemHealth() {
        const lastHour = new Date(Date.now() - 60 * 60 * 1000);
        const recentMetrics = this.metrics.filter(m => m.timestamp >= lastHour);
        if (recentMetrics.length === 0) {
            return {
                totalRequests: 0,
                errorRate: 0,
                avgResponseTime: 0,
                slowRequests: 0,
            };
        }
        const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
        const slow = recentMetrics.filter(m => m.responseTime > 1000).length;
        const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
        return {
            totalRequests: recentMetrics.length,
            errorRate: errors / recentMetrics.length,
            avgResponseTime,
            slowRequests: slow,
        };
    }
}
// Singleton instance
exports.performanceMonitor = new PerformanceMonitor();
/**
 * Express middleware for performance monitoring
 */
exports.performanceMiddleware = exports.performanceMonitor.trackRequest();
/**
 * Get performance stats endpoint handler
 */
function getPerformanceStats(req, res) {
    const endpoint = req.query.endpoint;
    const timeWindow = parseInt(req.query.timeWindow) || 60;
    if (endpoint) {
        const stats = exports.performanceMonitor.getEndpointStats(endpoint, timeWindow);
        res.json({ endpoint, timeWindow, ...stats });
    }
    else {
        const health = exports.performanceMonitor.getSystemHealth();
        res.json({ systemHealth: health });
    }
}
