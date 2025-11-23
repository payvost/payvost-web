'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { chatService, type ChatMessage, type ChatSession } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  Minimize2,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface EnhancedLiveChatProps {
  className?: string;
  initialMinimized?: boolean;
}

export function EnhancedLiveChat({ 
  className,
  initialMinimized = false 
}: EnhancedLiveChatProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection and session
  useEffect(() => {
    if (!user) return;

    const initializeChat = async () => {
      try {
        // Create or get session
        const chatSession = await chatService.createOrGetSession();
        setSession(chatSession);
        setSessionId(chatSession.id);

        // Connect WebSocket
        const ws = await chatService.connect();
        setSocket(ws);
        setIsConnected(ws.connected);

        // Join session
        ws.emit('join:session', chatSession.id);

        // Set up event listeners
        ws.on('connect', () => {
          setIsConnected(true);
          if (chatSession.id) {
            ws.emit('join:session', chatSession.id);
          }
        });

        ws.on('disconnect', () => {
          setIsConnected(false);
        });

        ws.on('session:history', ({ messages: history }: { messages: ChatMessage[] }) => {
          setMessages(history);
        });

        ws.on('message:new', ({ message }: { message: ChatMessage }) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
          scrollToBottom();
        });

        ws.on('typing:start', ({ userId }: { userId: string }) => {
          if (userId !== user.uid) {
            setTypingUsers((prev) => new Set(prev).add(userId));
          }
        });

        ws.on('typing:stop', ({ userId }: { userId: string }) => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        });

        ws.on('ai:processing', () => {
          setIsAiProcessing(true);
        });

        ws.on('ai:complete', () => {
          setIsAiProcessing(false);
        });

        ws.on('ai:error', ({ message }: { message: string }) => {
          setIsAiProcessing(false);
          console.error('AI error:', message);
        });

        ws.on('error', ({ message }: { message: string }) => {
          console.error('Chat error:', message);
        });

        setSocket(ws);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('session:history');
        socket.off('message:new');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('ai:processing');
        socket.off('ai:complete');
        socket.off('ai:error');
        socket.off('error');
      }
      chatService.disconnect();
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !sessionId || isLoading) return;

    const content = input.trim();
    setInput('');
    setIsLoading(true);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing:stop', { sessionId });

    // Send message
    socket.emit('message:send', {
      sessionId,
      content,
      type: 'text',
    });

    setIsLoading(false);
  };

  const handleTyping = (value: string) => {
    setInput(value);

    if (!socket || !sessionId) return;

    // Emit typing start
    setIsTyping(true);
    socket.emit('typing:start', { sessionId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', { sessionId });
    }, 3000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const element = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          className
        )}
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-14 w-14 rounded-full shadow-lg relative"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className={cn(
        'fixed bottom-4 right-4 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            {isConnected && (
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">Support Chat</h3>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(true)}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Start a conversation!</p>
              <p className="text-xs mt-2">Our AI assistant is here to help</p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.senderId === user?.uid;
            const isAI = message.senderId === 'AI_ASSISTANT';
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex items-start gap-3',
                  isUser ? 'flex-row-reverse' : ''
                )}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {isAI ? <Bot className="h-4 w-4" /> : 'A'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-4 py-2 text-sm',
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </p>
                </div>
                {isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL ?? ''} />
                    <AvatarFallback>
                      {getInitials(user?.displayName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          {/* AI Processing indicator */}
          {isAiProcessing && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type your message..."
            disabled={!isConnected || isLoading}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!isConnected || isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

