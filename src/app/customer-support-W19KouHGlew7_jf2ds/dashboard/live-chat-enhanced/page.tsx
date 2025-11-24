'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tag,
  X,
  Plus,
  FileText,
  Star,
  AlertCircle,
  Monitor,
  Globe,
  MapPin,
  BookOpen,
  ChevronDown,
  Save,
} from 'lucide-react';
import { supportService } from '@/services/supportService';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatSession {
  id: string;
  customerId: string;
  agentId?: string | null;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  tags?: string[];
  notes?: string;
  rating?: number;
  startedAt: string;
  endedAt?: string;
  lastMessageAt?: string;
  firstResponseAt?: string;
  customerMetadata?: any;
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
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
}

interface SavedReply {
  id: string;
  title: string;
  content: string;
  category?: string;
  usageCount: number;
}

export default function LiveChatEnhancedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [queue, setQueue] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showCustomerProfile, setShowCustomerProfile] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'queue'>('active');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
    fetchSavedReplies();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionMessages();
      const interval = setInterval(fetchSessionMessages, 3000);
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

  const fetchSavedReplies = async () => {
    try {
      const replies = await supportService.getSavedReplies();
      setSavedReplies(replies);
    } catch (error) {
      console.error('Error fetching saved replies:', error);
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

  const handleAddTag = async (tag: string) => {
    if (!selectedSession || !tag.trim()) return;
    try {
      await supportService.addChatTag(selectedSession.id, tag.trim());
      await fetchSessionMessages();
      setNewTag('');
      toast({
        title: 'Success',
        description: 'Tag added',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add tag',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedSession) return;
    try {
      await supportService.removeChatTag(selectedSession.id, tag);
      await fetchSessionMessages();
      toast({
        title: 'Success',
        description: 'Tag removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove tag',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedSession) return;
    try {
      await supportService.updateChatNotes(selectedSession.id, notes);
      setSelectedSession({ ...selectedSession, notes });
      toast({
        title: 'Success',
        description: 'Notes updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update notes',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePriority = async (priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') => {
    if (!selectedSession) return;
    try {
      await supportService.updateChatPriority(selectedSession.id, priority);
      setSelectedSession({ ...selectedSession, priority });
      toast({
        title: 'Success',
        description: 'Priority updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update priority',
        variant: 'destructive',
      });
    }
  };

  const handleUseSavedReply = async (reply: SavedReply) => {
    if (!selectedSession) return;
    try {
      await supportService.useSavedReply(reply.id);
      setMessageContent(reply.content);
      await fetchSavedReplies(); // Refresh to update usage count
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to use saved reply',
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'NORMAL': return 'bg-blue-500';
      case 'LOW': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredSessions = activeSessions.filter(session => {
    if (filterPriority !== 'all' && session.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && session.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Chat List Sidebar */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chat Sessions</CardTitle>
            <CardDescription>
              {filteredSessions.length} active, {queue.length} waiting
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Filters */}
            <div className="p-4 border-b space-y-2">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full rounded-none">
                <TabsTrigger value="active" className="flex-1">
                  Active ({filteredSessions.length})
                </TabsTrigger>
                <TabsTrigger value="queue" className="flex-1">
                  Queue ({queue.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="m-0">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  {loading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                      <p>No active chats</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredSessions.map((session) => (
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
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm truncate">
                                  Customer {session.customerId.substring(0, 8)}
                                </p>
                                <div className="flex items-center gap-1">
                                  {session.priority && (
                                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(session.priority)}`} />
                                  )}
                                  <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {session.status}
                                  </Badge>
                                </div>
                              </div>
                              {session.tags && session.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {session.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {session.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{session.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
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
                <ScrollArea className="h-[calc(100vh-20rem)]">
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
      <div className="flex-1 flex gap-4">
        <div className="flex-1">
          {selectedSession ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback>{getInitials(selectedSession.customerId)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          Customer {selectedSession.customerId.substring(0, 8)}
                        </CardTitle>
                        {selectedSession.priority && (
                          <Badge variant="outline" className={getPriorityColor(selectedSession.priority)}>
                            {selectedSession.priority}
                          </Badge>
                        )}
                        {selectedSession.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{selectedSession.rating}</span>
                          </div>
                        )}
                      </div>
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
                        {selectedSession.firstResponseAt && (
                          <span className="ml-2">
                            • First response: {formatDistanceToNow(new Date(selectedSession.firstResponseAt), { addSuffix: true })}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowCustomerProfile(!showCustomerProfile)}>
                      <User className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleEndChat}>
                      <XCircle className="mr-2 h-4 w-4" />
                      End Chat
                    </Button>
                  </div>
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
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(message.createdAt), 'HH:mm')}
                                </p>
                                {message.isRead && (
                                  <CheckCircle2 className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4 space-y-2">
                  {/* Saved Replies */}
                  {savedReplies.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Saved Replies ({savedReplies.length})
                          <ChevronDown className="ml-auto h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-80">
                        <ScrollArea className="h-64">
                          {savedReplies.map((reply) => (
                            <DropdownMenuItem
                              key={reply.id}
                              onClick={() => handleUseSavedReply(reply)}
                              className="flex flex-col items-start p-3"
                            >
                              <div className="font-medium text-sm">{reply.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{reply.content}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Used {reply.usageCount} times
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </ScrollArea>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

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

        {/* Customer Profile Sidebar */}
        {selectedSession && showCustomerProfile && (
          <Card className="w-80">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Customer Info</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCustomerProfile(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {/* Priority */}
                <div>
                  <Label className="text-xs mb-2">Priority</Label>
                  <Select
                    value={selectedSession.priority || 'NORMAL'}
                    onValueChange={(value: any) => handleUpdatePriority(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Tags */}
                <div>
                  <Label className="text-xs mb-2">Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSession.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(newTag);
                        }
                      }}
                    />
                    <Button size="icon" onClick={() => handleAddTag(newTag)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Customer Metadata */}
                {selectedSession.customerMetadata && (
                  <div>
                    <Label className="text-xs mb-2">Device Info</Label>
                    <div className="space-y-2 text-sm">
                      {selectedSession.customerMetadata.device && (
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedSession.customerMetadata.device}</span>
                        </div>
                      )}
                      {selectedSession.customerMetadata.browser && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedSession.customerMetadata.browser}</span>
                        </div>
                      )}
                      {selectedSession.customerMetadata.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedSession.customerMetadata.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Notes */}
                <div>
                  <Label className="text-xs mb-2">Notes</Label>
                  <Textarea
                    placeholder="Add internal notes..."
                    value={selectedSession.notes || ''}
                    onChange={(e) => {
                      setSelectedSession({ ...selectedSession, notes: e.target.value });
                    }}
                    onBlur={(e) => handleUpdateNotes(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                </div>

                {/* Session Info */}
                <Separator />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Started:</span>
                    <span className="ml-2">{format(new Date(selectedSession.startedAt), 'PPpp')}</span>
                  </div>
                  {selectedSession.lastMessageAt && (
                    <div>
                      <span className="text-muted-foreground">Last message:</span>
                      <span className="ml-2">{formatDistanceToNow(new Date(selectedSession.lastMessageAt), { addSuffix: true })}</span>
                    </div>
                  )}
                  {selectedSession.messages && (
                    <div>
                      <span className="text-muted-foreground">Messages:</span>
                      <span className="ml-2">{selectedSession.messages.length}</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

