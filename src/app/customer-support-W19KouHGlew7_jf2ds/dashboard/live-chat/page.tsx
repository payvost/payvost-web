'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { supportService } from '@/services/supportService';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatSession {
  id: string;
  customerId: string;
  agentId?: string | null;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt?: string;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
}

export default function LiveChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [queue, setQueue] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'queue'>('active');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionMessages();
      const interval = setInterval(fetchSessionMessages, 3000); // Poll messages every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedSession?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages]);

  const fetchData = async () => {
    try {
      const [activeResult, queueResult] = await Promise.all([
        supportService.listChatSessions({ status: 'ACTIVE', limit: 50 }),
        supportService.getChatQueue(),
      ]);
      setActiveSessions(activeResult.sessions);
      setQueue(queueResult);
    } catch (error: any) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionMessages = async () => {
    if (!selectedSession) return;
    try {
      const session = await supportService.getChatSession(selectedSession.id);
      setSessionMessages(session.messages || []);
      setSelectedSession(session);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    setSelectedSession(session);
    setActiveTab('active');
    try {
      const fullSession = await supportService.getChatSession(session.id);
      setSessionMessages(fullSession.messages || []);
      setSelectedSession(fullSession);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load chat',
        variant: 'destructive',
      });
    }
  };

  const handleAssignToMe = async (session: ChatSession) => {
    if (!user?.uid) return;
    try {
      await supportService.assignChatSession(session.id, user.uid);
      await fetchData();
      handleSelectSession({ ...session, agentId: user.uid, status: 'ACTIVE' });
      toast({
        title: 'Success',
        description: 'Chat assigned to you',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign chat',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedSession) return;

    setSending(true);
    try {
      await supportService.addChatMessage(selectedSession.id, messageContent, 'text');
      setMessageContent('');
      await fetchSessionMessages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleEndChat = async () => {
    if (!selectedSession) return;
    try {
      await supportService.endChatSession(selectedSession.id);
      await fetchData();
      setSelectedSession(null);
      setSessionMessages([]);
      toast({
        title: 'Success',
        description: 'Chat ended',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to end chat',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (id: string) => {
    return id.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat List Sidebar */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chat Sessions</CardTitle>
            <CardDescription>
              {activeSessions.length} active, {queue.length} waiting
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full rounded-none">
                <TabsTrigger value="active" className="flex-1">
                  Active ({activeSessions.length})
                </TabsTrigger>
                <TabsTrigger value="queue" className="flex-1">
                  Queue ({queue.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="m-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  {loading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                      <p>No active chats</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {activeSessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedSession?.id === session.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleSelectSession(session)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(session.customerId)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">
                                  Customer {session.customerId.substring(0, 8)}
                                </p>
                                <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {session.status}
                                </Badge>
                              </div>
                              {session.messages && session.messages[0] && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {session.messages[0].content}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="queue" className="m-0">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  {loading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : queue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
                      <p>No chats in queue</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {queue.map((session) => (
                        <div
                          key={session.id}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(session.customerId)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">
                                  Customer {session.customerId.substring(0, 8)}
                                </p>
                                <Badge variant="outline">Waiting</Badge>
                              </div>
                              {session.messages && session.messages[0] && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {session.messages[0].content}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                              </p>
                              <Button
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => handleAssignToMe(session)}
                              >
                                Assign to Me
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="flex-1">
        {selectedSession ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(selectedSession.customerId)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      Customer {selectedSession.customerId.substring(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {selectedSession.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-500" />
                          Waiting
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleEndChat}>
                  <XCircle className="mr-2 h-4 w-4" />
                  End Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {sessionMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    sessionMessages.map((message) => {
                      const isAgent = message.senderId === user?.uid;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {isAgent ? 'A' : 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                isAgent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(message.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !messageContent.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
              <p className="text-muted-foreground">
                Select a chat from the sidebar to start messaging
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

