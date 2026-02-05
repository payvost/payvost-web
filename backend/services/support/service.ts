import { prisma } from '../../common/prisma';
import { ValidationError } from '../../gateway/index';

export type TicketStatus = 'OPEN' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MessageType = 'PUBLIC_REPLY' | 'INTERNAL_NOTE';

export interface CreateTicketInput {
  subject: string;
  description: string;
  category: string;
  priority?: TicketPriority;
  customerId: string;
  tags?: string[];
  metadata?: any;
}

export interface UpdateTicketInput {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedToId?: string | null;
  tags?: string[];
}

export interface CreateMessageInput {
  content: string;
  type: MessageType;
}

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority | TicketPriority[];
  assignedToId?: string | null;
  customerId?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generate unique ticket number
 */
function generateTicketNumber(): string {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create a new support ticket
 */
export async function createTicket(
  input: CreateTicketInput,
  createdById?: string
) {
  const ticketNumber = generateTicketNumber();
  
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority || 'MEDIUM',
      customerId: input.customerId,
      createdById,
      tags: input.tags || [],
      metadata: input.metadata || null,
      status: 'OPEN',
    },
    include: {
      User_SupportTicket_customerIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      User_SupportTicket_assignedToIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      User_SupportTicket_createdByIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          TicketMessage: true,
          TicketAttachment: true,
        },
      },
    },
  });

  return mapTicketRelations(ticket);
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      User_SupportTicket_customerIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      User_SupportTicket_assignedToIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      User_SupportTicket_createdByIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      TicketMessage: {
        orderBy: { createdAt: 'asc' },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      TicketAttachment: {
        orderBy: { createdAt: 'asc' },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          TicketMessage: true,
          TicketAttachment: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new ValidationError('Ticket not found');
  }

  return mapTicketRelations(ticket);
}

/**
 * List tickets with filters and pagination
 */
export async function listTickets(filters: TicketFilters = {}) {
  const {
    status,
    priority,
    assignedToId,
    customerId,
    category,
    search,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }

  if (priority) {
    if (Array.isArray(priority)) {
      where.priority = { in: priority };
    } else {
      where.priority = priority;
    }
  }

  if (assignedToId !== undefined) {
    where.assignedToId = assignedToId;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { ticketNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy
  const orderBy: any = {};
  if (sortBy === 'priority') {
    // Custom priority ordering: URGENT > HIGH > MEDIUM > LOW
    orderBy.priority = sortOrder;
  } else {
    orderBy[sortBy] = sortOrder;
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        User_SupportTicket_customerIdToUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        User_SupportTicket_assignedToIdToUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        User_SupportTicket_createdByIdToUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            TicketMessage: true,
            TicketAttachment: true,
          },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets: tickets.map((ticket: any) => mapTicketRelations(ticket)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update ticket
 */
export async function updateTicket(
  ticketId: string,
  input: UpdateTicketInput,
  updatedById?: string
) {
  const updateData: any = {};

  if (input.subject !== undefined) updateData.subject = input.subject;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.status !== undefined) {
    updateData.status = input.status;
    
    // Set timestamps based on status
    if (input.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (input.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }
  }
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId;
  if (input.tags !== undefined) updateData.tags = input.tags;

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
    include: {
      User_SupportTicket_customerIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      User_SupportTicket_assignedToIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      User_SupportTicket_createdByIdToUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return mapTicketRelations(ticket);
}

/**
 * Add message to ticket
 */
export async function addMessage(
  ticketId: string,
  input: CreateMessageInput,
  authorId: string
) {
  // Verify ticket exists
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new ValidationError('Ticket not found');
  }

  // Create message
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId,
      content: input.content,
      type: input.type,
    },
    include: {
      User: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  // Update ticket's firstResponseAt if this is the first public reply
  if (input.type === 'PUBLIC_REPLY' && !ticket.firstResponseAt) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { firstResponseAt: new Date() },
    });
  }

  // Update ticket's updatedAt
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return mapTicketMessage(message);
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(assignedToId?: string) {
  const where: any = {};
  if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  const [
    total,
    open,
    pending,
    inProgress,
    resolved,
    closed,
    byPriority,
    byStatus,
  ] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { ...where, status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'PENDING' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { ...where, status: 'CLOSED' } }),
    prisma.supportTicket.groupBy({
      by: ['priority'],
      where,
      _count: true,
    }),
    prisma.supportTicket.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
  ]);

  return {
    total,
    byStatus: {
      open,
      pending,
      inProgress,
      resolved,
      closed,
    },
    byPriority: byPriority.reduce((acc: Record<string, number>, item: any) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byStatusGrouped: byStatus.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

// ==================== Chat Session Management ====================

export type ChatStatus = 'WAITING' | 'ACTIVE' | 'ENDED';

export interface CreateChatSessionInput {
  customerId: string;
}

export interface ChatFilters {
  status?: ChatStatus | ChatStatus[];
  agentId?: string | null;
  customerId?: string;
  page?: number;
  limit?: number;
}

function mapTicketMessage(message: any) {
  if (!message) return message;
  const { User, ...rest } = message;
  return {
    ...rest,
    author: User,
  };
}

function mapTicketAttachment(attachment: any) {
  if (!attachment) return attachment;
  const { User, ...rest } = attachment;
  return {
    ...rest,
    uploadedBy: User,
  };
}

function mapTicketRelations(ticket: any) {
  if (!ticket) return ticket;

  const {
    User_SupportTicket_customerIdToUser,
    User_SupportTicket_assignedToIdToUser,
    User_SupportTicket_createdByIdToUser,
    TicketMessage,
    TicketAttachment,
    _count,
    ...rest
  } = ticket;

  let mappedCount = _count;
  if (_count) {
    const { TicketMessage: messageCount, TicketAttachment: attachmentCount, ...countRest } = _count;
    mappedCount = {
      ...countRest,
      messages: messageCount,
      attachments: attachmentCount,
    };
  }

  return {
    ...rest,
    customer: User_SupportTicket_customerIdToUser,
    assignedTo: User_SupportTicket_assignedToIdToUser,
    createdBy: User_SupportTicket_createdByIdToUser,
    messages: TicketMessage ? TicketMessage.map(mapTicketMessage) : TicketMessage,
    attachments: TicketAttachment ? TicketAttachment.map(mapTicketAttachment) : TicketAttachment,
    _count: mappedCount,
  };
}

function mapChatMessage(message: any) {
  if (!message) return message;
  const { ChatSession, ...rest } = message;
  return ChatSession ? { ...rest, session: ChatSession } : rest;
}

function mapChatSession(session: any) {
  if (!session) return session;

  const { ChatMessage, _count, ...rest } = session;

  let mappedCount = _count;
  if (_count) {
    const { ChatMessage: messageCount, ...countRest } = _count;
    mappedCount = {
      ...countRest,
      messages: messageCount,
    };
  }

  return {
    ...rest,
    messages: ChatMessage ? ChatMessage.map(mapChatMessage) : ChatMessage,
    _count: mappedCount,
  };
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  input: CreateChatSessionInput,
  agentId?: string
) {
  const session = await prisma.chatSession.create({
    data: {
      customerId: input.customerId,
      agentId: agentId || null,
      status: agentId ? 'ACTIVE' : 'WAITING',
    },
    include: {
      ChatMessage: {
        orderBy: { createdAt: 'asc' },
        take: 50,
      },
    },
  });

  return mapChatSession(session);
}

/**
 * Get chat session by ID
 */
export async function getChatSessionById(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      ChatMessage: {
        orderBy: { createdAt: 'asc' },
        include: {
          ChatSession: {
            select: {
              id: true,
              customerId: true,
              agentId: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new ValidationError('Chat session not found');
  }

  return mapChatSession(session);
}

/**
 * List chat sessions with filters
 */
export async function listChatSessions(filters: ChatFilters = {}) {
  const {
    status,
    agentId,
    customerId,
    page = 1,
    limit = 50,
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }

  if (agentId !== undefined) {
    where.agentId = agentId;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        ChatMessage: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get last message
        },
        _count: {
          select: {
            ChatMessage: true,
          },
        },
      },
    }),
    prisma.chatSession.count({ where }),
  ]);

  return {
    sessions: sessions.map((session: any) => mapChatSession(session)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get waiting chat sessions (queue)
 */
export async function getChatQueue() {
  const waiting = await prisma.chatSession.findMany({
    where: {
      status: 'WAITING',
    },
    orderBy: { startedAt: 'asc' },
    include: {
      ChatMessage: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          ChatMessage: true,
        },
      },
    },
  });

  return waiting.map((session: any) => mapChatSession(session));
}

/**
 * Assign chat session to agent
 */
export async function assignChatSession(
  sessionId: string,
  agentId: string
) {
  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      agentId,
      status: 'ACTIVE',
    },
    include: {
      ChatMessage: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return mapChatSession(session);
}

/**
 * End chat session
 */
export async function endChatSession(sessionId: string) {
  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
    },
  });

  return session;
}

/**
 * Add message to chat session
 */
export async function addChatMessage(
  sessionId: string,
  senderId: string,
  content: string,
  type: string = 'text'
) {
  // Verify session exists and is active
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new ValidationError('Chat session not found');
  }

  if (session.status === 'ENDED') {
    throw new ValidationError('Cannot send message to ended chat session');
  }

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      senderId,
      content,
      type,
    },
  });

  // Update session status if it was waiting
  if (session.status === 'WAITING') {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE' },
    });
  }

  return message;
}

/**
 * Get chat statistics
 */
export async function getChatStats(agentId?: string) {
  const where: any = {};
  if (agentId) {
    where.agentId = agentId;
  }

  const [
    total,
    waiting,
    active,
    ended,
    todayActive,
  ] = await Promise.all([
    prisma.chatSession.count({ where }),
    prisma.chatSession.count({ where: { ...where, status: 'WAITING' } }),
    prisma.chatSession.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.chatSession.count({ where: { ...where, status: 'ENDED' } }),
    prisma.chatSession.count({
      where: {
        ...where,
        status: 'ACTIVE',
        startedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return {
    total,
    waiting,
    active,
    ended,
    todayActive,
  };
}

