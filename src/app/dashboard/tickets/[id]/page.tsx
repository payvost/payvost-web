'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { supportService, type SupportTicket, type TicketMessage, type TicketStatus, type TicketPriority } from '@/services/supportService';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  OPEN: { label: 'Open', variant: 'default', icon: AlertCircle },
  PENDING: { label: 'Pending', variant: 'secondary', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'default', icon: Clock },
  RESOLVED: { label: 'Resolved', variant: 'default', icon: CheckCircle2 },
  CLOSED: { label: 'Closed', variant: 'secondary', icon: XCircle },
};

const priorityConfig: Record<TicketPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: 'Low', variant: 'secondary' },
  MEDIUM: { label: 'Medium', variant: 'default' },
  HIGH: { label: 'High', variant: 'default' },
  URGENT: { label: 'Urgent', variant: 'destructive' },
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<(SupportTicket & { messages: TicketMessage[]; attachments: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    if (ticketId && user?.uid) {
      fetchTicket();
    }
  }, [ticketId, user]);

  const fetchTicket = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const data = await supportService.getTicket(ticketId);
      
      // Verify this ticket belongs to the current user
      if (data.customerId !== user.uid) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this ticket',
          variant: 'destructive',
        });
        router.push('/dashboard/tickets');
        return;
      }
      
      setTicket(data);
    } catch (error: any) {
      console.error('Error fetching ticket:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load ticket',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !ticketId) return;

    setReplying(true);
    try {
      await supportService.addMessage(ticketId, messageContent, 'PUBLIC_REPLY');
      setMessageContent('');
      await fetchTicket();
      toast({
        title: 'Success',
        description: 'Your message has been sent',
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
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex flex-1 flex-col w-full p-6">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex flex-1 flex-col w-full p-6">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Ticket not found</h3>
            <Button onClick={() => router.push('/dashboard/tickets')} className="mt-4">
              Back to My Tickets
            </Button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const statusInfo = statusConfig[ticket.status];
  const priorityInfo = priorityConfig[ticket.priority];
  const StatusIcon = statusInfo.icon;

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col w-full p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/tickets')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{ticket.subject}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm">{ticket.ticketNumber}</span>
                  <span>•</span>
                  <span>Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
              <Badge variant={priorityInfo.variant}>
                {priorityInfo.label}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Issue Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">{ticket.description}</p>
                  {ticket.tags && ticket.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {ticket.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="capitalize">
                          {tag.replace(/-/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation
                  </CardTitle>
                  <CardDescription>
                    {ticket.messages?.length || 0} message{(ticket.messages?.length || 0) !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ticket.messages && ticket.messages.length > 0 ? (
                      ticket.messages
                        .filter(msg => msg.type === 'PUBLIC_REPLY') // Only show public messages to customers
                        .map((message) => {
                          const isCustomer = message.authorId === user?.uid;
                          return (
                            <div
                              key={message.id}
                              className={`flex gap-4 p-4 rounded-lg border ${
                                isCustomer 
                                  ? 'bg-primary/5 border-primary/20' 
                                  : 'bg-muted/30'
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
                                    {isCustomer ? 'You' : (message.author?.name || message.author?.email || 'Support Team')}
                                  </span>
                                  <Badge variant={isCustomer ? 'default' : 'secondary'} className="text-xs">
                                    {isCustomer ? 'Customer' : 'Support'}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(message.createdAt), 'PPp')}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-8 border rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reply Form - Only show if ticket is not closed */}
                  {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                    <div className="mt-6 space-y-4 border-t pt-6">
                      <div>
                        <Textarea
                          placeholder="Type your reply here..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Your message will be visible to the support team
                        </p>
                      </div>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={replying || !messageContent.trim()}
                        className="w-full sm:w-auto"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {replying ? 'Sending...' : 'Send Message'}
                      </Button>
                    </div>
                  )}

                  {ticket.status === 'CLOSED' && (
                    <div className="mt-6 p-4 bg-muted rounded-lg text-center">
                      <XCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        This ticket is closed. You can create a new ticket if you need further assistance.
                      </p>
                    </div>
                  )}

                  {ticket.status === 'RESOLVED' && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-center border border-green-200 dark:border-green-900">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        This ticket has been resolved
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        If you need further assistance, you can reply to reopen the ticket or create a new one.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Category
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {ticket.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <StatusIcon className="h-3 w-3" />
                      Status
                    </p>
                    <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Priority</p>
                    <Badge variant={priorityInfo.variant}>
                      {priorityInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Created
                    </p>
                    <p className="text-sm">{format(new Date(ticket.createdAt), 'PPp')}</p>
                  </div>
                  {ticket.updatedAt && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-sm">{format(new Date(ticket.updatedAt), 'PPp')}</p>
                    </div>
                  )}
                  {ticket.resolvedAt && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Resolved</p>
                      <p className="text-sm">{format(new Date(ticket.resolvedAt), 'PPp')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Support Agent */}
              {ticket.assignedTo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assigned To
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {ticket.assignedTo.name?.[0] || ticket.assignedTo.email?.[0] || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{ticket.assignedTo.name || 'Support Agent'}</p>
                        <p className="text-sm text-muted-foreground">{ticket.assignedTo.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/support')}
                  >
                    Create New Ticket
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/tickets')}
                  >
                    View All Tickets
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

