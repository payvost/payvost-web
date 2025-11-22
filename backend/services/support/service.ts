import { Prisma } from '@prisma/client';
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
      status: 'OPEN',
    },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          messages: true,
          attachments: true,
        },
      },
    },
  });

  return ticket;
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: 'asc' },
        include: {
          uploadedBy: {
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
          messages: true,
          attachments: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new ValidationError('Ticket not found');
  }

  return ticket;
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
  const where: Prisma.SupportTicketWhereInput = {};

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
  const orderBy: Prisma.SupportTicketOrderByWithRelationInput = {};
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
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            attachments: true,
          },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
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
  const updateData: Prisma.SupportTicketUpdateInput = {};

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
      customer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return ticket;
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
      author: {
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

  return message;
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(assignedToId?: string) {
  const where: Prisma.SupportTicketWhereInput = {};
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
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byStatusGrouped: byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

