
'use client';

import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { Button } from "./ui/button"
  import { Bell, CheckCheck, Gift, AlertTriangle, ShieldCheck } from "lucide-react"
  import { Badge } from "./ui/badge";
  import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
  import { ScrollArea } from "./ui/scroll-area";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
  import { useAuth } from "@/hooks/use-auth";
  import { db } from "@/lib/firebase";
  import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, where } from "firebase/firestore";
  import { Skeleton } from "./ui/skeleton";
  import Link from "next/link";
  import { cn } from "@/lib/utils";
  
  interface Notification {
    id: string;
    icon: string;
    title: string;
    description: string;
    date: Date;
    read: boolean;
    href?: string;
    context?: 'personal' | 'business';
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

interface NotificationDropdownProps {
    context: 'personal' | 'business';
}

export function NotificationDropdown({ context }: NotificationDropdownProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const notificationsRef = collection(db, "users", user.uid, "notifications");
        const q = query(notificationsRef, where("context", "==", context), orderBy("date", "desc"));
        
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
    }, [user, context]);
    
    const markAsRead = async (id: string) => {
        if (!user) return;
        const notifRef = doc(db, "users", user.uid, "notifications", id);
        await updateDoc(notifRef, { read: true });
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length === 0) return;

        const batch = writeBatch(db);
        unreadNotifications.forEach(n => {
            const notifRef = doc(db, "users", user.uid, "notifications", n.id);
            batch.update(notifRef, { read: true });
        });
        await batch.commit();
    };


    const unreadCount = notifications.filter(n => !n.read).length;
    const newNotifications = notifications.filter(n => !n.read);
    const earlierNotifications = notifications.filter(n => n.read);

    const NotificationItem = ({ notification }: { notification: Notification }) => {
        const content = (
          <div 
            className={cn("flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer", !notification.read && "bg-blue-500/5")}
            onClick={() => !notification.read && markAsRead(notification.id)}
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
        <div className="divide-y divide-border">
            {list.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
            ))}
        </div>
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 md:w-96 p-0" align="end">
            <Card className="border-0">
                <CardHeader className="flex-row items-center justify-between p-4 pb-0">
                    <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                    <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                       <Link href="/dashboard/notifications">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="all">
                        <TabsList className="px-4 w-full justify-start rounded-none border-b bg-transparent">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="h-80">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : (
                                <>
                                <TabsContent value="all">
                                    {notifications.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-16"><p>No notifications yet.</p></div>
                                    ) : (
                                        <>
                                            {newNotifications.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground px-4 py-2">New</h4>
                                                    {renderNotificationList(newNotifications)}
                                                </div>
                                            )}
                                            {earlierNotifications.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground px-4 py-2">Earlier</h4>
                                                    {renderNotificationList(earlierNotifications)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </TabsContent>
                                <TabsContent value="unread">
                                    {newNotifications.length > 0 ? renderNotificationList(newNotifications) : (
                                        <div className="text-center text-muted-foreground py-16">
                                            <p>You're all caught up!</p>
                                        </div>
                                    )}
                                </TabsContent>
                                </>
                            )}
                        </ScrollArea>
                    </Tabs>
                </CardContent>
                <CardFooter className="border-t p-2">
                    <Button size="sm" className="w-full" variant="ghost" onClick={markAllAsRead} disabled={unreadCount === 0}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                </CardFooter>
            </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
}
