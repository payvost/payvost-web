import { Prisma } from '@prisma/client';
import type { EscrowStatus, EscrowPartyRole, MilestoneStatus } from './types';
import { Decimal } from '@prisma/client/runtime/library';
import DecimalJS from 'decimal.js';
import {
  CreateEscrowInput,
  FundMilestoneInput,
  ReleaseMilestoneInput,
  RaiseDisputeInput,
  ResolveDisputeInput,
  SubmitDeliverableInput,
  EscrowActivityInput,
  EscrowDetails,
  MilestoneWithProgress,
  EscrowStatusEnum,
  MilestoneStatusEnum,
  EscrowPartyRoleEnum,
} from './types';
import { prisma } from '../../common/prisma';

/**
 * Escrow State Machine
 * Manages transitions between escrow states with validation
 */
export class EscrowStateMachine {
  private static validTransitions: Record<EscrowStatus, EscrowStatus[]> = {
    DRAFT: ['AWAITING_ACCEPTANCE', 'CANCELLED'],
    AWAITING_ACCEPTANCE: ['AWAITING_FUNDING', 'CANCELLED'],
    AWAITING_FUNDING: ['FUNDED', 'CANCELLED'],
    FUNDED: ['IN_PROGRESS', 'DISPUTED', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'DISPUTED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    DISPUTED: ['IN_PROGRESS', 'REFUNDED', 'COMPLETED'],
    REFUNDED: [],
  };

  static canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
    return this.validTransitions[from]?.includes(to) || false;
  }

  static async transition(
    escrowId: string,
    toStatus: EscrowStatus,
    userId?: string,
    role?: EscrowPartyRole
  ) {
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new Error('Escrow not found');

    if (!this.canTransition(escrow.status, toStatus)) {
      throw new Error(`Invalid transition from ${escrow.status} to ${toStatus}`);
    }

    const updated = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: toStatus,
        ...(toStatus === 'FUNDED' && { fundedAt: new Date() }),
        ...(toStatus === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    // Log activity
    await logActivity({
      escrowId,
      type: `STATUS_CHANGED_TO_${toStatus}`,
      description: `Escrow status changed to ${toStatus}`,
      performedBy: userId,
      performedByRole: role,
    });

    return updated;
  }
}

/**
 * Create a new escrow agreement
 */
export async function createEscrow(
  input: CreateEscrowInput,
  creatorUserId: string
): Promise<EscrowDetails> {
  // Calculate total amount from milestones
  const totalAmount = input.milestones.reduce((sum: number, m: any) => sum + m.amount, 0);
  
  // Calculate platform fee
  const platformFeePercent = new Decimal(2.5); // 2.5%
  const platformFee = new Decimal(totalAmount).mul(platformFeePercent).div(100);

  // Create escrow with parties and milestones in a transaction
  const escrow = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create the escrow
    const newEscrow = await tx.escrow.create({
      data: {
        title: input.title,
        description: input.description,
        status: EscrowStatusEnum.DRAFT as EscrowStatus,
        currency: input.currency,
        totalAmount: new Decimal(totalAmount),
        platformFee: platformFee,
        platformFeePercent: platformFeePercent,
        autoReleaseEnabled: input.autoReleaseEnabled || false,
        autoReleaseDays: input.autoReleaseDays,
        expiresAt: input.expiresAt,
      },
    });

    // Create parties
    const parties: Array<{
      escrowId: string;
      userId?: string;
      role: EscrowPartyRole;
      email: string;
      name?: string | null;
      hasAccepted: boolean;
      acceptedAt?: Date;
    }> = [
      {
        escrowId: newEscrow.id,
        userId: creatorUserId,
        role: EscrowPartyRoleEnum.BUYER as EscrowPartyRole,
        email: input.buyerEmail,
        name: input.buyerName,
        hasAccepted: true, // Creator automatically accepts
        acceptedAt: new Date(),
      },
      {
        escrowId: newEscrow.id,
        role: EscrowPartyRoleEnum.SELLER as EscrowPartyRole,
        email: input.sellerEmail,
        name: input.sellerName,
        hasAccepted: false,
      },
    ];

    if (input.mediatorEmail) {
      parties.push({
        escrowId: newEscrow.id,
        role: EscrowPartyRoleEnum.MEDIATOR as EscrowPartyRole,
        email: input.mediatorEmail,
        name: input.mediatorName,
        hasAccepted: false,
      });
    }

    await tx.escrowParty.createMany({ data: parties });

    // Create milestones
    const milestones = input.milestones.map((m, index) => ({
      escrowId: newEscrow.id,
      order: index + 1,
      title: m.title,
      description: m.description,
      amount: new Decimal(m.amount.toString()),
      status: MilestoneStatusEnum.PENDING as MilestoneStatus,
      requiresApproval: m.requiresApproval !== false,
      deliverableDescription: m.deliverableDescription,
    }));

    await tx.milestone.createMany({ data: milestones });

    // Log activity
    await tx.escrowActivity.create({
      data: {
        escrowId: newEscrow.id,
        type: 'ESCROW_CREATED',
        description: `Escrow agreement created: ${input.title}`,
        performedBy: creatorUserId,
        performedByRole: EscrowPartyRoleEnum.BUYER as EscrowPartyRole,
      },
    });

    return newEscrow;
  });

  return getEscrowDetails(escrow.id);
}

/**
 * Accept an escrow invitation
 */
export async function acceptEscrow(
  escrowId: string,
  userId: string,
  userEmail: string
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Find party by email and update
    const party = await tx.escrowParty.findFirst({
      where: { escrowId, email: userEmail, hasAccepted: false },
    });

    if (!party) throw new Error('Party not found or already accepted');

    await tx.escrowParty.update({
      where: { id: party.id },
      data: {
        userId,
        hasAccepted: true,
        acceptedAt: new Date(),
      },
    });

    // Log activity
    await tx.escrowActivity.create({
      data: {
        escrowId,
        type: 'PARTY_ACCEPTED',
        description: `${party.role} accepted the escrow agreement`,
        performedBy: userId,
        performedByRole: party.role,
      },
    });

    // Check if all parties have accepted
    const allParties = await tx.escrowParty.findMany({ where: { escrowId } });
    const allAccepted = allParties.every((p: any) => p.hasAccepted);

    if (allAccepted) {
      // Transition to awaiting funding
      await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatusEnum.AWAITING_FUNDING as EscrowStatus,
          acceptedAt: new Date(),
        },
      });

      await tx.escrowActivity.create({
        data: {
          escrowId,
          type: 'ALL_PARTIES_ACCEPTED',
          description: 'All parties have accepted. Ready for funding.',
        },
      });
    }
  });
}

/**
 * Fund a milestone
 */
export async function fundMilestone(
  escrowId: string,
  input: FundMilestoneInput,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const milestone = await tx.milestone.findUnique({
      where: { id: input.milestoneId },
      include: { escrow: true },
    });

    if (!milestone) throw new Error('Milestone not found');
    if (milestone.escrowId !== escrowId) throw new Error('Milestone does not belong to this escrow');

    const amount = new DecimalJS(input.amount);
    const milestoneAmount = new DecimalJS(milestone.amountFunded.toString());
    const newFundedAmount = milestoneAmount.add(amount);

    if (newFundedAmount.gt(milestone.amount)) {
      throw new Error('Funding amount exceeds milestone amount');
    }

    // Update milestone
    const isFunded = newFundedAmount.eq(milestone.amount);
    await tx.milestone.update({
      where: { id: input.milestoneId },
      data: {
        amountFunded: new Decimal(newFundedAmount.toString()),
        status: isFunded ? MilestoneStatusEnum.FUNDED : MilestoneStatusEnum.AWAITING_FUNDING as MilestoneStatus,
        fundedAt: isFunded ? new Date() : undefined,
      },
    });

    // Create transaction record
    await tx.escrowTransaction.create({
      data: {
        escrowId,
        milestoneId: input.milestoneId,
        type: 'FUNDING',
        amount: new Decimal(amount.toString()),
        currency: milestone.escrow.currency,
        status: 'COMPLETED',
        accountId: input.accountId,
        processedBy: userId,
        processedAt: new Date(),
        description: `Funded milestone: ${milestone.title}`,
      },
    });

    // Log activity
    await tx.escrowActivity.create({
      data: {
        escrowId,
        milestoneId: input.milestoneId,
        type: 'MILESTONE_FUNDED',
        description: `Milestone "${milestone.title}" funded with ${amount} ${milestone.escrow.currency}`,
        performedBy: userId,
        performedByRole: EscrowPartyRoleEnum.BUYER as EscrowPartyRole,
      },
    });

    // Check if escrow should transition to FUNDED
    if (milestone.escrow.status === EscrowStatusEnum.AWAITING_FUNDING) {
      const firstMilestone = await tx.milestone.findFirst({
        where: { escrowId, order: 1 },
      });

      if (firstMilestone && firstMilestone.status === MilestoneStatusEnum.FUNDED) {
        await tx.escrow.update({
          where: { id: escrowId },
          data: {
            status: EscrowStatusEnum.FUNDED as EscrowStatus,
            fundedAt: new Date(),
          },
        });

        await tx.escrowActivity.create({
          data: {
            escrowId,
            type: 'ESCROW_FUNDED',
            description: 'Escrow has been funded and is now in progress',
          },
        });
      }
    }
  });
}

/**
 * Submit deliverable for a milestone
 */
export async function submitDeliverable(
  escrowId: string,
  input: SubmitDeliverableInput,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const milestone = await tx.milestone.findUnique({
      where: { id: input.milestoneId },
    });

    if (!milestone) throw new Error('Milestone not found');
    if (milestone.escrowId !== escrowId) throw new Error('Milestone does not belong to this escrow');

    await tx.milestone.update({
      where: { id: input.milestoneId },
      data: {
        deliverableSubmitted: true,
        deliverableUrl: input.deliverableUrl,
        deliverableSubmittedAt: new Date(),
        status: MilestoneStatusEnum.UNDER_REVIEW as MilestoneStatus,
      },
    });

    await tx.escrowActivity.create({
      data: {
        escrowId,
        milestoneId: input.milestoneId,
        type: 'DELIVERABLE_SUBMITTED',
        description: `Deliverable submitted for "${milestone.title}"`,
        performedBy: userId,
        performedByRole: EscrowPartyRoleEnum.SELLER as EscrowPartyRole,
        metadata: { deliverableUrl: input.deliverableUrl },
      },
    });
  });
}

/**
 * Approve and release a milestone
 */
export async function releaseMilestone(
  escrowId: string,
  input: ReleaseMilestoneInput,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const milestone = await tx.milestone.findUnique({
      where: { id: input.milestoneId },
      include: { escrow: true },
    });

    if (!milestone) throw new Error('Milestone not found');
    if (milestone.escrowId !== escrowId) throw new Error('Milestone does not belong to this escrow');
    if (milestone.status !== MilestoneStatusEnum.FUNDED && milestone.status !== MilestoneStatusEnum.UNDER_REVIEW) {
      throw new Error('Milestone must be funded before release');
    }

    await tx.milestone.update({
      where: { id: input.milestoneId },
      data: {
        status: MilestoneStatusEnum.RELEASED as MilestoneStatus,
        approvedBy: userId,
        approvedAt: new Date(),
        releasedAt: new Date(),
      },
    });

    // Create release transaction
    await tx.escrowTransaction.create({
      data: {
        escrowId,
        milestoneId: input.milestoneId,
        type: 'RELEASE',
        amount: milestone.amount,
        currency: milestone.escrow.currency,
        status: 'COMPLETED',
        processedBy: userId,
        processedAt: new Date(),
        description: `Released funds for milestone: ${milestone.title}`,
        metadata: { notes: input.notes },
      },
    });

    await tx.escrowActivity.create({
      data: {
        escrowId,
        milestoneId: input.milestoneId,
        type: 'MILESTONE_RELEASED',
        description: `Milestone "${milestone.title}" approved and released`,
        performedBy: userId,
        performedByRole: EscrowPartyRoleEnum.BUYER as EscrowPartyRole,
      },
    });

    // Check if all milestones are released
    const allMilestones = await tx.milestone.findMany({ where: { escrowId } });
    const allReleased = allMilestones.every((m: any) => m.status === MilestoneStatusEnum.RELEASED);

    if (allReleased) {
      await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatusEnum.COMPLETED as EscrowStatus,
          completedAt: new Date(),
        },
      });

      await tx.escrowActivity.create({
        data: {
          escrowId,
          type: 'ESCROW_COMPLETED',
          description: 'All milestones released. Escrow completed.',
        },
      });
    }
  });
}

/**
 * Raise a dispute
 */
export async function raiseDispute(
  escrowId: string,
  input: RaiseDisputeInput,
  userId: string,
  userRole: EscrowPartyRole
): Promise<string> {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update escrow status to disputed
    await tx.escrow.update({
      where: { id: escrowId },
      data: { status: EscrowStatusEnum.DISPUTED as EscrowStatus },
    });

    // Create dispute
    const dispute = await tx.dispute.create({
      data: {
        escrowId,
        raisedBy: userId,
        raisedByRole: userRole,
        reason: input.reason,
        description: input.description,
        status: 'OPEN',
        respondByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Add evidence if provided
    if (input.evidenceUrls && input.evidenceUrls.length > 0) {
      await tx.disputeEvidence.createMany({
        data: input.evidenceUrls.map((url) => ({
          disputeId: dispute.id,
          uploadedBy: userId,
          fileUrl: url,
          fileName: url.split('/').pop() || 'evidence',
        })),
      });
    }

    await tx.escrowActivity.create({
      data: {
        escrowId,
        type: 'DISPUTE_RAISED',
        description: `Dispute raised: ${input.reason}`,
        performedBy: userId,
        performedByRole: userRole,
      },
    });

    return dispute.id;
  });
}

/**
 * Resolve a dispute (mediator/admin only)
 */
export async function resolveDispute(
  escrowId: string,
  input: ResolveDisputeInput,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: input.disputeId },
      include: { escrow: true },
    });

    if (!dispute) throw new Error('Dispute not found');
    if (dispute.escrowId !== escrowId) throw new Error('Dispute does not belong to this escrow');

    // Update dispute
    await tx.dispute.update({
      where: { id: input.disputeId },
      data: {
        status: 'RESOLVED_BUYER',
        resolution: input.resolution,
        resolutionNotes: input.resolutionNotes,
        resolvedBy: userId,
        resolvedAt: new Date(),
        refundAmount: input.refundAmount ? new Decimal(input.refundAmount.toString()) : undefined,
        releaseAmount: input.releaseAmount ? new Decimal(input.releaseAmount.toString()) : undefined,
      },
    });

    // Update escrow status based on resolution
    let newStatus: EscrowStatus = EscrowStatusEnum.IN_PROGRESS as EscrowStatus;
    if (input.resolution === 'REFUND_BUYER') {
      newStatus = EscrowStatusEnum.REFUNDED as EscrowStatus;
    } else if (input.resolution === 'RELEASE_SELLER') {
      newStatus = EscrowStatusEnum.COMPLETED as EscrowStatus;
    }

    await tx.escrow.update({
      where: { id: escrowId },
      data: { status: newStatus },
    });

    await tx.escrowActivity.create({
      data: {
        escrowId,
        type: 'DISPUTE_RESOLVED',
        description: `Dispute resolved: ${input.resolution}`,
        performedBy: userId,
        performedByRole: EscrowPartyRoleEnum.MEDIATOR as EscrowPartyRole,
        metadata: { resolution: input.resolution, notes: input.resolutionNotes },
      },
    });
  });
}

/**
 * Cancel an escrow
 */
export async function cancelEscrow(
  escrowId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const escrow = await tx.escrow.findUnique({ where: { id: escrowId } });
    if (!escrow) throw new Error('Escrow not found');

    if (escrow.status === EscrowStatusEnum.COMPLETED || escrow.status === EscrowStatusEnum.CANCELLED) {
      throw new Error('Cannot cancel completed or already cancelled escrow');
    }

    await tx.escrow.update({
      where: { id: escrowId },
      data: { status: EscrowStatusEnum.CANCELLED as EscrowStatus },
    });

    await tx.escrowActivity.create({
      data: {
        escrowId,
        type: 'ESCROW_CANCELLED',
        description: `Escrow cancelled${reason ? `: ${reason}` : ''}`,
        performedBy: userId,
      },
    });
  });
}

/**
 * Get detailed escrow information
 */
export async function getEscrowDetails(escrowId: string): Promise<EscrowDetails> {
  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    include: {
      parties: true,
      milestones: {
        orderBy: { order: 'asc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      disputes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!escrow) throw new Error('Escrow not found');

  const buyer = escrow.parties.find((p: any) => p.role === EscrowPartyRoleEnum.BUYER);
  const seller = escrow.parties.find((p: any) => p.role === EscrowPartyRoleEnum.SELLER);
  const mediator = escrow.parties.find((p: any) => p.role === EscrowPartyRoleEnum.MEDIATOR);

  return {
    id: escrow.id,
    title: escrow.title,
    description: escrow.description || undefined,
    status: escrow.status,
    currency: escrow.currency,
    totalAmount: Number(escrow.totalAmount),
    platformFee: Number(escrow.platformFee),
    buyer: {
      id: buyer!.id,
      role: buyer!.role,
      email: buyer!.email,
      name: buyer!.name || undefined,
      hasAccepted: buyer!.hasAccepted,
      acceptedAt: buyer!.acceptedAt || undefined,
    },
    seller: {
      id: seller!.id,
      role: seller!.role,
      email: seller!.email,
      name: seller!.name || undefined,
      hasAccepted: seller!.hasAccepted,
      acceptedAt: seller!.acceptedAt || undefined,
    },
    mediator: mediator
      ? {
          id: mediator.id,
          role: mediator.role,
          email: mediator.email,
          name: mediator.name || undefined,
          hasAccepted: mediator.hasAccepted,
          acceptedAt: mediator.acceptedAt || undefined,
        }
      : undefined,
    milestones: escrow.milestones.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description || undefined,
      amount: Number(m.amount),
      status: m.status,
      amountFunded: Number(m.amountFunded),
      fundingProgress: Number(new DecimalJS(m.amountFunded.toString()).div(m.amount.toString()).mul(100)),
      deliverableSubmitted: m.deliverableSubmitted,
      deliverableUrl: m.deliverableUrl || undefined,
    })),
    activities: escrow.activities.map((a: any) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      performedBy: a.performedBy || undefined,
      performedByRole: a.performedByRole || undefined,
      createdAt: a.createdAt,
    })),
    disputes: escrow.disputes.map((d: any) => ({
      id: d.id,
      reason: d.reason,
      description: d.description,
      status: d.status,
      raisedBy: d.raisedBy,
      raisedByRole: d.raisedByRole,
      createdAt: d.createdAt,
      resolvedAt: d.resolvedAt || undefined,
      resolution: d.resolution || undefined,
    })),
    createdAt: escrow.createdAt,
    fundedAt: escrow.fundedAt || undefined,
    completedAt: escrow.completedAt || undefined,
  };
}

/**
 * Get user's escrows
 */
export async function getUserEscrows(userId: string, userEmail: string) {
  return await prisma.escrow.findMany({
    where: {
      parties: {
        some: {
          OR: [{ userId }, { email: userEmail }],
        },
      },
    },
    include: {
      parties: true,
      milestones: true,
      disputes: {
        where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'AWAITING_DECISION'] } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Log escrow activity
 */
async function logActivity(input: EscrowActivityInput): Promise<void> {
  await prisma.escrowActivity.create({
    data: {
      escrowId: input.escrowId,
      milestoneId: input.milestoneId,
      type: input.type,
      description: input.description,
      performedBy: input.performedBy,
      performedByRole: input.performedByRole,
      metadata: input.metadata,
    },
  });
}

export const EscrowService = {
  createEscrow,
  acceptEscrow,
  fundMilestone,
  submitDeliverable,
  releaseMilestone,
  raiseDispute,
  resolveDispute,
  cancelEscrow,
  getEscrowDetails,
  getUserEscrows,
  logActivity,
};
