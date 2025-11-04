'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Upload,
  Eye
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  amountFunded: number;
  fundingProgress: number;
  deliverableSubmitted: boolean;
  deliverableUrl?: string;
}

interface MilestoneCardProps {
  milestone: Milestone;
  currency: string;
  onFund?: () => void;
  onSubmitDeliverable?: () => void;
  onRelease?: () => void;
  onViewDeliverable?: () => void;
  userRole: 'BUYER' | 'SELLER' | 'MEDIATOR';
}

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Pending' },
  AWAITING_FUNDING: { icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Awaiting Funding' },
  FUNDED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Funded' },
  UNDER_REVIEW: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Under Review' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
  RELEASED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Released' },
  DISPUTED: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Disputed' },
  CANCELLED: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cancelled' },
};

export function MilestoneCard({ 
  milestone, 
  currency, 
  onFund, 
  onSubmitDeliverable, 
  onRelease,
  onViewDeliverable,
  userRole 
}: MilestoneCardProps) {
  const config = statusConfig[milestone.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;

  const canFund = userRole === 'BUYER' && milestone.status === 'AWAITING_FUNDING';
  const canSubmitDeliverable = userRole === 'SELLER' && milestone.status === 'FUNDED' && !milestone.deliverableSubmitted;
  const canRelease = userRole === 'BUYER' && milestone.status === 'UNDER_REVIEW';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{milestone.title}</CardTitle>
            {milestone.description && (
              <CardDescription className="mt-1">{milestone.description}</CardDescription>
            )}
          </div>
          <Badge className={`${config.bg} ${config.color} ml-4`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {formatCurrency(milestone.amount, currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(milestone.amountFunded, currency)} funded
          </span>
        </div>

        {milestone.status === 'AWAITING_FUNDING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Funding Progress</span>
              <span>{milestone.fundingProgress.toFixed(0)}%</span>
            </div>
            <Progress value={milestone.fundingProgress} />
          </div>
        )}

        {milestone.deliverableSubmitted && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-900 dark:text-blue-100">Deliverable submitted</span>
            {milestone.deliverableUrl && onViewDeliverable && (
              <Button size="sm" variant="link" onClick={onViewDeliverable} className="ml-auto">
                View
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {canFund && onFund && (
            <Button onClick={onFund} className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Fund Milestone
            </Button>
          )}
          {canSubmitDeliverable && onSubmitDeliverable && (
            <Button onClick={onSubmitDeliverable} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Submit Deliverable
            </Button>
          )}
          {canRelease && onRelease && (
            <Button onClick={onRelease} variant="default" className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Release Funds
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
