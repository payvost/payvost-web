
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListFilter, Search, FileDown, Radio, User, DollarSign, FileText, Bot } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import type { ActivityLog } from '@/types/activity-log';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const sampleActivity: ActivityLog[] = [
    {
        id: 'act_1',
        timestamp: new Date().toISOString(),
        user: { name: 'Alice Johnson', avatar: 'https://placehold.co/100x100.png' },
        action: 'Payout Initiated',
        object: { type: 'Payout', id: 'PO-2024-0012', link: '#' },
        status: 'Success',
        icon: <DollarSign className="h-5 w-5 text-green-500" />,
    },
    {
        id: 'act_2',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        user: { name: 'System Bot', avatar: '' },
        action: 'Invoice Paid',
        object: { type: 'Invoice', id: 'INV-2024-582', link: '#' },
        status: 'Success',
        icon: <FileText className="h-5 w-5 text-blue-500" />,
    },
    {
        id: 'act_3',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        user: { name: 'Bob Williams', avatar: 'https://placehold.co/100x100.png' },
        action: 'New Beneficiary Added',
        object: { type: 'Beneficiary', id: 'Jane Smith', link: '#' },
        status: 'Success',
        icon: <User className="h-5 w-5 text-indigo-500" />,
    },
    {
        id: 'act_4',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        user: { name: 'Alice Johnson', avatar: 'https://placehold.co/100x100.png' },
        action: 'Logged in from new device',
        object: { type: 'Security', id: 'IP: 192.168.1.100', link: '#' },
        status: 'Alert',
        icon: <Bot className="h-5 w-5 text-yellow-500" />,
    },
];

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (name === "System Bot") return <Bot className="h-5 w-5" />;
    if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2).toUpperCase();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};


export default function ActivityFeedPage() {
    const [liveMode, setLiveMode] = useState(false);

    const groupedActivities = sampleActivity.reduce((acc, activity) => {
        const date = formatDate(activity.timestamp);
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
    }, {} as Record<string, ActivityLog[]>);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Activity Feed</h2>
                    <p className="text-muted-foreground">A real-time log of all actions within your business account.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                        <Switch id="live-mode" checked={liveMode} onCheckedChange={setLiveMode} />
                        <Label htmlFor="live-mode" className="flex items-center gap-2">
                            <Radio className={`h-4 w-4 transition-colors ${liveMode ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                            Live Mode
                        </Label>
                    </div>
                </div>
            </div>

             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-2 justify-between">
                         <div className="relative flex-1 md:grow-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by user, action, ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full md:w-auto">
                                    <ListFilter className="mr-2 h-4 w-4" />
                                    Filter by type
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuCheckboxItem>Payouts</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>Invoices</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>Security</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DateRangePicker />
                             <Button variant="outline" className="w-full md:w-auto">
                                <FileDown className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {Object.entries(groupedActivities).map(([date, activities]) => (
                            <div key={date}>
                                <Separator className="mb-4" />
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4">{date}</h3>
                                <div className="flow-root">
                                <ul className="-mb-8">
                                    {activities.map((activity, activityIdx) => (
                                    <li key={activity.id}>
                                        <div className="relative pb-8">
                                        {activityIdx !== activities.length - 1 ? (
                                            <span className="absolute left-6 top-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex items-start space-x-4">
                                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                                                {activity.icon}
                                            </div>
                                            <div className="min-w-0 flex-1 py-1.5">
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{activity.user.name}</span>
                                                {' '}{activity.action.toLowerCase()}{' '}
                                                <Link href={activity.object.link} className="font-medium text-primary hover:underline">
                                                    {activity.object.id}
                                                </Link>
                                                .
                                                <span className="whitespace-nowrap ml-2">
                                                     {new Date(activity.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            </div>
                                             <div className="self-center">
                                                <Badge variant={activity.status === 'Success' ? 'default' : 'destructive'}>{activity.status}</Badge>
                                             </div>
                                        </div>
                                        </div>
                                    </li>
                                    ))}
                                </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
             </Card>
        </div>
    )
}
