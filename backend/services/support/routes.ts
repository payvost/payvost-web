import { Router, Response } from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError, AuthorizationError } from '../../gateway/index';
import admin from 'firebase-admin';
import { prisma } from '../../common/prisma';
import * as SupportService from './service';

const db = admin.firestore();

const router = Router();

/**
 * Middleware to verify support team access
 */
async function requireSupportTeam(req: AuthenticatedRequest, res: Response, next: any) {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new AuthorizationError('Authentication required');
    }

    // Check support role in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new AuthorizationError('User not found');
    }

    const userData = userDoc.data();
    const role = userData?.role?.toLowerCase() || '';
    
    // Support roles: support_agent, support_senior, support_supervisor, support_manager
    // Also allow admin and super_admin
    const hasSupportRole = role.startsWith('support_') || role === 'admin' || role === 'super_admin';
    
    if (!hasSupportRole) {
      throw new AuthorizationError('Support team access required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/support/tickets
 * List tickets with filters
 */
router.get('/tickets', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: SupportService.TicketFilters = {
      status: req.query.status as any,
      priority: req.query.priority as any,
      assignedToId: req.query.assignedToId === 'null' ? null : req.query.assignedToId as string,
      customerId: req.query.customerId as string,
      category: req.query.category as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    };

    const result = await SupportService.listTickets(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch tickets' });
  }
});

/**
 * GET /api/support/tickets/stats
 * Get ticket statistics
 */
router.get('/tickets/stats', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignedToId = req.query.assignedToId as string | undefined;
    const stats = await SupportService.getTicketStats(assignedToId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

/**
 * GET /api/support/tickets/:id
 * Get ticket by ID
 */
router.get('/tickets/:id', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticket = await SupportService.getTicketById(req.params.id);
    res.json(ticket);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch ticket' });
    }
  }
});

/**
 * POST /api/support/tickets
 * Create a new ticket (Support team only - can create for any customer)
 */
router.post('/tickets', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { subject, description, category, priority, customerId, tags } = req.body;

    if (!subject || !description || !category || !customerId) {
      throw new ValidationError('Missing required fields: subject, description, category, customerId');
    }

    const ticket = await SupportService.createTicket(
      {
        subject,
        description,
        category,
        priority,
        customerId,
        tags,
      },
      userId
    );

    res.status(201).json(ticket);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create ticket' });
    }
  }
});

/**
 * POST /api/support/tickets/customer
 * Create a new ticket (Customer-facing - can only create for themselves)
 */
router.post('/tickets/customer', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { subject, description, category, priority, tags, metadata } = req.body;

    if (!subject || !description || !category) {
      throw new ValidationError('Missing required fields: subject, description, category');
    }

    // Customers can only create tickets for themselves
    const ticket = await SupportService.createTicket(
      {
        subject,
        description,
        category,
        priority,
        customerId: userId, // Always use authenticated user's ID
        tags,
        metadata, // Include metadata in creation
      },
      userId // createdById is the customer themselves
    );

    res.status(201).json(ticket);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create ticket' });
    }
  }
});

/**
 * PATCH /api/support/tickets/:id
 * Update ticket
 */
router.patch('/tickets/:id', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const ticket = await SupportService.updateTicket(req.params.id, req.body, userId);
    res.json(ticket);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update ticket' });
    }
  }
});

/**
 * POST /api/support/tickets/:id/assign
 * Assign ticket to agent
 */
router.post('/tickets/:id/assign', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignedToId } = req.body;
    const ticket = await SupportService.updateTicket(req.params.id, { assignedToId }, req.user?.uid);
    res.json(ticket);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to assign ticket' });
    }
  }
});

/**
 * POST /api/support/tickets/:id/status
 * Update ticket status
 */
router.post('/tickets/:id/status', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw new ValidationError('Status is required');
    }
    const ticket = await SupportService.updateTicket(req.params.id, { status }, req.user?.uid);
    res.json(ticket);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update status' });
    }
  }
});

/**
 * POST /api/support/tickets/:id/messages
 * Add message to ticket
 */
router.post('/tickets/:id/messages', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { content, type } = req.body;

    if (!content || !type) {
      throw new ValidationError('Content and type are required');
    }

    if (!['PUBLIC_REPLY', 'INTERNAL_NOTE'].includes(type)) {
      throw new ValidationError('Type must be PUBLIC_REPLY or INTERNAL_NOTE');
    }

    const message = await SupportService.addMessage(
      req.params.id,
      { content, type },
      userId
    );

    res.status(201).json(message);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to add message' });
    }
  }
});

// ==================== Chat Session Routes ====================

/**
 * POST /api/support/chat/sessions/user
 * Create a new chat session for authenticated user
 */
router.post('/chat/sessions/user', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check for existing active session
    const existingSession = await prisma.chatSession.findFirst({
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
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create chat session' });
    }
  }
});

/**
 * GET /api/support/chat/sessions/active
 * Get active chat session for authenticated user
 */
router.get('/chat/sessions/active', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const session = await prisma.chatSession.findFirst({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch active session' });
  }
});

/**
 * GET /api/support/chat/sessions
 * List chat sessions with filters
 */
router.get('/chat/sessions', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters: SupportService.ChatFilters = {
      status: req.query.status as any,
      agentId: req.query.agentId === 'null' ? null : req.query.agentId as string,
      customerId: req.query.customerId as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    const result = await SupportService.listChatSessions(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch chat sessions' });
  }
});

/**
 * GET /api/support/chat/queue
 * Get waiting chat sessions (queue)
 */
router.get('/chat/queue', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await SupportService.getChatQueue();
    res.json(queue);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch chat queue' });
  }
});

/**
 * GET /api/support/chat/sessions/:id
 * Get chat session by ID
 */
router.get('/chat/sessions/:id', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await SupportService.getChatSessionById(req.params.id);
    res.json(session);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch chat session' });
    }
  }
});

/**
 * POST /api/support/chat/sessions
 * Create a new chat session
 */
router.post('/chat/sessions', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, agentId } = req.body;

    if (!customerId) {
      throw new ValidationError('customerId is required');
    }

    const session = await SupportService.createChatSession(
      { customerId },
      agentId
    );

    res.status(201).json(session);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create chat session' });
    }
  }
});

/**
 * POST /api/support/chat/sessions/:id/assign
 * Assign chat session to agent
 */
router.post('/chat/sessions/:id/assign', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { agentId } = req.body;

    if (!agentId) {
      throw new ValidationError('agentId is required');
    }

    const session = await SupportService.assignChatSession(req.params.id, agentId);
    res.json(session);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to assign chat session' });
    }
  }
});

/**
 * POST /api/support/chat/sessions/:id/end
 * End chat session
 */
router.post('/chat/sessions/:id/end', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await SupportService.endChatSession(req.params.id);
    res.json(session);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to end chat session' });
    }
  }
});

/**
 * POST /api/support/chat/sessions/:id/messages
 * Add message to chat session
 */
router.post('/chat/sessions/:id/messages', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { content, type = 'text' } = req.body;

    if (!content) {
      throw new ValidationError('Content is required');
    }

    const message = await SupportService.addChatMessage(
      req.params.id,
      userId,
      content,
      type
    );

    res.status(201).json(message);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to add message' });
    }
  }
});

/**
 * GET /api/support/chat/stats
 * Get chat statistics
 */
router.get('/chat/stats', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agentId = req.query.agentId as string | undefined;
    const stats = await SupportService.getChatStats(agentId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch chat stats' });
  }
});

/**
 * POST /api/support/chat/sessions/:id/tags
 * Add tag to chat session
 */
router.post('/chat/sessions/:id/tags', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tag } = req.body;
    if (!tag) {
      throw new ValidationError('Tag is required');
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
      select: { tags: true },
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    const updatedTags = [...(session.tags || []), tag];
    const updated = await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { tags: updatedTags },
    });

    res.json({ tags: updated.tags });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to add tag' });
    }
  }
});

/**
 * DELETE /api/support/chat/sessions/:id/tags/:tag
 * Remove tag from chat session
 */
router.delete('/chat/sessions/:id/tags/:tag', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
      select: { tags: true },
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    const updatedTags = (session.tags || []).filter((t: string) => t !== req.params.tag);
    const updated = await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { tags: updatedTags },
    });

    res.json({ tags: updated.tags });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to remove tag' });
    }
  }
});

/**
 * POST /api/support/chat/sessions/:id/notes
 * Update notes for chat session
 */
router.post('/chat/sessions/:id/notes', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { note } = req.body;

    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    const updated = await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { notes: note || null },
    });

    res.json({ notes: updated.notes });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update notes' });
    }
  }
});

/**
 * POST /api/support/chat/sessions/:id/priority
 * Update priority for chat session
 */
router.post('/chat/sessions/:id/priority', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { priority } = req.body;
    if (!priority || !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
      throw new ValidationError('Priority must be LOW, NORMAL, HIGH, or URGENT');
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    const updated = await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { priority },
    });

    res.json({ priority: updated.priority });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update priority' });
    }
  }
});

/**
 * POST /api/support/chat/sessions/:id/rate
 * Rate chat session (customer only)
 */
router.post('/chat/sessions/:id/rate', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: req.params.id },
      select: { customerId: true },
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    if (session.customerId !== userId) {
      throw new AuthorizationError('Only the customer can rate this session');
    }

    const updated = await prisma.chatSession.update({
      where: { id: req.params.id },
      data: { rating },
    });

    res.json({ rating: updated.rating });
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to rate session' });
    }
  }
});

/**
 * GET /api/support/chat/saved-replies
 * Get saved replies for authenticated agent
 */
router.get('/chat/saved-replies', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const category = req.query.category as string | undefined;

    const where: any = { createdBy: userId };
    if (category) {
      where.category = category;
    }

    const replies = await prisma.savedReply.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });

    res.json(replies);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch saved replies' });
  }
});

/**
 * POST /api/support/chat/saved-replies
 * Create saved reply
 */
router.post('/chat/saved-replies', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const { title, content, category } = req.body;

    if (!title || !content) {
      throw new ValidationError('Title and content are required');
    }

    const reply = await prisma.savedReply.create({
      data: {
        title,
        content,
        category: category || null,
        createdBy: userId,
      },
    });

    res.status(201).json(reply);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to create saved reply' });
    }
  }
});

/**
 * PUT /api/support/chat/saved-replies/:id
 * Update saved reply
 */
router.put('/chat/saved-replies/:id', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { title, content, category } = req.body;

    const reply = await prisma.savedReply.findUnique({
      where: { id: req.params.id },
      select: { createdBy: true },
    });

    if (!reply) {
      throw new ValidationError('Saved reply not found');
    }

    if (reply.createdBy !== userId) {
      throw new AuthorizationError('You can only update your own saved replies');
    }

    const updated = await prisma.savedReply.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        category: category || null,
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update saved reply' });
    }
  }
});

/**
 * POST /api/support/chat/saved-replies/:id/use
 * Increment usage count for saved reply
 */
router.post('/chat/saved-replies/:id/use', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reply = await prisma.savedReply.findUnique({
      where: { id: req.params.id },
      select: { usageCount: true },
    });

    if (!reply) {
      throw new ValidationError('Saved reply not found');
    }

    const updated = await prisma.savedReply.update({
      where: { id: req.params.id },
      data: { usageCount: reply.usageCount + 1 },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to update usage count' });
    }
  }
});

/**
 * DELETE /api/support/chat/saved-replies/:id
 * Delete saved reply
 */
router.delete('/chat/saved-replies/:id', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const reply = await prisma.savedReply.findUnique({
      where: { id: req.params.id },
      select: { createdBy: true },
    });

    if (!reply) {
      throw new ValidationError('Saved reply not found');
    }

    if (reply.createdBy !== userId) {
      throw new AuthorizationError('You can only delete your own saved replies');
    }

    await prisma.savedReply.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete saved reply' });
    }
  }
});

/**
 * POST /api/support/chat/events
 * Track chat event (for analytics)
 */
router.post('/chat/events', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { sessionId, eventType, metadata } = req.body;

    if (!sessionId || !eventType) {
      throw new ValidationError('sessionId and eventType are required');
    }

    // Verify session exists and user has access
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { customerId: true },
    });

    if (!session) {
      throw new ValidationError('Session not found');
    }

    if (session.customerId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    const event = await prisma.chatEvent.create({
      data: {
        sessionId,
        eventType: eventType as any,
        metadata: metadata || null,
      },
    });

    res.status(201).json(event);
  } catch (error: any) {
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message || 'Failed to track event' });
    }
  }
});

/**
 * GET /api/support/chat/analytics
 * Get chat analytics
 */
router.get('/chat/analytics', verifyFirebaseToken, requireSupportTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    // Get session statistics
    const totalSessions = await prisma.chatSession.count({
      where: {
        startedAt: { gte: startDate, lte: endDate },
      },
    });

    const activeSessions = await prisma.chatSession.count({
      where: {
        status: 'ACTIVE',
        startedAt: { gte: startDate, lte: endDate },
      },
    });

    const endedSessions = await prisma.chatSession.count({
      where: {
        status: 'ENDED',
        startedAt: { gte: startDate, lte: endDate },
      },
    });

    // Average first response time
    const sessionsWithFirstResponse = await prisma.chatSession.findMany({
      where: {
        firstResponseAt: { not: null },
        startedAt: { gte: startDate, lte: endDate },
      },
      select: { startedAt: true, firstResponseAt: true },
    });

    const avgFirstResponseTime = sessionsWithFirstResponse.length > 0
      ? sessionsWithFirstResponse.reduce((acc: number, s: { startedAt: Date; firstResponseAt: Date | null }) => {
          const diff = s.firstResponseAt!.getTime() - s.startedAt.getTime();
          return acc + diff;
        }, 0) / sessionsWithFirstResponse.length / 1000 / 60 // Convert to minutes
      : 0;

    // Average resolution time
    const resolvedSessions = await prisma.chatSession.findMany({
      where: {
        resolvedAt: { not: null },
        startedAt: { gte: startDate, lte: endDate },
      },
      select: { startedAt: true, resolvedAt: true },
    });

    const avgResolutionTime = resolvedSessions.length > 0
      ? resolvedSessions.reduce((acc: number, s: { startedAt: Date; resolvedAt: Date | null }) => {
          const diff = s.resolvedAt!.getTime() - s.startedAt.getTime();
          return acc + diff;
        }, 0) / resolvedSessions.length / 1000 / 60 // Convert to minutes
      : 0;

    // Average rating
    const ratedSessions = await prisma.chatSession.findMany({
      where: {
        rating: { not: null },
        startedAt: { gte: startDate, lte: endDate },
      },
      select: { rating: true },
    });

    const avgRating = ratedSessions.length > 0
      ? ratedSessions.reduce((acc: number, s: { rating: number | null }) => acc + (s.rating || 0), 0) / ratedSessions.length
      : 0;

    // Total messages
    const totalMessages = await prisma.chatMessage.count({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

export default router;

