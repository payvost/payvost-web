'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { chatService, type ChatMessage, type ChatSession } from '@/services/chatService';
import { getAiSupportResponse } from '@/app/actions';
import type { ChatInput } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Bot, 
  Minimize2,
  MessageCircle,
  Loader2,
  X,
  BookOpen,
  Users,
  Zap,
  FileText,
  HelpCircle,
  CreditCard,
  Settings,
  Shield,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';

interface EnhancedLiveChatProps {
  className?: string;
  initialMinimized?: boolean;
  inline?: boolean; // If true, render inline instead of fixed position
  onClose?: () => void; // Optional callback to close the widget completely
}

// Quick actions
const quickActions = [
  { label: 'Check transaction status', icon: CreditCard, action: 'check_transaction' },
  { label: 'View account balance', icon: CreditCard, action: 'view_balance' },
  { label: 'Report an issue', icon: AlertCircle, action: 'report_issue' },
  { label: 'Update profile', icon: Settings, action: 'update_profile' },
  { label: 'Security help', icon: Shield, action: 'security_help' },
  { label: 'Payment methods', icon: CreditCard, action: 'payment_methods' },
];

// Mock support agents (in production, fetch from API)
const supportAgents = [
  { id: '1', name: 'Sarah Johnson', role: 'Senior Support', status: 'online', avatar: null, specialties: ['Payments', 'Account'] },
  { id: '2', name: 'Michael Chen', role: 'Technical Support', status: 'online', avatar: null, specialties: ['Technical', 'API'] },
  { id: '3', name: 'Emily Davis', role: 'Account Specialist', status: 'away', avatar: null, specialties: ['Account', 'Verification'] },
];

// Documentation links
const docLinks = [
  { title: 'Getting Started Guide', href: '/docs/getting-started', icon: BookOpen },
  { title: 'API Documentation', href: '/docs/api', icon: FileText },
  { title: 'Payment Methods', href: '/docs/payments', icon: CreditCard },
  { title: 'Security Best Practices', href: '/docs/security', icon: Shield },
  { title: 'FAQ', href: '/docs/faq', icon: HelpCircle },
];

export function EnhancedLiveChat({ 
  className,
  initialMinimized = false,
  inline = false,
  onClose,
}: EnhancedLiveChatProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'docs'>('chat');
  const [useFallback, setUseFallback] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection and session with fallback
  useEffect(() => {
    if (!user) return;

    const initializeChat = async () => {
      try {
        // Try to create or get session with timeout
        try {
          const sessionPromise = chatService.createOrGetSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 5000)
          );
          
          const chatSession = await Promise.race([sessionPromise, timeoutPromise]) as ChatSession;
          setSession(chatSession);
          setSessionId(chatSession.id);

          // Try to connect WebSocket
          const ws = await chatService.connect();
          setSocket(ws);
          
          // Set connection status after a short delay to allow connection
          setTimeout(() => {
            setIsConnected(ws.connected);
            if (!ws.connected) {
              setConnectionError('Connection failed. Using direct AI mode.');
              setUseFallback(true);
            } else {
              setConnectionError(null);
            }
          }, 2000);

          // Join session
          if (ws.connected) {
            ws.emit('join:session', chatSession.id);
          }

          // Set up event listeners
          ws.on('connect', () => {
            setIsConnected(true);
            setConnectionError(null);
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

          ws.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionError('Using direct AI mode');
            setUseFallback(true);
            setIsConnected(false);
          });
          
          // Set a timeout to switch to fallback if not connected
          setTimeout(() => {
            if (!ws.connected) {
              setConnectionError('Using direct AI mode');
              setUseFallback(true);
              setIsConnected(false);
            }
          }, 5000);

          setSocket(ws);
        } catch (error) {
          console.error('Failed to initialize WebSocket, using fallback:', error);
          setConnectionError('Using direct AI mode');
          setUseFallback(true);
          setIsConnected(false);
          // Initialize with a welcome message
          if (messages.length === 0) {
            const welcomeMessage: ChatMessage = {
              id: 'welcome',
              sessionId: 'fallback',
              senderId: 'AI_ASSISTANT',
              content: 'Hello! I\'m your AI assistant. How can I help you today?',
              type: 'text',
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setMessages([welcomeMessage]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setConnectionError('Using direct AI mode');
        setUseFallback(true);
        setIsConnected(false);
        // Initialize with a welcome message
        if (messages.length === 0) {
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            sessionId: 'fallback',
            senderId: 'AI_ASSISTANT',
            content: 'Hello! I\'m your AI assistant. How can I help you today?',
            type: 'text',
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
        }
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
        socket.off('connect_error');
      }
      chatService.disconnect();
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: sessionId || 'fallback',
      senderId: user?.uid || 'user',
      content,
      type: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    if (useFallback || !socket || !isConnected) {
      // Fallback to direct AI
      try {
        const chatHistory = messages.map((msg) => ({
          role: msg.senderId === user?.uid ? 'user' : 'model',
          content: [{ text: msg.content }],
        }));

        const aiInput: ChatInput = {
          message: content,
          history: chatHistory,
        };
        
        const result = await getAiSupportResponse(aiInput);

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sessionId: sessionId || 'fallback',
          senderId: 'AI_ASSISTANT',
          content: result.message,
          type: 'text',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('AI error:', error);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          sessionId: sessionId || 'fallback',
          senderId: 'AI_ASSISTANT',
          content: 'Sorry, I encountered an error. Please try again.',
          type: 'text',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      setIsLoading(false);
      return;
    }

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing:stop', { sessionId });

    // Send message via WebSocket
    socket.emit('message:send', {
      sessionId,
      content,
      type: 'text',
    });

    setIsLoading(false);
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      check_transaction: 'How can I check the status of my transaction?',
      view_balance: 'Show me my account balance',
      report_issue: 'I need to report an issue',
      update_profile: 'How do I update my profile?',
      security_help: 'I need help with security settings',
      payment_methods: 'What payment methods are available?',
    };
    setInput(actionMessages[action] || action);
    setActiveTab('chat');
  };

  const handleTyping = (value: string) => {
    setInput(value);

    if (!socket || !sessionId || !isConnected) return;

    setIsTyping(true);
    socket.emit('typing:start', { sessionId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isMinimized && !inline) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50',
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

  const chatContent = (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      className={cn(
        inline 
          ? 'w-full h-full flex flex-col' 
          : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] max-h-[calc(100vh-2rem)] bg-background border rounded-lg shadow-2xl flex flex-col z-50',
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
            <h3 className="font-semibold">AI Support Chat</h3>
            <p className="text-xs text-muted-foreground">
              {connectionError 
                ? connectionError 
                : isConnected 
                  ? 'Online' 
                  : useFallback 
                    ? 'Direct AI Mode' 
                    : 'Connecting...'}
            </p>
          </div>
        </div>
        {!inline && (
          <div className="flex items-center gap-1">
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="chat" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex-1">
            <BookOpen className="h-4 w-4 mr-2" />
            Docs
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="p-4 border-b">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.slice(0, 4).map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.action}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 justify-start text-xs"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <Icon className="h-3 w-3 mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm font-medium">Start a conversation!</p>
                  <p className="text-xs mt-2">Our AI assistant is here to help you 24/7.</p>
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
                disabled={isLoading}
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
                disabled={isLoading || !input.trim()}
                size="icon"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="flex-1 m-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-3">Available Support Staff</p>
                <div className="space-y-3">
                  {supportAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                          getStatusColor(agent.status)
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                        <div className="flex gap-1 mt-1">
                          {agent.specialties.map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Support staff are available 24/7 to assist you with any questions.
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Docs Tab */}
        <TabsContent value="docs" className="flex-1 m-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-3">Documentation & Resources</p>
                <div className="space-y-2">
                  {docLinks.map((doc) => {
                    const Icon = doc.icon;
                    return (
                      <Link
                        key={doc.href}
                        href={doc.href}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{doc.title}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/docs">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse All Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  if (inline) {
    return chatContent;
  }

  return chatContent;
}
