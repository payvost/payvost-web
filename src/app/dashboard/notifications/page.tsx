
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Gift, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Notification {
  id: string;
  icon: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
  href?: string;
}

const iconMap: { [key: string]: React.ReactNode } = {
  gift: <Gift className="h-5 w-5 text-primary" />,
  alert: <AlertTriangle className="h-5 w-5 text-destructive" />,
  success: <CheckCheck className="h-5 w-5 text-green-500" />,
  kyc: <ShieldCheck className="h-5 w-5 text-blue-500" />,
};

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    const q = query(collection(db, "users", user.uid, "notifications"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
        })) as Notification[];
        setNotifications(fetchedNotifications);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    const notifRef = doc(db, "users", user.uid, "notifications", id);
    await updateDoc(notifRef, { read: true });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
        const notifRef = doc(db, "users", user.uid, "notifications", n.id);
        batch.update(notifRef, { read: true });
    });
    await batch.commit();
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return false;
  });

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const content = (
      <div 
        className={cn("flex items-start gap-4 p-4 rounded-lg cursor-pointer hover:bg-muted/50", !notification.read && 'bg-muted/50')}
        onClick={() => markAsRead(notification.id)}
      >
          <div className="mt-1">{iconMap[notification.icon] || <Bell className="h-5 w-5"/>}</div>
          <div className="flex-1">
              <p className="font-semibold text-sm">{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.date)}</p>
          </div>
          {!notification.read && (
              <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 self-center shrink-0"></div>
          )}
      </div>
    );

    if (notification.href) {
        return <Link href={notification.href}>{content}</Link>
    }
    
    return content;
  }

  const renderNotificationList = (list: typeof notifications) => (
    <div className="space-y-4">
        {list.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
        ))}
    </div>
  );

  return (
    <>
      <main className="flex-1 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold md:text-2xl">Notifications</h1>
            <Button onClick={markAllAsRead} variant="outline" disabled={notifications.every(n => n.read)}>
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
            </Button>
        </div>
        <Card>
            <CardHeader>
                <Tabs defaultValue="all" onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    renderNotificationList(filteredNotifications)
                ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <Bell className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="font-semibold">No {activeTab === 'unread' && 'new'} notifications</h3>
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </>
  );
}
