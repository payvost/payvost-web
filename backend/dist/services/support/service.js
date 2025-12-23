"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.getTicketById = getTicketById;
exports.listTickets = listTickets;
exports.updateTicket = updateTicket;
exports.addMessage = addMessage;
exports.getTicketStats = getTicketStats;
exports.createChatSession = createChatSession;
exports.getChatSessionById = getChatSessionById;
exports.listChatSessions = listChatSessions;
exports.getChatQueue = getChatQueue;
exports.assignChatSession = assignChatSession;
exports.endChatSession = endChatSession;
exports.addChatMessage = addChatMessage;
exports.getChatStats = getChatStats;
const prisma_1 = require("../../common/prisma");
const index_1 = require("../../gateway/index");
/**
 * Generate unique ticket number
 */
function generateTicketNumber() {
    const prefix = 'TKT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
/**
 * Create a new support ticket
 */
async function createTicket(input, createdById) {
    const ticketNumber = generateTicketNumber();
    const ticket = await prisma_1.prisma.supportTicket.create({
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
async function getTicketById(ticketId) {
    const ticket = await prisma_1.prisma.supportTicket.findUnique({
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
        throw new index_1.ValidationError('Ticket not found');
    }
    return ticket;
}
/**
 * List tickets with filters and pagination
 */
async function listTickets(filters = {}) {
    const { status, priority, assignedToId, customerId, category, search, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc', } = filters;
    const skip = (page - 1) * limit;
    // Build where clause
    const where = {};
    if (status) {
        if (Array.isArray(status)) {
            where.status = { in: status };
        }
        else {
            where.status = status;
        }
    }
    if (priority) {
        if (Array.isArray(priority)) {
            where.priority = { in: priority };
        }
        else {
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
    const orderBy = {};
    if (sortBy === 'priority') {
        // Custom priority ordering: URGENT > HIGH > MEDIUM > LOW
        orderBy.priority = sortOrder;
    }
    else {
        orderBy[sortBy] = sortOrder;
    }
    const [tickets, total] = await Promise.all([
        prisma_1.prisma.supportTicket.findMany({
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
        prisma_1.prisma.supportTicket.count({ where }),
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
async function updateTicket(ticketId, input, updatedById) {
    const updateData = {};
    if (input.subject !== undefined)
        updateData.subject = input.subject;
    if (input.description !== undefined)
        updateData.description = input.description;
    if (input.status !== undefined) {
        updateData.status = input.status;
        // Set timestamps based on status
        if (input.status === 'RESOLVED') {
            updateData.resolvedAt = new Date();
        }
        else if (input.status === 'CLOSED') {
            updateData.closedAt = new Date();
        }
    }
    if (input.priority !== undefined)
        updateData.priority = input.priority;
    if (input.category !== undefined)
        updateData.category = input.category;
    if (input.assignedToId !== undefined)
        updateData.assignedToId = input.assignedToId;
    if (input.tags !== undefined)
        updateData.tags = input.tags;
    const ticket = await prisma_1.prisma.supportTicket.update({
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
async function addMessage(ticketId, input, authorId) {
    // Verify ticket exists
    const ticket = await prisma_1.prisma.supportTicket.findUnique({
        where: { id: ticketId },
    });
    if (!ticket) {
        throw new index_1.ValidationError('Ticket not found');
    }
    // Create message
    const message = await prisma_1.prisma.ticketMessage.create({
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
        await prisma_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { firstResponseAt: new Date() },
        });
    }
    // Update ticket's updatedAt
    await prisma_1.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
    });
    return message;
}
/**
 * Get ticket statistics
 */
async function getTicketStats(assignedToId) {
    const where = {};
    if (assignedToId) {
        where.assignedToId = assignedToId;
    }
    const [total, open, pending, inProgress, resolved, closed, byPriority, byStatus,] = await Promise.all([
        prisma_1.prisma.supportTicket.count({ where }),
        prisma_1.prisma.supportTicket.count({ where: { ...where, status: 'OPEN' } }),
        prisma_1.prisma.supportTicket.count({ where: { ...where, status: 'PENDING' } }),
        prisma_1.prisma.supportTicket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma_1.prisma.supportTicket.count({ where: { ...where, status: 'RESOLVED' } }),
        prisma_1.prisma.supportTicket.count({ where: { ...where, status: 'CLOSED' } }),
        prisma_1.prisma.supportTicket.groupBy({
            by: ['priority'],
            where,
            _count: true,
        }),
        prisma_1.prisma.supportTicket.groupBy({
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
        }, {}),
        byStatusGrouped: byStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {}),
    };
}
/**
 * Create a new chat session
 */
async function createChatSession(input, agentId) {
    const session = await prisma_1.prisma.chatSession.create({
        data: {
            customerId: input.customerId,
            agentId: agentId || null,
            status: agentId ? 'ACTIVE' : 'WAITING',
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                take: 50,
            },
        },
    });
    return session;
}
/**
 * Get chat session by ID
 */
async function getChatSessionById(sessionId) {
    const session = await prisma_1.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                include: {
                    session: {
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
        throw new index_1.ValidationError('Chat session not found');
    }
    return session;
}
/**
 * List chat sessions with filters
 */
async function listChatSessions(filters = {}) {
    const { status, agentId, customerId, page = 1, limit = 50, } = filters;
    const skip = (page - 1) * limit;
    const where = {};
    if (status) {
        if (Array.isArray(status)) {
            where.status = { in: status };
        }
        else {
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
        prisma_1.prisma.chatSession.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Get last message
                },
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
        }),
        prisma_1.prisma.chatSession.count({ where }),
    ]);
    return {
        sessions,
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
async function getChatQueue() {
    const waiting = await prisma_1.prisma.chatSession.findMany({
        where: {
            status: 'WAITING',
        },
        orderBy: { startedAt: 'asc' },
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            _count: {
                select: {
                    messages: true,
                },
            },
        },
    });
    return waiting;
}
/**
 * Assign chat session to agent
 */
async function assignChatSession(sessionId, agentId) {
    const session = await prisma_1.prisma.chatSession.update({
        where: { id: sessionId },
        data: {
            agentId,
            status: 'ACTIVE',
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    return session;
}
/**
 * End chat session
 */
async function endChatSession(sessionId) {
    const session = await prisma_1.prisma.chatSession.update({
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
async function addChatMessage(sessionId, senderId, content, type = 'text') {
    // Verify session exists and is active
    const session = await prisma_1.prisma.chatSession.findUnique({
        where: { id: sessionId },
    });
    if (!session) {
        throw new index_1.ValidationError('Chat session not found');
    }
    if (session.status === 'ENDED') {
        throw new index_1.ValidationError('Cannot send message to ended chat session');
    }
    // Create message
    const message = await prisma_1.prisma.chatMessage.create({
        data: {
            sessionId,
            senderId,
            content,
            type,
        },
    });
    // Update session status if it was waiting
    if (session.status === 'WAITING') {
        await prisma_1.prisma.chatSession.update({
            where: { id: sessionId },
            data: { status: 'ACTIVE' },
        });
    }
    return message;
}
/**
 * Get chat statistics
 */
async function getChatStats(agentId) {
    const where = {};
    if (agentId) {
        where.agentId = agentId;
    }
    const [total, waiting, active, ended, todayActive,] = await Promise.all([
        prisma_1.prisma.chatSession.count({ where }),
        prisma_1.prisma.chatSession.count({ where: { ...where, status: 'WAITING' } }),
        prisma_1.prisma.chatSession.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma_1.prisma.chatSession.count({ where: { ...where, status: 'ENDED' } }),
        prisma_1.prisma.chatSession.count({
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
