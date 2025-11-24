'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { chatService, type ChatMessage, type ChatSession } from '@/services/chatService';
import { getAiSupportResponse } from '@/app/actions';
import type { ChatInput } from '@/types/chat';
import type { EnhancedChatMessage, RichMessageMetadata } from '@/types/chat';
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
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Download,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Link from 'next/link';

interface ProfessionalChatWidgetProps {
  className?: string;
  initialMinimized?: boolean;
  inline?: boolean;
}

export function ProfessionalChatWidget({ 
  className,
  initialMinimized = false,
  inline = false,
}: ProfessionalChatWidgetProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'docs'>('chat');
  const [useFallback, setUseFallback] = useState(false);
  
  // Scroll lock state
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = `chat-draft-${sessionId || 'default'}`;

  // Load draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        setInput(draft);
      }
    }
  }, [draftKey]);

  // Save draft on input change
  useEffect(() => {
    if (typeof window !== 'undefined' && input) {
      localStorage.setItem(draftKey, input);
    } else if (typeof window !== 'undefined' && !input) {
      localStorage.removeItem(draftKey);
    }
  }, [input, draftKey]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const initializeChat = async () => {
      try {
        const chatSession = await chatService.createOrGetSession();
        setSession(chatSession);
        setSessionId(chatSession.id);

        const ws = await chatService.connect();
        setSocket(ws);
        
        setTimeout(() => {
          setIsConnected(ws.connected);
          if (!ws.connected) {
            setUseFallback(true);
          }
        }, 2000);

        if (ws.connected) {
          ws.emit('join:session', chatSession.id);
        }

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
          setMessages(history.map(convertToEnhanced));
          scrollToBottom();
        });

        ws.on('message:new', ({ message }: { message: ChatMessage }) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            const newMessages = [...prev, convertToEnhanced(message)];
            // Auto-scroll if user is at bottom
            if (shouldAutoScroll && !userScrolledUp) {
              setTimeout(() => scrollToBottom(), 100);
            } else {
              setShowNewMessageIndicator(true);
            }
            return newMessages;
          });
        });

        ws.on('message:read', ({ messageId, readAt }: { messageId: string; readAt?: string }) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, isRead: true, readAt, readBy: user?.uid }
                : msg
            )
          );
        });

        ws.on('typing:start', ({ userId }: { userId: string }) => {
          if (userId !== user?.uid) {
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

        ws.on('connect_error', () => {
          setUseFallback(true);
          setIsConnected(false);
        });

        setSocket(ws);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setUseFallback(true);
        setIsConnected(false);
      }
    };

    initializeChat();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      chatService.disconnect();
    };
  }, [user]);

  const convertToEnhanced = (msg: ChatMessage): EnhancedChatMessage => ({
    ...msg,
    type: (msg.type as any) || 'text',
    attachments: (msg.metadata as any)?.attachments,
    metadata: msg.metadata as RichMessageMetadata,
  });

  const handleScroll = useCallback(() => {
    const element = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setUserScrolledUp(!isNearBottom);
    setShouldAutoScroll(isNearBottom);
    
    if (isNearBottom) {
      setShowNewMessageIndicator(false);
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      const element = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
      setUserScrolledUp(false);
      setShouldAutoScroll(true);
      setShowNewMessageIndicator(false);
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setInput('');
    localStorage.removeItem(draftKey);
    setIsLoading(true);

    const userMessage: EnhancedChatMessage = {
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

        const aiMessage: EnhancedChatMessage = {
          id: `ai-${Date.now()}`,
          sessionId: sessionId || 'fallback',
          senderId: 'AI_ASSISTANT',
          content: result.message,
          type: 'ai_response',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('AI error:', error);
      }
      setIsLoading(false);
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing:stop', { sessionId });

    socket.emit('message:send', {
      sessionId,
      content,
      type: 'text',
    });

    setIsLoading(false);
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

  const handleFileUpload = async (file: File) => {
    if (!sessionId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/support/chat/sessions/${sessionId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url, metadata } = await response.json();

      if (socket && isConnected) {
        socket.emit('message:send', {
          sessionId,
          content: file.name,
          type: 'file',
          metadata: {
            file: {
              url,
              name: file.name,
              type: file.type,
              size: file.size,
              ...metadata,
            },
          },
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const renderRichMessage = (message: EnhancedChatMessage) => {
    if (message.type === 'file' && message.metadata?.file) {
      const file = message.metadata.file;
      const isImage = file.type?.startsWith('image/');
      
      return (
        <div className="space-y-2">
          {isImage && file.thumbnail && (
            <img 
              src={file.thumbnail} 
              alt={file.name}
              className="max-w-xs rounded-lg"
            />
          )}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <FileText className="h-4 w-4" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <a href={file.url} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
      );
    }

    if (message.type === 'card' && message.metadata?.card) {
      const card = message.metadata.card;
      return (
        <div className="border rounded-lg p-4 space-y-3 max-w-sm">
          {card.image && (
            <img src={card.image} alt={card.title} className="w-full rounded" />
          )}
          <div>
            <h4 className="font-semibold">{card.title}</h4>
            {card.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </div>
          {card.buttons && card.buttons.length > 0 && (
            <div className="flex flex-col gap-2">
              {card.buttons.map((btn, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Handle button action
                    console.log('Button clicked:', btn.action, btn.value);
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (message.type === 'button' && message.metadata?.buttons) {
      return (
        <div className="flex flex-wrap gap-2">
          {message.metadata.buttons.map((btn, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Button clicked:', btn.action, btn.value);
              }}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      );
    }

    if (message.type === 'list' && message.metadata?.list) {
      return (
        <div className="space-y-1">
          {message.metadata.list.map((item, idx) => (
            <div
              key={idx}
              className="p-2 hover:bg-muted rounded cursor-pointer"
              onClick={() => {
                if (item.action) {
                  console.log('List item clicked:', item.action);
                }
              }}
            >
              <p className="font-medium text-sm">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  const renderReadReceipt = (message: EnhancedChatMessage) => {
    if (message.senderId !== user?.uid) return null;

    if (message.isRead) {
      return (
        <div className="flex items-center gap-1 mt-1">
          <CheckCheck className="h-3 w-3 text-blue-500" />
          <span className="text-xs text-muted-foreground">Read</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 mt-1">
        <Check className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Delivered</span>
      </div>
    );
  };

  if (isMinimized && !inline) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn('fixed bottom-4 right-4 z-50', className)}
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
          : 'fixed bottom-4 right-4 w-96 h-[600px] bg-background border rounded-lg shadow-2xl flex flex-col z-50',
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
              {isConnected ? 'Online' : useFallback ? 'Direct AI Mode' : 'Connecting...'}
            </p>
          </div>
        </div>
        {!inline && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
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
          {/* Messages */}
          <ScrollArea 
            className="flex-1 p-4" 
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
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
                      {renderRichMessage(message)}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </p>
                        {isUser && renderReadReceipt(message)}
                      </div>
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

              {/* New message indicator */}
              {showNewMessageIndicator && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToBottom}
                    className="rounded-full"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    New messages
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
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
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
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
                  {[
                    { id: '1', name: 'Sarah Johnson', role: 'Senior Support', status: 'online' },
                    { id: '2', name: 'Michael Chen', role: 'Technical Support', status: 'online' },
                    { id: '3', name: 'Emily Davis', role: 'Account Specialist', status: 'away' },
                  ].map((agent) => (
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
                          agent.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  {[
                    { title: 'Getting Started Guide', href: '/docs/getting-started', icon: BookOpen },
                    { title: 'API Documentation', href: '/docs/api', icon: BookOpen },
                    { title: 'Payment Methods', href: '/docs/payments', icon: BookOpen },
                  ].map((doc) => {
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
                      </Link>
                    );
                  })}
                </div>
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

