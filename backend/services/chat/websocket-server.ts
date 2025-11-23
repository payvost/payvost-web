import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../../common/prisma';
import { logger } from '../../common/logger';
import admin from 'firebase-admin';
import { AIOrchestrator } from './ai-orchestrator';

interface AuthenticatedSocket {
  userId?: string;
  userRole?: string;
  sessionId?: string;
}

const aiOrchestrator = new AIOrchestrator();

export function initializeChatWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io/chat',
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      socket.userId = decodedToken.uid;
      
      // Get user role from database
      const user = await prisma.user.findUnique({
        where: { id: decodedToken.uid },
        select: { role: true },
      });
      
      socket.userRole = user?.role || 'USER';
      next();
    } catch (error: any) {
      logger.error({ err: error }, 'WebSocket authentication failed');
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: any) => {
    logger.info({ userId: socket.userId }, 'User connected to chat WebSocket');

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle chat session join
    socket.on('join:session', async (sessionId: string) => {
      try {
        // Verify user has access to this session
        const session = await prisma.chatSession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Check permissions
        const hasAccess =
          session.customerId === socket.userId ||
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
        const messages = await prisma.chatMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          take: 100,
        });

        socket.emit('session:history', { messages });
      } catch (error: any) {
        logger.error({ err: error, sessionId }, 'Failed to join session');
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Handle new message
    socket.on('message:send', async (data: {
      sessionId: string;
      content: string;
      type?: string;
      metadata?: any;
    }) => {
      try {
        if (!socket.sessionId || socket.sessionId !== data.sessionId) {
          socket.emit('error', { message: 'Not in this session' });
          return;
        }

        // Verify session exists and is active
        const session = await prisma.chatSession.findUnique({
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
        const message = await prisma.chatMessage.create({
          data: {
            sessionId: data.sessionId,
            senderId: socket.userId!,
            content: data.content,
            type: data.type || 'text',
            metadata: data.metadata || null,
          },
        });

        // Update session last activity
        await prisma.chatSession.update({
          where: { id: data.sessionId },
          data: { 
            updatedAt: new Date(),
            status: session.status === 'WAITING' ? 'ACTIVE' : session.status,
          },
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
          aiOrchestrator.processMessage(data.sessionId, socket.userId!, data.content)
            .then((aiResponse) => {
              // AI response is already saved by orchestrator
              // Just notify clients
              io.to(`session:${data.sessionId}`).emit('ai:complete', {
                sessionId: data.sessionId,
                timestamp: new Date().toISOString(),
              });
            })
            .catch((error) => {
              logger.error({ err: error, sessionId: data.sessionId }, 'AI processing failed');
              io.to(`session:${data.sessionId}`).emit('ai:error', {
                sessionId: data.sessionId,
                message: 'AI assistant is temporarily unavailable. Please try again.',
              });
            });
        }
      } catch (error: any) {
        logger.error({ err: error }, 'Failed to send message');
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data: { sessionId: string }) => {
      socket.to(`session:${data.sessionId}`).emit('typing:start', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('typing:stop', (data: { sessionId: string }) => {
      socket.to(`session:${data.sessionId}`).emit('typing:stop', {
        userId: socket.userId,
      });
    });

    // Read receipts
    socket.on('message:read', async (data: { messageId: string }) => {
      try {
        await prisma.chatMessage.update({
          where: { id: data.messageId },
          data: { isRead: true },
        });

        socket.to(`session:${socket.sessionId}`).emit('message:read', {
          messageId: data.messageId,
          userId: socket.userId,
        });
      } catch (error) {
        logger.error({ err: error }, 'Failed to mark message as read');
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info({ userId: socket.userId }, 'User disconnected from chat WebSocket');
      if (socket.sessionId) {
        socket.to(`session:${socket.sessionId}`).emit('user:left', {
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  logger.info('Chat WebSocket server initialized');
  return io;
}

