'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { supportService, type SupportTicket, type TicketMessage, type TicketStatus, type TicketPriority, type MessageType } from '@/services/supportService';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const statusColors: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const priorityColors: Record<TicketPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<(SupportTicket & { messages: TicketMessage[]; attachments: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('PUBLIC_REPLY');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await supportService.getTicket(ticketId);
      setTicket(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load ticket',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    setUpdating(true);
    try {
      await supportService.updateStatus(ticketId, status);
      await fetchTicket();
      toast({
        title: 'Success',
        description: 'Ticket status updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    setUpdating(true);
    try {
      await supportService.updateTicket(ticketId, { priority });
      await fetchTicket();
      toast({
        title: 'Success',
        description: 'Ticket priority updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update priority',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;

    setReplying(true);
    try {
      await supportService.addMessage(ticketId, messageContent, messageType);
      setMessageContent('');
      await fetchTicket();
      toast({
        title: 'Success',
        description: 'Message sent',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Ticket not found</h3>
        <Button onClick={() => router.push('/customer-support-W19KouHGlew7_jf2ds/dashboard/tickets')} className="mt-4">
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ticket.subject}</h1>
            <p className="text-muted-foreground">
              {ticket.ticketNumber} • Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={ticket.status}
            onValueChange={(v) => handleStatusChange(v as TicketStatus)}
            disabled={updating}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ticket.priority}
            onValueChange={(v) => handlePriorityChange(v as TicketPriority)}
            disabled={updating}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {ticket.messages?.length || 0} message{(ticket.messages?.length || 0) !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 p-4 rounded-lg ${
                        message.type === 'INTERNAL_NOTE' ? 'bg-muted/50' : 'bg-background'
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {message.author?.name?.[0] || message.author?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {message.author?.name || message.author?.email || 'Unknown'}
                          </span>
                          {message.type === 'INTERNAL_NOTE' && (
                            <Badge variant="outline" className="text-xs">
                              Internal Note
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(message.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Be the first to reply!
                  </p>
                )}
              </div>

              {/* Reply Form */}
              <div className="mt-6 space-y-4 border-t pt-6">
                <div className="flex gap-2">
                  <Select value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC_REPLY">Public Reply</SelectItem>
                      <SelectItem value="INTERNAL_NOTE">Internal Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder={messageType === 'INTERNAL_NOTE' ? 'Add an internal note...' : 'Type your reply...'}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSendMessage} disabled={replying || !messageContent.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {replying ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={statusColors[ticket.status]}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <Badge className={priorityColors[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p>{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{format(new Date(ticket.createdAt), 'PPp')}</p>
              </div>
              {ticket.updatedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{format(new Date(ticket.updatedAt), 'PPp')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{ticket.customer?.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{ticket.customer?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.assignedTo ? (
                <div>
                  <p className="font-medium">{ticket.assignedTo.name || ticket.assignedTo.email}</p>
                  <p className="text-sm text-muted-foreground">{ticket.assignedTo.email}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

