"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeChatWebSocket = initializeChatWebSocket;
const socket_io_1 = require("socket.io");
const prisma_1 = require("../../common/prisma");
const logger_1 = require("../../common/logger");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const ai_orchestrator_1 = require("./ai-orchestrator");
const aiOrchestrator = new ai_orchestrator_1.AIOrchestrator();
function initializeChatWebSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST'],
        },
        path: '/socket.io/chat',
        transports: ['websocket', 'polling'],
    });
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            // Verify Firebase token
            const decodedToken = await firebase_admin_1.default.auth().verifyIdToken(token);
            socket.userId = decodedToken.uid;
            // Get user role from database
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decodedToken.uid },
                select: { role: true },
            });
            socket.userRole = user?.role || 'USER';
            next();
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'WebSocket authentication failed');
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.info({ userId: socket.userId }, 'User connected to chat WebSocket');
        // Join user's personal room
        socket.join(`user:${socket.userId}`);
        // Handle chat session join
        socket.on('join:session', async (sessionId) => {
            try {
                // Verify user has access to this session
                const session = await prisma_1.prisma.chatSession.findUnique({
                    where: { id: sessionId },
                });
                if (!session) {
                    socket.emit('error', { message: 'Session not found' });
                    return;
                }
                // Check permissions
                const hasAccess = session.customerId === socket.userId ||
                    session.agentId === socket.userId ||
                    socket.userRole === 'SUPPORT_AGENT' ||
                    socket.userRole === 'ADMIN';
                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                socket.join(`session:${sessionId}`);
                socket.sessionId = sessionId;
                // Notify others in the session
                socket.to(`session:${sessionId}`).emit('user:joined', {
                    userId: socket.userId,
                    timestamp: new Date().toISOString(),
                });
                // Send session history
                const messages = await prisma_1.prisma.chatMessage.findMany({
                    where: { sessionId },
                    orderBy: { createdAt: 'asc' },
                    take: 100,
                });
                socket.emit('session:history', { messages });
            }
            catch (error) {
                logger_1.logger.error({ err: error, sessionId }, 'Failed to join session');
                socket.emit('error', { message: 'Failed to join session' });
            }
        });
        // Handle new message
        socket.on('message:send', async (data) => {
            try {
                if (!socket.sessionId || socket.sessionId !== data.sessionId) {
                    socket.emit('error', { message: 'Not in this session' });
                    return;
                }
                // Verify session exists and is active
                const session = await prisma_1.prisma.chatSession.findUnique({
                    where: { id: data.sessionId },
                });
                if (!session) {
                    socket.emit('error', { message: 'Session not found' });
                    return;
                }
                if (session.status === 'ENDED') {
                    socket.emit('error', { message: 'Session has ended' });
                    return;
                }
                // Save message to database
                const message = await prisma_1.prisma.chatMessage.create({
                    data: {
                        sessionId: data.sessionId,
                        senderId: socket.userId,
                        content: data.content,
                        type: data.type || 'text',
                        metadata: data.metadata || null,
                        attachments: data.metadata?.attachments || null,
                    },
                });
                // Update session last activity and track first response
                const updateData = {
                    status: session.status === 'WAITING' ? 'ACTIVE' : session.status,
                    lastMessageAt: new Date(),
                };
                // Track first response time (if agent is responding for first time)
                if (socket.userRole === 'SUPPORT_AGENT' || socket.userRole === 'ADMIN') {
                    if (!session.firstResponseAt) {
                        updateData.firstResponseAt = new Date();
                    }
                }
                await prisma_1.prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: updateData,
                });
                // Broadcast to all in session
                io.to(`session:${data.sessionId}`).emit('message:new', {
                    message,
                    timestamp: new Date().toISOString(),
                });
                // If AI chat (no agent assigned), trigger AI response
                if (!session.agentId && socket.userRole !== 'SUPPORT_AGENT' && socket.userRole !== 'ADMIN') {
                    // Emit AI processing indicator
                    io.to(`session:${data.sessionId}`).emit('ai:processing', {
                        sessionId: data.sessionId,
                        timestamp: new Date().toISOString(),
                    });
                    // Process AI response asynchronously
                    aiOrchestrator.processMessage(data.sessionId, socket.userId, data.content)
                        .then((aiResponse) => {
                        // AI response is already saved by orchestrator
                        // Just notify clients
                        io.to(`session:${data.sessionId}`).emit('ai:complete', {
                            sessionId: data.sessionId,
                            timestamp: new Date().toISOString(),
                        });
                    })
                        .catch((error) => {
                        logger_1.logger.error({ err: error, sessionId: data.sessionId }, 'AI processing failed');
                        io.to(`session:${data.sessionId}`).emit('ai:error', {
                            sessionId: data.sessionId,
                            message: 'AI assistant is temporarily unavailable. Please try again.',
                        });
                    });
                }
            }
            catch (error) {
                logger_1.logger.error({ err: error }, 'Failed to send message');
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Typing indicator
        socket.on('typing:start', (data) => {
            socket.to(`session:${data.sessionId}`).emit('typing:start', {
                userId: socket.userId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on('typing:stop', (data) => {
            socket.to(`session:${data.sessionId}`).emit('typing:stop', {
                userId: socket.userId,
            });
        });
        // Read receipts (enhanced)
        socket.on('message:read', async (data) => {
            try {
                const message = await prisma_1.prisma.chatMessage.findUnique({
                    where: { id: data.messageId },
                    select: { senderId: true, sessionId: true },
                });
                if (!message) {
                    socket.emit('error', { message: 'Message not found' });
                    return;
                }
                await prisma_1.prisma.chatMessage.update({
                    where: { id: data.messageId },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                        readBy: socket.userId,
                    },
                });
                // Notify sender and all in session
                io.to(`session:${message.sessionId}`).emit('message:read', {
                    messageId: data.messageId,
                    userId: socket.userId,
                    readAt: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.logger.error({ err: error }, 'Failed to mark message as read');
            }
        });
        // Tag management
        socket.on('session:tag:add', async (data) => {
            try {
                const session = await prisma_1.prisma.chatSession.findUnique({
                    where: { id: data.sessionId },
                    select: { tags: true, customerId: true, agentId: true },
                });
                if (!session) {
                    socket.emit('error', { message: 'Session not found' });
                    return;
                }
                // Check permissions
                const hasAccess = session.customerId === socket.userId ||
                    session.agentId === socket.userId ||
                    socket.userRole === 'SUPPORT_AGENT' ||
                    socket.userRole === 'ADMIN';
                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                const updatedTags = [...(session.tags || []), data.tag];
                await prisma_1.prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: { tags: updatedTags },
                });
                io.to(`session:${data.sessionId}`).emit('session:tag:added', {
                    sessionId: data.sessionId,
                    tag: data.tag,
                    tags: updatedTags,
                });
            }
            catch (error) {
                logger_1.logger.error({ err: error }, 'Failed to add tag');
                socket.emit('error', { message: 'Failed to add tag' });
            }
        });
        socket.on('session:tag:remove', async (data) => {
            try {
                const session = await prisma_1.prisma.chatSession.findUnique({
                    where: { id: data.sessionId },
                    select: { tags: true, customerId: true, agentId: true },
                });
                if (!session) {
                    socket.emit('error', { message: 'Session not found' });
                    return;
                }
                // Check permissions (only agents/admins can remove tags)
                const hasAccess = socket.userRole === 'SUPPORT_AGENT' ||
                    socket.userRole === 'ADMIN';
                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                const updatedTags = (session.tags || []).filter((t) => t !== data.tag);
                await prisma_1.prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: { tags: updatedTags },
                });
                io.to(`session:${data.sessionId}`).emit('session:tag:removed', {
                    sessionId: data.sessionId,
                    tag: data.tag,
                    tags: updatedTags,
                });
            }
            catch (error) {
                logger_1.logger.error({ err: error }, 'Failed to remove tag');
                socket.emit('error', { message: 'Failed to remove tag' });
            }
        });
        // Notes management (agents only)
        socket.on('session:note:update', async (data) => {
            try {
                // Only agents can add notes
                if (socket.userRole !== 'SUPPORT_AGENT' && socket.userRole !== 'ADMIN') {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                const session = await prisma_1.prisma.chatSession.findUnique({
                    where: { id: data.sessionId },
                });
                if (!session) {
                    socket.emit('error', { message: 'Session not found' });
                    return;
                }
                await prisma_1.prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: { notes: data.note },
                });
                io.to(`session:${data.sessionId}`).emit('session:note:updated', {
                    sessionId: data.sessionId,
                    note: data.note,
                });
            }
            catch (error) {
                logger_1.logger.error({ err: error }, 'Failed to update note');
                socket.emit('error', { message: 'Failed to update note' });
            }
        });
        // Disconnect
        socket.on('disconnect', () => {
            logger_1.logger.info({ userId: socket.userId }, 'User disconnected from chat WebSocket');
            if (socket.sessionId) {
                socket.to(`session:${socket.sessionId}`).emit('user:left', {
                    userId: socket.userId,
                    timestamp: new Date().toISOString(),
                });
            }
        });
    });
    logger_1.logger.info('Chat WebSocket server initialized');
    return io;
}
