"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const content_service_1 = require("./src/content-service");
const middleware_1 = require("../../gateway/middleware");
const prisma_1 = require("../../common/prisma");
const router = (0, express_1.Router)();
const contentService = new content_service_1.ContentService(prisma_1.prisma);
/**
 * GET /content
 * List content with filters
 */
router.get('/', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { contentType, status, authorId, category, search, limit, offset, } = req.query;
        const result = await contentService.listContent({
            contentType: contentType,
            status: status,
            authorId: authorId,
            category: category,
            search: search,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error listing content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /content/stats
 * Get content statistics
 */
router.get('/stats', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get stats for current user (writers see their own, editors see all)
        const authorId = req.query.authorId;
        const stats = await contentService.getContentStats(authorId || userId);
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting content stats:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /content/:id
 * Get content by ID
 */
router.get('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        const content = await contentService.getContentById(id, userId);
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        res.json(content);
    }
    catch (error) {
        console.error('Error getting content:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * GET /content/slug/:slug
 * Get content by slug (public)
 */
router.get('/slug/:slug', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error getting content by slug:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * POST /content
 * Create new content
 */
router.post('/', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Get user name from request or use email
        const authorName = req.user?.email || 'Unknown';
        const content = await contentService.createContent({
            ...req.body,
            authorId: userId,
            authorName,
        });
        res.status(201).json(content);
    }
    catch (error) {
        console.error('Error creating content:', error);
        res.status(400).json({ error: error.message || 'Invalid content data' });
    }
});
/**
 * PATCH /content/:id
 * Update content
 */
router.patch('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const content = await contentService.updateContent(id, userId, req.body);
        res.json(content);
    }
    catch (error) {
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
router.post('/:id/publish', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const content = await contentService.publishContent(id, userId);
        res.json(content);
    }
    catch (error) {
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
router.post('/:id/unpublish', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const content = await contentService.unpublishContent(id, userId);
        res.json(content);
    }
    catch (error) {
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
router.delete('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        await contentService.deleteContent(id, userId);
        res.status(204).send();
    }
    catch (error) {
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
router.get('/:id/versions', middleware_1.verifyFirebaseToken, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error getting version history:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
/**
 * POST /content/:id/restore/:version
 * Restore content to a specific version
 */
router.post('/:id/restore/:version', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id, version } = req.params;
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const content = await contentService.restoreVersion(id, parseInt(version), userId);
        res.json(content);
    }
    catch (error) {
        console.error('Error restoring version:', error);
        if (error.message === 'Content not found' || error.message === 'Version not found' || error.message === 'Unauthorized') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message || 'Failed to restore version' });
    }
});
/**
 * POST /content/:id/view
 * Increment view count (public endpoint, no auth required)
 */
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        await contentService.incrementViewCount(id);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error incrementing view count:', error);
        // Don't fail the request if view tracking fails
        res.json({ success: false });
    }
});
exports.default = router;
