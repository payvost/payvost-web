import { Prisma } from '@prisma/client';

// Use Prisma enums
export type EscrowStatus = Prisma.EscrowStatus;
export type EscrowPartyRole = Prisma.EscrowPartyRole;
export type MilestoneStatus = Prisma.MilestoneStatus;
export type DisputeStatus = Prisma.DisputeStatus;
export type DisputeResolution = Prisma.DisputeResolution;

// Export enum values for runtime use
export const EscrowStatusEnum = Prisma.EscrowStatus;
export const EscrowPartyRoleEnum = Prisma.EscrowPartyRole;
export const MilestoneStatusEnum = Prisma.MilestoneStatus;
export const DisputeStatusEnum = Prisma.DisputeStatus;
export const DisputeResolutionEnum = Prisma.DisputeResolution;

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
