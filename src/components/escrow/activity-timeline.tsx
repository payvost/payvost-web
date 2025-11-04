'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  DollarSign,
  FileText,
  UserCheck,
  Upload
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  description: string;
  performedBy?: string;
  performedByRole?: string;
  createdAt: Date;
}

interface EscrowActivityTimelineProps {
  activities: Activity[];
}

const activityIcons: Record<string, any> = {
  ESCROW_CREATED: FileText,
  PARTY_ACCEPTED: UserCheck,
  ALL_PARTIES_ACCEPTED: CheckCircle,
  ESCROW_FUNDED: DollarSign,
  MILESTONE_FUNDED: DollarSign,
  DELIVERABLE_SUBMITTED: Upload,
  MILESTONE_RELEASED: CheckCircle,
  ESCROW_COMPLETED: ShieldCheck,
  DISPUTE_RAISED: AlertCircle,
  DISPUTE_RESOLVED: CheckCircle,
  ESCROW_CANCELLED: AlertCircle,
};

const activityColors: Record<string, string> = {
  ESCROW_CREATED: 'bg-blue-500',
  PARTY_ACCEPTED: 'bg-green-500',
  ALL_PARTIES_ACCEPTED: 'bg-green-500',
  ESCROW_FUNDED: 'bg-purple-500',
  MILESTONE_FUNDED: 'bg-purple-500',
  DELIVERABLE_SUBMITTED: 'bg-blue-500',
  MILESTONE_RELEASED: 'bg-green-500',
  ESCROW_COMPLETED: 'bg-green-500',
  DISPUTE_RAISED: 'bg-red-500',
  DISPUTE_RESOLVED: 'bg-green-500',
  ESCROW_CANCELLED: 'bg-gray-500',
};

export function EscrowActivityTimeline({ activities }: EscrowActivityTimelineProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || Clock;
            const color = activityColors[activity.type] || 'bg-gray-500';
            
            return (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="h-full w-px bg-border mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.performedByRole && (
                      <Badge variant="outline" className="text-xs">
                        {activity.performedByRole}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
