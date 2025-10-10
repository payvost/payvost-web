'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLog } from '@/components/activity-log';

export default function BusinessActivityPage() {
  return (
    <>
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Activity Feed</h2>
                <p className="text-muted-foreground">A real-time log of all significant events in your business account.</p>
            </div>
        </div>
        <ActivityLog />
    </>
  );
}
