import { Router, Response } from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError, AuthorizationError } from '../../gateway/index';
import admin from 'firebase-admin';
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
 * Create a new ticket
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

export default router;

