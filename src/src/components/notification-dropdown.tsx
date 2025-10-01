
'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { Button } from "./ui/button"
  import { Bell, CheckCheck, Gift, AlertTriangle } from "lucide-react"
  import { Badge } from "./ui/badge";
  import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
  import { ScrollArea } from "./ui/scroll-area";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
  
  const notifications = [
    {
      icon: <Gift className="h-5 w-5 text-primary" />,
      title: "You've got a reward!",
      description: "You have received a $10 bonus for your recent activity.",
      date: new Date(),
      read: false,
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      title: "Security Alert",
      description: "A new device has logged into your account from an unknown location.",
      date: new Date(),
      read: false,
    },
    {
      icon: <CheckCheck className="h-5 w-5 text-green-500" />,
      title: "Transfer Complete",
      description: "Your transfer of $250 to John Doe has been successfully completed.",
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      read: true,
    },
     {
      icon: <CheckCheck className="h-5 w-5 text-green-500" />,
      title: "Transfer Complete",
      description: "Your transfer of $500 to Jane Smith has been successfully completed.",
      date: new Date(new Date().setDate(new Date().getDate() - 2)),
      read: true,
    },
  ];

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

export function NotificationDropdown() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const newNotifications = notifications.filter(n => !n.read);
    const earlierNotifications = notifications.filter(n => n.read);

    const renderNotificationList = (list: typeof notifications) => (
        <div className="divide-y divide-border">
            {list.map((notification, index) => (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="mt-1">{notification.icon}</div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.date)}</p>
                    </div>
                    {!notification.read && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 self-center shrink-0"></div>
                    )}
                </div>
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
                    <Button variant="link" size="sm" className="p-0 h-auto">View All</Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="all">
                        <TabsList className="px-4 w-full justify-start rounded-none border-b bg-transparent">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="h-80">
                            <TabsContent value="all">
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
                            </TabsContent>
                             <TabsContent value="unread">
                                {newNotifications.length > 0 ? renderNotificationList(newNotifications) : (
                                    <div className="text-center text-muted-foreground py-16">
                                        <p>You're all caught up!</p>
                                    </div>
                                )}
                             </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </CardContent>
                <CardFooter className="border-t p-2">
                    <Button size="sm" className="w-full" variant="ghost">
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                </CardFooter>
            </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
}
