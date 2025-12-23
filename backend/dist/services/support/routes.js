"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const prisma_1 = require("../../common/prisma");
const SupportService = __importStar(require("./service"));
const db = firebase_admin_1.default.firestore();
const router = (0, express_1.Router)();
/**
 * Middleware to verify support team access
 */
async function requireSupportTeam(req, res, next) {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.AuthorizationError('Authentication required');
        }
        // Check support role in Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new index_1.AuthorizationError('User not found');
        }
        const userData = userDoc.data();
        const role = userData?.role?.toLowerCase() || '';
        // Support roles: support_agent, support_senior, support_supervisor, support_manager
        // Also allow admin and super_admin
        const hasSupportRole = role.startsWith('support_') || role === 'admin' || role === 'super_admin';
        if (!hasSupportRole) {
            throw new index_1.AuthorizationError('Support team access required');
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/support/tickets
 * List tickets with filters
 */
router.get('/tickets', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            assignedToId: req.query.assignedToId === 'null' ? null : req.query.assignedToId,
            customerId: req.query.customerId,
            category: req.query.category,
            search: req.query.search,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
        };
        const result = await SupportService.listTickets(filters);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch tickets' });
    }
});
/**
 * GET /api/support/tickets/stats
 * Get ticket statistics
 */
router.get('/tickets/stats', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const assignedToId = req.query.assignedToId;
        const stats = await SupportService.getTicketStats(assignedToId);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch stats' });
    }
});
/**
 * GET /api/support/tickets/:id
 * Get ticket by ID
 */
router.get('/tickets/:id', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const ticket = await SupportService.getTicketById(req.params.id);
        res.json(ticket);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to fetch ticket' });
        }
    }
});
/**
 * POST /api/support/tickets
 * Create a new ticket (Support team only - can create for any customer)
 */
router.post('/tickets', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { subject, description, category, priority, customerId, tags } = req.body;
        if (!subject || !description || !category || !customerId) {
            throw new index_1.ValidationError('Missing required fields: subject, description, category, customerId');
        }
        const ticket = await SupportService.createTicket({
            subject,
            description,
            category,
            priority,
            customerId,
            tags,
        }, userId);
        res.status(201).json(ticket);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to create ticket' });
        }
    }
});
/**
 * POST /api/support/tickets/customer
 * Create a new ticket (Customer-facing - can only create for themselves)
 */
router.post('/tickets/customer', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { subject, description, category, priority, tags, metadata } = req.body;
        if (!subject || !description || !category) {
            throw new index_1.ValidationError('Missing required fields: subject, description, category');
        }
        // Customers can only create tickets for themselves
        const ticket = await SupportService.createTicket({
            subject,
            description,
            category,
            priority,
            customerId: userId, // Always use authenticated user's ID
            tags,
            metadata, // Include metadata in creation
        }, userId // createdById is the customer themselves
        );
        res.status(201).json(ticket);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to create ticket' });
        }
    }
});
/**
 * PATCH /api/support/tickets/:id
 * Update ticket
 */
router.patch('/tickets/:id', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const ticket = await SupportService.updateTicket(req.params.id, req.body, userId);
        res.json(ticket);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to update ticket' });
        }
    }
});
/**
 * POST /api/support/tickets/:id/assign
 * Assign ticket to agent
 */
router.post('/tickets/:id/assign', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const { assignedToId } = req.body;
        const ticket = await SupportService.updateTicket(req.params.id, { assignedToId }, req.user?.uid);
        res.json(ticket);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to assign ticket' });
        }
    }
});
/**
 * POST /api/support/tickets/:id/status
 * Update ticket status
 */
router.post('/tickets/:id/status', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            throw new index_1.ValidationError('Status is required');
        }
        const ticket = await SupportService.updateTicket(req.params.id, { status }, req.user?.uid);
        res.json(ticket);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to update status' });
        }
    }
});
/**
 * POST /api/support/tickets/:id/messages
 * Add message to ticket
 */
router.post('/tickets/:id/messages', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { content, type } = req.body;
        if (!content || !type) {
            throw new index_1.ValidationError('Content and type are required');
        }
        if (!['PUBLIC_REPLY', 'INTERNAL_NOTE'].includes(type)) {
            throw new index_1.ValidationError('Type must be PUBLIC_REPLY or INTERNAL_NOTE');
        }
        const message = await SupportService.addMessage(req.params.id, { content, type }, userId);
        res.status(201).json(message);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to add message' });
        }
    }
});
// ==================== Chat Session Routes ====================
/**
 * POST /api/support/chat/sessions/user
 * Create a new chat session for authenticated user
 */
router.post('/chat/sessions/user', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        // Check for existing active session
        const existingSession = await prisma_1.prisma.chatSession.findFirst({
            where: {
                customerId: userId,
                status: { in: ['WAITING', 'ACTIVE'] },
            },
            orderBy: { startedAt: 'desc' },
        });
        if (existingSession) {
            return res.json(existingSession);
        }
        // Create new session
        const session = await SupportService.createChatSession({ customerId: userId });
        res.status(201).json(session);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to create chat session' });
        }
    }
});
/**
 * GET /api/support/chat/sessions/active
 * Get active chat session for authenticated user
 */
router.get('/chat/sessions/active', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const session = await prisma_1.prisma.chatSession.findFirst({
            where: {
                customerId: userId,
                status: { in: ['WAITING', 'ACTIVE'] },
            },
            orderBy: { startedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 100,
                },
            },
        });
        if (!session) {
            return res.status(404).json({ error: 'No active session found' });
        }
        res.json({ sessionId: session.id, session });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch active session' });
    }
});
/**
 * GET /api/support/chat/sessions
 * List chat sessions with filters
 */
router.get('/chat/sessions', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            agentId: req.query.agentId === 'null' ? null : req.query.agentId,
            customerId: req.query.customerId,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
        };
        const result = await SupportService.listChatSessions(filters);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch chat sessions' });
    }
});
/**
 * GET /api/support/chat/queue
 * Get waiting chat sessions (queue)
 */
router.get('/chat/queue', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const queue = await SupportService.getChatQueue();
        res.json(queue);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch chat queue' });
    }
});
/**
 * GET /api/support/chat/sessions/:id
 * Get chat session by ID
 */
router.get('/chat/sessions/:id', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const session = await SupportService.getChatSessionById(req.params.id);
        res.json(session);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to fetch chat session' });
        }
    }
});
/**
 * POST /api/support/chat/sessions
 * Create a new chat session
 */
router.post('/chat/sessions', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const { customerId, agentId } = req.body;
        if (!customerId) {
            throw new index_1.ValidationError('customerId is required');
        }
        const session = await SupportService.createChatSession({ customerId }, agentId);
        res.status(201).json(session);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to create chat session' });
        }
    }
});
/**
 * POST /api/support/chat/sessions/:id/assign
 * Assign chat session to agent
 */
router.post('/chat/sessions/:id/assign', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { agentId } = req.body;
        if (!agentId) {
            throw new index_1.ValidationError('agentId is required');
        }
        const session = await SupportService.assignChatSession(req.params.id, agentId);
        res.json(session);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to assign chat session' });
        }
    }
});
/**
 * POST /api/support/chat/sessions/:id/end
 * End chat session
 */
router.post('/chat/sessions/:id/end', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const session = await SupportService.endChatSession(req.params.id);
        res.json(session);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to end chat session' });
        }
    }
});
/**
 * POST /api/support/chat/sessions/:id/messages
 * Add message to chat session
 */
router.post('/chat/sessions/:id/messages', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { content, type = 'text' } = req.body;
        if (!content) {
            throw new index_1.ValidationError('Content is required');
        }
        const message = await SupportService.addChatMessage(req.params.id, userId, content, type);
        res.status(201).json(message);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to add message' });
        }
    }
});
/**
 * GET /api/support/chat/stats
 * Get chat statistics
 */
router.get('/chat/stats', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const agentId = req.query.agentId;
        const stats = await SupportService.getChatStats(agentId);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch chat stats' });
    }
});
/**
 * POST /api/support/chat/sessions/:id/tags
 * Add tag to chat session
 */
router.post('/chat/sessions/:id/tags', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag) {
            throw new index_1.ValidationError('Tag is required');
        }
        const session = await prisma_1.prisma.chatSession.findUnique({
            where: { id: req.params.id },
            select: { tags: true },
        });
        if (!session) {
            throw new index_1.ValidationError('Session not found');
        }
        const updatedTags = [...(session.tags || []), tag];
        const updated = await prisma_1.prisma.chatSession.update({
            where: { id: req.params.id },
            data: { tags: updatedTags },
        });
        res.json({ tags: updated.tags });
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to add tag' });
        }
    }
});
/**
 * DELETE /api/support/chat/sessions/:id/tags/:tag
 * Remove tag from chat session
 */
router.delete('/chat/sessions/:id/tags/:tag', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const session = await prisma_1.prisma.chatSession.findUnique({
            where: { id: req.params.id },
            select: { tags: true },
        });
        if (!session) {
            throw new index_1.ValidationError('Session not found');
        }
        const updatedTags = (session.tags || []).filter((t) => t !== req.params.tag);
        const updated = await prisma_1.prisma.chatSession.update({
            where: { id: req.params.id },
            data: { tags: updatedTags },
        });
        res.json({ tags: updated.tags });
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to remove tag' });
        }
    }
});
/**
 * POST /api/support/chat/sessions/:id/notes
 * Update notes for chat session
 */
router.post('/chat/sessions/:id/notes', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const { note } = req.body;
        const session = await prisma_1.prisma.chatSession.findUnique({
            where: { id: req.params.id },
        });
        if (!session) {
            throw new index_1.ValidationError('Session not found');
        }
        const updated = await prisma_1.prisma.chatSession.update({
            where: { id: req.params.id },
            data: { notes: note || null },
        });
        res.json({ notes: updated.notes });
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to update notes' });
        }
    }
});
/**
 * POST /api/support/chat/sessions/:id/priority
 * Update priority for chat session
 */
router.post('/chat/sessions/:id/priority', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const { priority } = req.body;
        if (!priority || !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
            throw new index_1.ValidationError('Priority must be LOW, NORMAL, HIGH, or URGENT');
        }
        const session = await prisma_1.prisma.chatSession.findUnique({
            where: { id: req.params.id },
        });
        if (!session) {
            throw new index_1.ValidationError('Session not found');
        }
        const updated = await prisma_1.prisma.chatSession.update({
            where: { id: req.params.id },
            data: { priority },
        });
        res.json({ priority: updated.priority });
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to update priority' });
        }
    }
});
/**
 * POST /api/support/chat/sessions/:id/rate
 * Rate chat session (customer only)
 */
router.post('/chat/sessions/:id/rate', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            throw new index_1.ValidationError('Rating must be between 1 and 5');
        }
        const session = await prisma_1.prisma.chatSession.findUnique({
            where: { id: req.params.id },
            select: { customerId: true },
        });
        if (!session) {
            throw new index_1.ValidationError('Session not found');
        }
        if (session.customerId !== userId) {
            throw new index_1.AuthorizationError('Only the customer can rate this session');
        }
        const updated = await prisma_1.prisma.chatSession.update({
            where: { id: req.params.id },
            data: { rating },
        });
        res.json({ rating: updated.rating });
    }
    catch (error) {
        if (error instanceof index_1.ValidationError || error instanceof index_1.AuthorizationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to rate session' });
        }
    }
});
/**
 * GET /api/support/chat/saved-replies
 * Get saved replies for authenticated agent
 */
router.get('/chat/saved-replies', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const category = req.query.category;
        const where = { createdBy: userId };
        if (category) {
            where.category = category;
        }
        const replies = await prisma_1.prisma.savedReply.findMany({
            where,
            orderBy: { usageCount: 'desc' },
        });
        res.json(replies);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch saved replies' });
    }
});
/**
 * POST /api/support/chat/saved-replies
 * Create saved reply
 */
router.post('/chat/saved-replies', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            throw new index_1.ValidationError('User ID is required');
        }
        const { title, content, category } = req.body;
        if (!title || !content) {
            throw new index_1.ValidationError('Title and content are required');
        }
        const reply = await prisma_1.prisma.savedReply.create({
            data: {
                title,
                content,
                category: category || null,
                createdBy: userId,
            },
        });
        res.status(201).json(reply);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to create saved reply' });
        }
    }
});
/**
 * PUT /api/support/chat/saved-replies/:id
 * Update saved reply
 */
router.put('/chat/saved-replies/:id', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { title, content, category } = req.body;
        const reply = await prisma_1.prisma.savedReply.findUnique({
            where: { id: req.params.id },
            select: { createdBy: true },
        });
        if (!reply) {
            throw new index_1.ValidationError('Saved reply not found');
        }
        if (reply.createdBy !== userId) {
            throw new index_1.AuthorizationError('You can only update your own saved replies');
        }
        const updated = await prisma_1.prisma.savedReply.update({
            where: { id: req.params.id },
            data: {
                title,
                content,
                category: category || null,
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError || error instanceof index_1.AuthorizationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to update saved reply' });
        }
    }
});
/**
 * POST /api/support/chat/saved-replies/:id/use
 * Increment usage count for saved reply
 */
router.post('/chat/saved-replies/:id/use', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const reply = await prisma_1.prisma.savedReply.findUnique({
            where: { id: req.params.id },
            select: { usageCount: true },
        });
        if (!reply) {
            throw new index_1.ValidationError('Saved reply not found');
        }
        const updated = await prisma_1.prisma.savedReply.update({
            where: { id: req.params.id },
            data: { usageCount: reply.usageCount + 1 },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to update usage count' });
        }
    }
});
/**
 * DELETE /api/support/chat/saved-replies/:id
 * Delete saved reply
 */
router.delete('/chat/saved-replies/:id', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const reply = await prisma_1.prisma.savedReply.findUnique({
            where: { id: req.params.id },
            select: { createdBy: true },
        });
        if (!reply) {
            throw new index_1.ValidationError('Saved reply not found');
        }
        if (reply.createdBy !== userId) {
            throw new index_1.AuthorizationError('You can only delete your own saved replies');
        }
        await prisma_1.prisma.savedReply.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof index_1.ValidationError || error instanceof index_1.AuthorizationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to delete saved reply' });
        }
    }
});
/**
 * POST /api/support/chat/events
 * Track chat event (for analytics)
 */
router.post('/chat/events', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const { sessionId, eventType, metadata } = req.body;
        if (!sessionId || !eventType) {
            throw new index_1.ValidationError('sessionId and eventType are required');
        }
        // Verify session exists and user has access
        const session = await prisma_1.prisma.chatSession.findUnique({
            where: { id: sessionId },
            select: { customerId: true },
        });
        if (!session) {
            throw new index_1.ValidationError('Session not found');
        }
        if (session.customerId !== userId) {
            throw new index_1.AuthorizationError('Access denied');
        }
        const event = await prisma_1.prisma.chatEvent.create({
            data: {
                sessionId,
                eventType: eventType,
                metadata: metadata || null,
            },
        });
        res.status(201).json(event);
    }
    catch (error) {
        if (error instanceof index_1.ValidationError || error instanceof index_1.AuthorizationError) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: error.message || 'Failed to track event' });
        }
    }
});
/**
 * GET /api/support/chat/analytics
 * Get chat analytics
 */
router.get('/chat/analytics', middleware_1.verifyFirebaseToken, requireSupportTeam, async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        // Get session statistics
        const totalSessions = await prisma_1.prisma.chatSession.count({
            where: {
                startedAt: { gte: startDate, lte: endDate },
            },
        });
        const activeSessions = await prisma_1.prisma.chatSession.count({
            where: {
                status: 'ACTIVE',
                startedAt: { gte: startDate, lte: endDate },
            },
        });
        const endedSessions = await prisma_1.prisma.chatSession.count({
            where: {
                status: 'ENDED',
                startedAt: { gte: startDate, lte: endDate },
            },
        });
        // Average first response time
        const sessionsWithFirstResponse = await prisma_1.prisma.chatSession.findMany({
            where: {
                firstResponseAt: { not: null },
                startedAt: { gte: startDate, lte: endDate },
            },
            select: { startedAt: true, firstResponseAt: true },
        });
        const avgFirstResponseTime = sessionsWithFirstResponse.length > 0
            ? sessionsWithFirstResponse.reduce((acc, s) => {
                const diff = s.firstResponseAt.getTime() - s.startedAt.getTime();
                return acc + diff;
            }, 0) / sessionsWithFirstResponse.length / 1000 / 60 // Convert to minutes
            : 0;
        // Average resolution time
        const resolvedSessions = await prisma_1.prisma.chatSession.findMany({
            where: {
                resolvedAt: { not: null },
                startedAt: { gte: startDate, lte: endDate },
            },
            select: { startedAt: true, resolvedAt: true },
        });
        const avgResolutionTime = resolvedSessions.length > 0
            ? resolvedSessions.reduce((acc, s) => {
                const diff = s.resolvedAt.getTime() - s.startedAt.getTime();
                return acc + diff;
            }, 0) / resolvedSessions.length / 1000 / 60 // Convert to minutes
            : 0;
        // Average rating
        const ratedSessions = await prisma_1.prisma.chatSession.findMany({
            where: {
                rating: { not: null },
                startedAt: { gte: startDate, lte: endDate },
            },
            select: { rating: true },
        });
        const avgRating = ratedSessions.length > 0
            ? ratedSessions.reduce((acc, s) => acc + (s.rating || 0), 0) / ratedSessions.length
            : 0;
        // Total messages
        const totalMessages = await prisma_1.prisma.chatMessage.count({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
        });
        res.json({
            totalSessions,
            activeSessions,
            endedSessions,
            avgFirstResponseTime: Math.round(avgFirstResponseTime * 100) / 100,
            avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
            avgRating: Math.round(avgRating * 100) / 100,
            totalMessages,
            period: { startDate, endDate },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
    }
});
exports.default = router;
