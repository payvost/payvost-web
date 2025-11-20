"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../../common/logger");
const prisma_1 = require("../../common/prisma");
const router = (0, express_1.Router)();
/**
 * Get error logs with filtering and pagination
 * GET /api/error-tracker?status=NEW&severity=CRITICAL&limit=50&offset=0
 */
router.get('/', async (req, res) => {
    try {
        const { status, severity, errorType, userId, limit = 50, offset = 0, startDate, endDate, } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (severity) {
            where.severity = severity;
        }
        if (errorType) {
            where.errorType = { contains: errorType, mode: 'insensitive' };
        }
        if (userId) {
            where.userId = userId;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const [errors, total] = await Promise.all([
            prisma_1.prisma.errorLog.findMany({
                where,
                orderBy: { lastSeenAt: 'desc' },
                take: Number(limit),
                skip: Number(offset),
            }),
            prisma_1.prisma.errorLog.count({ where }),
        ]);
        res.json({
            errors,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: Number(offset) + Number(limit) < total,
            },
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to fetch error logs');
        res.status(500).json({
            error: 'Failed to fetch error logs',
            message: error.message,
        });
    }
});
/**
 * Get error statistics
 * GET /api/error-tracker/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const [total, bySeverity, byStatus, recent] = await Promise.all([
            prisma_1.prisma.errorLog.count(),
            prisma_1.prisma.errorLog.groupBy({
                by: ['severity'],
                _count: true,
                where: {
                    status: { not: 'RESOLVED' },
                },
            }),
            prisma_1.prisma.errorLog.groupBy({
                by: ['status'],
                _count: true,
            }),
            prisma_1.prisma.errorLog.findMany({
                where: {
                    status: { not: 'RESOLVED' },
                    severity: { in: ['HIGH', 'CRITICAL'] },
                },
                orderBy: { lastSeenAt: 'desc' },
                take: 10,
            }),
        ]);
        res.json({
            total,
            bySeverity: bySeverity.reduce((acc, item) => {
                acc[item.severity] = item._count;
                return acc;
            }, {}),
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {}),
            recentCritical: recent,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to fetch error statistics');
        res.status(500).json({
            error: 'Failed to fetch error statistics',
            message: error.message,
        });
    }
});
/**
 * Get error by ID
 * GET /api/error-tracker/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const error = await prisma_1.prisma.errorLog.findUnique({
            where: { id: req.params.id },
        });
        if (!error) {
            return res.status(404).json({ error: 'Error not found' });
        }
        res.json(error);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to fetch error');
        res.status(500).json({
            error: 'Failed to fetch error',
            message: error.message,
        });
    }
});
/**
 * Update error status
 * PATCH /api/error-tracker/:id/status
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        if (!status || !['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                message: 'Status must be one of: NEW, ACKNOWLEDGED, RESOLVED, IGNORED',
            });
        }
        const updateData = {
            status,
            resolutionNotes: resolutionNotes || null,
        };
        if (status === 'RESOLVED') {
            updateData.resolvedAt = new Date();
            // You can get the current user from req.user if you have auth middleware
            // updateData.resolvedBy = req.user?.id;
        }
        else {
            updateData.resolvedAt = null;
            updateData.resolvedBy = null;
        }
        const error = await prisma_1.prisma.errorLog.update({
            where: { id: req.params.id },
            data: updateData,
        });
        logger_1.logger.info({ errorId: error.id, status }, 'Error status updated');
        res.json(error);
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Error not found' });
        }
        logger_1.logger.error({ err: error }, 'Failed to update error status');
        res.status(500).json({
            error: 'Failed to update error status',
            message: error.message,
        });
    }
});
/**
 * Delete error log
 * DELETE /api/error-tracker/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.prisma.errorLog.delete({
            where: { id: req.params.id },
        });
        logger_1.logger.info({ errorId: req.params.id }, 'Error log deleted');
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Error not found' });
        }
        logger_1.logger.error({ err: error }, 'Failed to delete error');
        res.status(500).json({
            error: 'Failed to delete error',
            message: error.message,
        });
    }
});
exports.default = router;
