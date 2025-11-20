// Define enum types locally to avoid Prisma import issues during build
export type EscrowStatus = 
  | 'DRAFT'
  | 'AWAITING_ACCEPTANCE'
  | 'AWAITING_FUNDING'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REFUNDED';

export type EscrowPartyRole = 
  | 'BUYER'
  | 'SELLER'
  | 'MEDIATOR'
  | 'ADMIN';

export type MilestoneStatus = 
  | 'PENDING'
  | 'AWAITING_FUNDING'
  | 'FUNDED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'CANCELLED';

export type DisputeStatus = 
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'EVIDENCE_SUBMITTED'
  | 'AWAITING_DECISION'
  | 'RESOLVED_BUYER'
  | 'RESOLVED_SELLER'
  | 'RESOLVED_PARTIAL'
  | 'CLOSED';

export type DisputeResolution = 
  | 'REFUND_BUYER'
  | 'RELEASE_SELLER'
  | 'PARTIAL_REFUND'
  | 'CUSTOM_SPLIT';

// Export enum values for runtime use - with fallback
export const EscrowStatusEnum = {
  DRAFT: 'DRAFT',
  AWAITING_ACCEPTANCE: 'AWAITING_ACCEPTANCE',
  AWAITING_FUNDING: 'AWAITING_FUNDING',
  FUNDED: 'FUNDED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED',
};

export const EscrowPartyRoleEnum = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  MEDIATOR: 'MEDIATOR',
  ADMIN: 'ADMIN',
};

export const MilestoneStatusEnum = {
  PENDING: 'PENDING',
  AWAITING_FUNDING: 'AWAITING_FUNDING',
  FUNDED: 'FUNDED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  RELEASED: 'RELEASED',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
};

export const DisputeStatusEnum = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  AWAITING_DECISION: 'AWAITING_DECISION',
  RESOLVED_BUYER: 'RESOLVED_BUYER',
  RESOLVED_SELLER: 'RESOLVED_SELLER',
  RESOLVED_PARTIAL: 'RESOLVED_PARTIAL',
  CLOSED: 'CLOSED',
};

export const DisputeResolutionEnum = {
  REFUND_BUYER: 'REFUND_BUYER',
  RELEASE_SELLER: 'RELEASE_SELLER',
  PARTIAL_REFUND: 'PARTIAL_REFUND',
  CUSTOM_SPLIT: 'CUSTOM_SPLIT',
};

export interface CreateEscrowInput {
  title: string;
  description?: string;
  currency: string;
  buyerEmail: string;
  buyerName?: string;
  sellerEmail: string;
  sellerName?: string;
  mediatorEmail?: string;
  mediatorName?: string;
  milestones: CreateMilestoneInput[];
  autoReleaseEnabled?: boolean;
  autoReleaseDays?: number;
  expiresAt?: Date;
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  amount: number;
  deliverableDescription?: string;
  requiresApproval?: boolean;
}

export interface FundMilestoneInput {
  milestoneId: string;
  amount: number;
  accountId: string;
}

export interface ReleaseMilestoneInput {
  milestoneId: string;
  notes?: string;
}

export interface RaiseDisputeInput {
  reason: string;
  description: string;
  evidenceUrls?: string[];
}

export interface ResolveDisputeInput {
  disputeId: string;
  resolution: DisputeResolution;
  resolutionNotes?: string;
  refundAmount?: number;
  releaseAmount?: number;
}

export interface SubmitDeliverableInput {
  milestoneId: string;
  deliverableUrl: string;
  description?: string;
}

export interface EscrowActivityInput {
  escrowId: string;
  milestoneId?: string;
  type: string;
  description: string;
  performedBy?: string;
  performedByRole?: EscrowPartyRole;
  metadata?: any;
}

export interface EscrowStatistics {
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
  disputedEscrows: number;
  totalVolume: number;
  platformFees: number;
}

export interface MilestoneWithProgress {
  id: string;
  title: string;
  description?: string;
  amount: number;
  status: MilestoneStatus;
  amountFunded: number;
  fundingProgress: number;
  deliverableSubmitted: boolean;
  deliverableUrl?: string;
}

export interface EscrowDetails {
  id: string;
  title: string;
  description?: string;
  status: EscrowStatus;
  currency: string;
  totalAmount: number;
  platformFee: number;
  buyer: EscrowPartyInfo;
  seller: EscrowPartyInfo;
  mediator?: EscrowPartyInfo;
  milestones: MilestoneWithProgress[];
  activities: ActivityInfo[];
  disputes: DisputeInfo[];
  createdAt: Date;
  fundedAt?: Date;
  completedAt?: Date;
}

export interface EscrowPartyInfo {
  id: string;
  role: EscrowPartyRole;
  email: string;
  name?: string;
  hasAccepted: boolean;
  acceptedAt?: Date;
}

export interface ActivityInfo {
  id: string;
  type: string;
  description: string;
  performedBy?: string;
  performedByRole?: EscrowPartyRole;
  createdAt: Date;
}

export interface DisputeInfo {
  id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  raisedBy: string;
  raisedByRole: EscrowPartyRole;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: DisputeResolution;
}
