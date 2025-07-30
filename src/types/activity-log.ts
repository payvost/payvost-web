
export type ActivityStatus = 'Success' | 'Failed' | 'Pending' | 'Alert';
export type ObjectType = 'Payout' | 'Invoice' | 'Beneficiary' | 'Security';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO 8601
  user: {
    name: string;
    avatar?: string;
  };
  action: string; // e.g., 'Payout Initiated'
  object: {
    type: ObjectType;
    id: string;
    link: string;
  };
  status: ActivityStatus;
  icon: React.ReactNode;
}
