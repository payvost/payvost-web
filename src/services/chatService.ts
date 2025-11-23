import { io, Socket } from 'socket.io-client';
import { auth } from '@/lib/firebase';

let socket: Socket | null = null;

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  type: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  customerId: string;
  agentId?: string | null;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt?: string | null;
  metadata?: any;
}

class ChatService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.socket = io(wsUrl, {
      path: '/socket.io/chat',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  async createOrGetSession(): Promise<ChatSession> {
    try {
      // Check for existing active session
      const response = await fetch('/api/support/chat/sessions/active');

      if (response.ok) {
        const data = await response.json();
        return data.session;
      }

      // Create new session
      const createResponse = await fetch('/api/support/chat/sessions/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create chat session');
      }

      return await createResponse.json();
    } catch (error) {
      console.error('Failed to create/get session:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();

