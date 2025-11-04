'use client';

import { useState } from 'react';
import { ProtectRoute, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Users, Target, Mail, MessageSquare, History } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  type: 'push' | 'email' | 'in-app';
  target: string;
  sentAt: Date;
  sentBy: string;
  successCount?: number;
  failureCount?: number;
}

export default function AdminNotificationCenterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);

  // Push Notification Form State
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushTarget, setPushTarget] = useState<'all' | 'topic' | 'user'>('all');
  const [pushTargetValue, setPushTargetValue] = useState('');
  const [pushClickAction, setPushClickAction] = useState('');

  // Email Form State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('custom');

  // In-App Message State
  const [inAppTitle, setInAppTitle] = useState('');
  const [inAppBody, setInAppBody] = useState('');
  const [inAppType, setInAppType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [inAppTarget, setInAppTarget] = useState<'all' | 'user'>('all');
  const [inAppTargetUserId, setInAppTargetUserId] = useState('');

  // Load notification history
  useEffect(() => {
    const q = query(
      collection(db, 'notificationHistory'),
      orderBy('sentAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData: NotificationHistory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        historyData.push({
          id: doc.id,
          title: data.title,
          body: data.body,
          type: data.type,
          target: data.target,
          sentAt: data.sentAt?.toDate() || new Date(),
          sentBy: data.sentBy,
          successCount: data.successCount,
          failureCount: data.failureCount,
        });
      });
      setHistory(historyData);
    });

    return () => unsubscribe();
  }, []);

  // Send Push Notification
  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let endpoint = '/api/notification/send-push';
      let payload: any = {
        title: pushTitle,
        body: pushBody,
        data: {
          type: 'admin_notification',
          sentAt: new Date().toISOString(),
        },
        clickAction: pushClickAction || '/dashboard/notifications',
      };

      if (pushTarget === 'topic') {
        endpoint = '/api/notification/send-topic';
        payload.topic = pushTargetValue || 'all_users';
      } else if (pushTarget === 'user') {
        payload.token = pushTargetValue;
      } else {
        endpoint = '/api/notification/send-topic';
        payload.topic = 'all_users';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Save to history
        await addDoc(collection(db, 'notificationHistory'), {
          title: pushTitle,
          body: pushBody,
          type: 'push',
          target: pushTarget === 'all' ? 'All Users' : pushTargetValue,
          sentAt: serverTimestamp(),
          sentBy: user?.uid || 'admin',
          successCount: result.successCount || 1,
          failureCount: result.failureCount || 0,
        });

        toast({
          title: 'Success',
          description: 'Push notification sent successfully',
        });

        // Reset form
        setPushTitle('');
        setPushBody('');
        setPushTargetValue('');
        setPushClickAction('');
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send push notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send Email
  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody || !emailRecipients) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const recipients = emailRecipients.split(',').map(e => e.trim()).filter(e => e);
      
      // Get Firebase ID token for authentication
      const token = await user?.getIdToken();

      // Use new Vercel Edge Function for email sending
      const response = await fetch('/api/notifications/send-batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emails: recipients.map(email => ({
            to: email,
            subject: emailSubject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h2 style="color: #1f2937; margin-bottom: 20px;">${emailSubject}</h2>
                  <div style="color: #374151; line-height: 1.6;">
                    ${emailBody.replace(/\n/g, '<br>')}
                  </div>
                  <p style="margin-top: 30px; color: #6b7280;">Best regards,<br>The Payvost Team</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                  <p>© ${new Date().getFullYear()} Payvost. All rights reserved.</p>
                </div>
              </div>
            `,
          })),
        }),
      });

      const result = await response.json();

      if (result.success && result.successful > 0) {
        // Save to history
        await addDoc(collection(db, 'notificationHistory'), {
          title: emailSubject,
          body: emailBody,
          type: 'email',
          target: `${recipients.length} recipients`,
          sentAt: serverTimestamp(),
          sentBy: user?.uid || 'admin',
          successCount: result.successful,
          failureCount: result.failed,
        });

        toast({
          title: 'Success',
          description: `Email sent to ${result.successful}/${recipients.length} recipients`,
        });

        // Reset form
        setEmailSubject('');
        setEmailBody('');
        setEmailRecipients('');
      } else {
        throw new Error(result.error || 'Failed to send emails');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send In-App Message
  const handleSendInApp = async () => {
    if (!inAppTitle || !inAppBody) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create in-app notification in Firestore
      const notificationData: any = {
        title: inAppTitle,
        message: inAppBody,
        type: inAppType,
        icon: inAppType === 'success' ? 'gift' : inAppType === 'warning' ? 'alert' : 'bell',
        read: false,
        createdAt: serverTimestamp(),
        link: '/dashboard/notifications',
      };

      if (inAppTarget === 'user' && inAppTargetUserId) {
        // Send to specific user
        notificationData.userId = inAppTargetUserId;
        await addDoc(collection(db, 'notifications'), notificationData);
      } else {
        // Send to all users - would need to query all users and create notifications
        // For now, create a broadcast notification
        notificationData.broadcast = true;
        await addDoc(collection(db, 'notifications'), notificationData);
      }

      // Save to history
      await addDoc(collection(db, 'notificationHistory'), {
        title: inAppTitle,
        body: inAppBody,
        type: 'in-app',
        target: inAppTarget === 'all' ? 'All Users' : inAppTargetUserId,
        sentAt: serverTimestamp(),
        sentBy: user?.uid || 'admin',
      });

      toast({
        title: 'Success',
        description: 'In-app message sent successfully',
      });

      // Reset form
      setInAppTitle('');
      setInAppBody('');
      setInAppTargetUserId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send in-app message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectRoute>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground">Send notifications and messages to users</p>
        </div>
        <Tabs defaultValue="push" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="push">
              <Bell className="h-4 w-4 mr-2" />
              Push Notifications
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="in-app">
              <MessageSquare className="h-4 w-4 mr-2" />
              In-App Messages
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Push Notifications Tab */}
          <TabsContent value="push">
            <Card>
              <CardHeader>
                <CardTitle>Send Push Notification</CardTitle>
                <CardDescription>
                  Send real-time push notifications to users' devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="push-title">Title *</Label>
                  <Input
                    id="push-title"
                    placeholder="Notification title"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="push-body">Message *</Label>
                  <Textarea
                    id="push-body"
                    placeholder="Notification message"
                    rows={3}
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={pushTarget} onValueChange={(value: any) => setPushTarget(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          All Users
                        </div>
                      </SelectItem>
                      <SelectItem value="topic">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          Topic/Segment
                        </div>
                      </SelectItem>
                      <SelectItem value="user">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Specific User
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(pushTarget === 'topic' || pushTarget === 'user') && (
                  <div className="space-y-2">
                    <Label htmlFor="push-target-value">
                      {pushTarget === 'topic' ? 'Topic Name' : 'User FCM Token'}
                    </Label>
                    <Input
                      id="push-target-value"
                      placeholder={pushTarget === 'topic' ? 'e.g., verified_users' : 'FCM device token'}
                      value={pushTargetValue}
                      onChange={(e) => setPushTargetValue(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="push-click-action">Click Action URL (Optional)</Label>
                  <Input
                    id="push-click-action"
                    placeholder="/dashboard/transactions"
                    value={pushClickAction}
                    onChange={(e) => setPushClickAction(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSendPush}
                  disabled={isLoading || !pushTitle || !pushBody}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Push Notification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Send Email Notification</CardTitle>
                <CardDescription>
                  Send email notifications to multiple recipients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-recipients">Recipients * (comma-separated)</Label>
                  <Textarea
                    id="email-recipients"
                    placeholder="user1@example.com, user2@example.com"
                    rows={3}
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject *</Label>
                  <Input
                    id="email-subject"
                    placeholder="Email subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-template">Template</Label>
                  <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Message</SelectItem>
                      <SelectItem value="transaction_success">Transaction Success</SelectItem>
                      <SelectItem value="kyc_verified">KYC Verified</SelectItem>
                      <SelectItem value="bill_payment_success">Bill Payment Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Message *</Label>
                  <Textarea
                    id="email-body"
                    placeholder="Email message body"
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSendEmail}
                  disabled={isLoading || !emailSubject || !emailBody || !emailRecipients}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* In-App Messages Tab */}
          <TabsContent value="in-app">
            <Card>
              <CardHeader>
                <CardTitle>Send In-App Message</CardTitle>
                <CardDescription>
                  Create in-app notifications visible in the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="in-app-title">Title *</Label>
                  <Input
                    id="in-app-title"
                    placeholder="Message title"
                    value={inAppTitle}
                    onChange={(e) => setInAppTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="in-app-body">Message *</Label>
                  <Textarea
                    id="in-app-body"
                    placeholder="Message body"
                    rows={4}
                    value={inAppBody}
                    onChange={(e) => setInAppBody(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select value={inAppType} onValueChange={(value: any) => setInAppType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={inAppTarget} onValueChange={(value: any) => setInAppTarget(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="user">Specific User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inAppTarget === 'user' && (
                  <div className="space-y-2">
                    <Label htmlFor="in-app-user-id">User ID</Label>
                    <Input
                      id="in-app-user-id"
                      placeholder="Firebase User ID"
                      value={inAppTargetUserId}
                      onChange={(e) => setInAppTargetUserId(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={handleSendInApp}
                  disabled={isLoading || !inAppTitle || !inAppBody}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send In-App Message'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  View recently sent notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No notifications sent yet
                      </div>
                    ) : (
                      history.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge variant={
                              item.type === 'push' ? 'default' :
                              item.type === 'email' ? 'secondary' : 'outline'
                            }>
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.body}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>To: {item.target}</span>
                            <span>{item.sentAt.toLocaleString()}</span>
                          </div>
                          {(item.successCount !== undefined || item.failureCount !== undefined) && (
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline" className="bg-green-50">
                                ✓ {item.successCount || 0}
                              </Badge>
                              {item.failureCount ? (
                                <Badge variant="outline" className="bg-red-50">
                                  ✗ {item.failureCount}
                                </Badge>
                              ) : null}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectRoute>
  );
}
