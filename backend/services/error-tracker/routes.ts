import { Router, Request, Response } from 'express';
import { logger } from '../../common/logger';
import { prisma } from '../../common/prisma';

const router = Router();

/**
 * Get error logs with filtering and pagination
 * GET /api/error-tracker?status=NEW&severity=CRITICAL&limit=50&offset=0
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      severity, 
      errorType,
      userId,
      limit = 50, 
      offset = 0,
      startDate,
      endDate,
    } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status as string;
    }
    
    if (severity) {
      where.severity = severity as string;
    }
    
    if (errorType) {
      where.errorType = { contains: errorType as string, mode: 'insensitive' };
    }
    
    if (userId) {
      where.userId = userId as string;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }
    
    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { lastSeenAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.errorLog.count({ where }),
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
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to fetch error logs');
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
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [total, bySeverity, byStatus, recent] = await Promise.all([
      prisma.errorLog.count(),
      prisma.errorLog.groupBy({
        by: ['severity'],
        _count: true,
        where: {
          status: { not: 'RESOLVED' },
        },
      }),
      prisma.errorLog.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.errorLog.findMany({
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
      bySeverity: bySeverity.reduce((acc: Record<string, number>, item: any) => {
        acc[item.severity] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentCritical: recent,
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to fetch error statistics');
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const error = await prisma.errorLog.findUnique({
      where: { id: req.params.id },
    });
    
    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    res.json(error);
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to fetch error');
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
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, resolutionNotes } = req.body;
    
    if (!status || !['NEW', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: NEW, ACKNOWLEDGED, RESOLVED, IGNORED',
      });
    }
    
    const updateData: any = {
      status,
      resolutionNotes: resolutionNotes || null,
    };
    
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      // You can get the current user from req.user if you have auth middleware
      // updateData.resolvedBy = req.user?.id;
    } else {
      updateData.resolvedAt = null;
      updateData.resolvedBy = null;
    }
    
    const error = await prisma.errorLog.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    logger.info({ errorId: error.id, status }, 'Error status updated');
    res.json(error);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    logger.error({ err: error }, 'Failed to update error status');
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
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.errorLog.delete({
      where: { id: req.params.id },
    });
    
    logger.info({ errorId: req.params.id }, 'Error log deleted');
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Error not found' });
    }
    
    logger.error({ err: error }, 'Failed to delete error');
    res.status(500).json({
      error: 'Failed to delete error',
      message: error.message,
    });
  }
});

export default router;

