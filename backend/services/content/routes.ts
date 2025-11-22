import { Router, Request, Response } from 'express';
import { ContentService } from './src/content-service';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { prisma } from '../../common/prisma';
import { ContentType, ContentStatus } from '@prisma/client';

const router = Router();
const contentService = new ContentService(prisma);

/**
 * GET /content
 * List content with filters
 */
router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      contentType,
      status,
      authorId,
      category,
      search,
      limit,
      offset,
    } = req.query;

    const result = await contentService.listContent({
      contentType: contentType as ContentType | undefined,
      status: status as ContentStatus | undefined,
      authorId: authorId as string | undefined,
      category: category as string | undefined,
      search: search as string | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error listing content:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /content/stats
 * Get content statistics
 */
router.get('/stats', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get stats for current user (writers see their own, editors see all)
    const authorId = req.query.authorId as string | undefined;
    const stats = await contentService.getContentStats(authorId || userId);

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting content stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /content/:id
 * Get content by ID
 */
router.get('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    const content = await contentService.getContentById(id, userId);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error: any) {
    console.error('Error getting content:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /content/slug/:slug
 * Get content by slug (public)
 */
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const content = await contentService.getContentBySlug(slug);
    
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Only return if public and published
    if (!content.isPublic || content.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error: any) {
    console.error('Error getting content by slug:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /content
 * Create new content
 */
router.post('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user name from request or use email
    const authorName = req.user?.name || req.user?.email || 'Unknown';

    const content = await contentService.createContent({
      ...req.body,
      authorId: userId,
      authorName,
    });

    res.status(201).json(content);
  } catch (error: any) {
    console.error('Error creating content:', error);
    res.status(400).json({ error: error.message || 'Invalid content data' });
  }
});

/**
 * PATCH /content/:id
 * Update content
 */
router.patch('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const content = await contentService.updateContent(id, userId, req.body);
    res.json(content);
  } catch (error: any) {
    console.error('Error updating content:', error);
    if (error.message === 'Content not found' || error.message.includes('Unauthorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Invalid update data' });
  }
});

/**
 * POST /content/:id/publish
 * Publish content
 */
router.post('/:id/publish', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const content = await contentService.publishContent(id, userId);
    res.json(content);
  } catch (error: any) {
    console.error('Error publishing content:', error);
    if (error.message === 'Content not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to publish' });
  }
});

/**
 * POST /content/:id/unpublish
 * Unpublish content
 */
router.post('/:id/unpublish', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const content = await contentService.unpublishContent(id, userId);
    res.json(content);
  } catch (error: any) {
    console.error('Error unpublishing content:', error);
    if (error.message === 'Content not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to unpublish' });
  }
});

/**
 * DELETE /content/:id
 * Delete content
 */
router.delete('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await contentService.deleteContent(id, userId);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting content:', error);
    if (error.message === 'Content not found' || error.message.includes('Unauthorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to delete content' });
  }
});

/**
 * GET /content/:id/versions
 * Get version history
 */
router.get('/:id/versions', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user has access to content
    const content = await contentService.getContentById(id, userId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const versions = await contentService.getVersionHistory(id);
    res.json(versions);
  } catch (error: any) {
    console.error('Error getting version history:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /content/:id/restore/:version
 * Restore content to a specific version
 */
router.post('/:id/restore/:version', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, version } = req.params;
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const content = await contentService.restoreVersion(id, parseInt(version), userId);
    res.json(content);
  } catch (error: any) {
    console.error('Error restoring version:', error);
    if (error.message === 'Content not found' || error.message === 'Version not found' || error.message === 'Unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Failed to restore version' });
  }
});

export default router;

