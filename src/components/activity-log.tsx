
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, UserPlus, Activity } from 'lucide-react';
import Link from 'next/link';
import type { ActivityLog as ActivityLogType, ActivityStatus } from '@/types/activity-log';
import { Skeleton } from '@/components/ui/skeleton';

const statusConfig: Record<ActivityStatus, { color: string }> = {
    Success: { color: 'text-green-500' },
    Failed: { color: 'text-red-500' },
    Pending: { color: 'text-yellow-500' },
    Alert: { color: 'text-orange-500' },
};

const defaultActivityLogs: ActivityLogType[] = [
  { id: '1', timestamp: '2024-08-15T10:00:00Z', user: { name: 'You' }, action: 'Payout Initiated', object: { type: 'Payout', id: 'PO-123', link: '/dashboard/payments/send' }, status: 'Success', icon: <DollarSign className="h-4 w-4" /> },
  { id: '2', timestamp: '2024-08-15T09:30:00Z', user: { name: 'System' }, action: 'Invoice Paid', object: { type: 'Invoice', id: 'INV-002', link: '/dashboard/request-payment?tab=invoice' }, status: 'Success', icon: <FileText className="h-4 w-4" /> },
  { id: '3', timestamp: '2024-08-14T15:00:00Z', user: { name: 'System' }, action: 'New Contact', object: { type: 'Customer', id: 'CUST-456', link: '/dashboard/customers' }, status: 'Success', icon: <UserPlus className="h-4 w-4" /> },
];

function formatTimeAgo(isoString: string) {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface ActivityLogProps {
    logs?: ActivityLogType[];
    loading?: boolean;
}

export function ActivityLog({ logs, loading = false }: ActivityLogProps) {
    const activityLogs = logs && logs.length > 0 ? logs : defaultActivityLogs;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activityLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {activityLogs.map((log) => (
                            <li key={log.id} className="flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-full bg-muted`}>
                                    {log.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{log.action}</p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className={statusConfig[log.status].color}>{log.status}</span>
                                        {' \u2022 '}
                                        <Link href={log.object.link} className="hover:underline">
                                            {log.object.id}
                                        </Link>
                                        {' \u2022 '}
                                        {formatTimeAgo(log.timestamp)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
