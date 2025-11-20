"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = exports.EscrowStateMachine = void 0;
exports.createEscrow = createEscrow;
exports.acceptEscrow = acceptEscrow;
exports.fundMilestone = fundMilestone;
exports.submitDeliverable = submitDeliverable;
exports.releaseMilestone = releaseMilestone;
exports.raiseDispute = raiseDispute;
exports.resolveDispute = resolveDispute;
exports.cancelEscrow = cancelEscrow;
exports.getEscrowDetails = getEscrowDetails;
exports.getUserEscrows = getUserEscrows;
const decimal_js_1 = __importDefault(require("decimal.js"));
const types_1 = require("./types");
const prisma_1 = require("../../common/prisma");
/**
 * Escrow State Machine
 * Manages transitions between escrow states with validation
 */
class EscrowStateMachine {
    static canTransition(from, to) {
        return this.validTransitions[from]?.includes(to) || false;
    }
    static async transition(escrowId, toStatus, userId, role) {
        const escrow = await prisma_1.prisma.escrow.findUnique({ where: { id: escrowId } });
        if (!escrow)
            throw new Error('Escrow not found');
        if (!this.canTransition(escrow.status, toStatus)) {
            throw new Error(`Invalid transition from ${escrow.status} to ${toStatus}`);
        }
        const updated = await prisma_1.prisma.escrow.update({
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
exports.EscrowStateMachine = EscrowStateMachine;
EscrowStateMachine.validTransitions = {
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
/**
 * Create a new escrow agreement
 */
async function createEscrow(input, creatorUserId) {
    // Calculate total amount from milestones
    const totalAmount = input.milestones.reduce((sum, m) => sum + m.amount, 0);
    // Calculate platform fee
    const platformFeePercent = new decimal_js_1.default(2.5); // 2.5%
    const platformFee = new decimal_js_1.default(totalAmount).mul(platformFeePercent).div(100);
    // Create escrow with parties and milestones in a transaction
    const escrow = await prisma_1.prisma.$transaction(async (tx) => {
        // Create the escrow
        const newEscrow = await tx.escrow.create({
            data: {
                title: input.title,
                description: input.description,
                status: types_1.EscrowStatusEnum.DRAFT,
                currency: input.currency,
                totalAmount: new decimal_js_1.default(totalAmount),
                platformFee: platformFee,
                platformFeePercent: platformFeePercent,
                autoReleaseEnabled: input.autoReleaseEnabled || false,
                autoReleaseDays: input.autoReleaseDays,
                expiresAt: input.expiresAt,
            },
        });
        // Create parties
        const parties = [
            {
                escrowId: newEscrow.id,
                userId: creatorUserId,
                role: types_1.EscrowPartyRoleEnum.BUYER,
                email: input.buyerEmail,
                name: input.buyerName,
                hasAccepted: true, // Creator automatically accepts
                acceptedAt: new Date(),
            },
            {
                escrowId: newEscrow.id,
                role: types_1.EscrowPartyRoleEnum.SELLER,
                email: input.sellerEmail,
                name: input.sellerName,
                hasAccepted: false,
            },
        ];
        if (input.mediatorEmail) {
            parties.push({
                escrowId: newEscrow.id,
                role: types_1.EscrowPartyRoleEnum.MEDIATOR,
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
            amount: new decimal_js_1.default(m.amount),
            status: types_1.MilestoneStatusEnum.PENDING,
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
                performedByRole: types_1.EscrowPartyRoleEnum.BUYER,
            },
        });
        return newEscrow;
    });
    return getEscrowDetails(escrow.id);
}
/**
 * Accept an escrow invitation
 */
async function acceptEscrow(escrowId, userId, userEmail) {
    await prisma_1.prisma.$transaction(async (tx) => {
        // Find party by email and update
        const party = await tx.escrowParty.findFirst({
            where: { escrowId, email: userEmail, hasAccepted: false },
        });
        if (!party)
            throw new Error('Party not found or already accepted');
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
        const allAccepted = allParties.every((p) => p.hasAccepted);
        if (allAccepted) {
            // Transition to awaiting funding
            await tx.escrow.update({
                where: { id: escrowId },
                data: {
                    status: types_1.EscrowStatusEnum.AWAITING_FUNDING,
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
async function fundMilestone(escrowId, input, userId) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const milestone = await tx.milestone.findUnique({
            where: { id: input.milestoneId },
            include: { escrow: true },
        });
        if (!milestone)
            throw new Error('Milestone not found');
        if (milestone.escrowId !== escrowId)
            throw new Error('Milestone does not belong to this escrow');
        const amount = new decimal_js_1.default(input.amount);
        const newFundedAmount = new decimal_js_1.default(milestone.amountFunded).add(amount);
        if (newFundedAmount.gt(milestone.amount)) {
            throw new Error('Funding amount exceeds milestone amount');
        }
        // Update milestone
        const isFunded = newFundedAmount.eq(milestone.amount);
        await tx.milestone.update({
            where: { id: input.milestoneId },
            data: {
                amountFunded: newFundedAmount,
                status: isFunded ? types_1.MilestoneStatusEnum.FUNDED : types_1.MilestoneStatusEnum.AWAITING_FUNDING,
                fundedAt: isFunded ? new Date() : undefined,
            },
        });
        // Create transaction record
        await tx.escrowTransaction.create({
            data: {
                escrowId,
                milestoneId: input.milestoneId,
                type: 'FUNDING',
                amount: amount,
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
                performedByRole: types_1.EscrowPartyRoleEnum.BUYER,
            },
        });
        // Check if escrow should transition to FUNDED
        if (milestone.escrow.status === types_1.EscrowStatusEnum.AWAITING_FUNDING) {
            const firstMilestone = await tx.milestone.findFirst({
                where: { escrowId, order: 1 },
            });
            if (firstMilestone && firstMilestone.status === types_1.MilestoneStatusEnum.FUNDED) {
                await tx.escrow.update({
                    where: { id: escrowId },
                    data: {
                        status: types_1.EscrowStatusEnum.FUNDED,
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
async function submitDeliverable(escrowId, input, userId) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const milestone = await tx.milestone.findUnique({
            where: { id: input.milestoneId },
        });
        if (!milestone)
            throw new Error('Milestone not found');
        if (milestone.escrowId !== escrowId)
            throw new Error('Milestone does not belong to this escrow');
        await tx.milestone.update({
            where: { id: input.milestoneId },
            data: {
                deliverableSubmitted: true,
                deliverableUrl: input.deliverableUrl,
                deliverableSubmittedAt: new Date(),
                status: types_1.MilestoneStatusEnum.UNDER_REVIEW,
            },
        });
        await tx.escrowActivity.create({
            data: {
                escrowId,
                milestoneId: input.milestoneId,
                type: 'DELIVERABLE_SUBMITTED',
                description: `Deliverable submitted for "${milestone.title}"`,
                performedBy: userId,
                performedByRole: types_1.EscrowPartyRoleEnum.SELLER,
                metadata: { deliverableUrl: input.deliverableUrl },
            },
        });
    });
}
/**
 * Approve and release a milestone
 */
async function releaseMilestone(escrowId, input, userId) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const milestone = await tx.milestone.findUnique({
            where: { id: input.milestoneId },
            include: { escrow: true },
        });
        if (!milestone)
            throw new Error('Milestone not found');
        if (milestone.escrowId !== escrowId)
            throw new Error('Milestone does not belong to this escrow');
        if (milestone.status !== types_1.MilestoneStatusEnum.FUNDED && milestone.status !== types_1.MilestoneStatusEnum.UNDER_REVIEW) {
            throw new Error('Milestone must be funded before release');
        }
        await tx.milestone.update({
            where: { id: input.milestoneId },
            data: {
                status: types_1.MilestoneStatusEnum.RELEASED,
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
                performedByRole: types_1.EscrowPartyRoleEnum.BUYER,
            },
        });
        // Check if all milestones are released
        const allMilestones = await tx.milestone.findMany({ where: { escrowId } });
        const allReleased = allMilestones.every((m) => m.status === types_1.MilestoneStatusEnum.RELEASED);
        if (allReleased) {
            await tx.escrow.update({
                where: { id: escrowId },
                data: {
                    status: types_1.EscrowStatusEnum.COMPLETED,
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
async function raiseDispute(escrowId, input, userId, userRole) {
    return await prisma_1.prisma.$transaction(async (tx) => {
        // Update escrow status to disputed
        await tx.escrow.update({
            where: { id: escrowId },
            data: { status: types_1.EscrowStatusEnum.DISPUTED },
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
async function resolveDispute(escrowId, input, userId) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const dispute = await tx.dispute.findUnique({
            where: { id: input.disputeId },
            include: { escrow: true },
        });
        if (!dispute)
            throw new Error('Dispute not found');
        if (dispute.escrowId !== escrowId)
            throw new Error('Dispute does not belong to this escrow');
        // Update dispute
        await tx.dispute.update({
            where: { id: input.disputeId },
            data: {
                status: 'RESOLVED_BUYER',
                resolution: input.resolution,
                resolutionNotes: input.resolutionNotes,
                resolvedBy: userId,
                resolvedAt: new Date(),
                refundAmount: input.refundAmount ? new decimal_js_1.default(input.refundAmount) : undefined,
                releaseAmount: input.releaseAmount ? new decimal_js_1.default(input.releaseAmount) : undefined,
            },
        });
        // Update escrow status based on resolution
        let newStatus = types_1.EscrowStatusEnum.IN_PROGRESS;
        if (input.resolution === 'REFUND_BUYER') {
            newStatus = types_1.EscrowStatusEnum.REFUNDED;
        }
        else if (input.resolution === 'RELEASE_SELLER') {
            newStatus = types_1.EscrowStatusEnum.COMPLETED;
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
                performedByRole: types_1.EscrowPartyRoleEnum.MEDIATOR,
                metadata: { resolution: input.resolution, notes: input.resolutionNotes },
            },
        });
    });
}
/**
 * Cancel an escrow
 */
async function cancelEscrow(escrowId, userId, reason) {
    await prisma_1.prisma.$transaction(async (tx) => {
        const escrow = await tx.escrow.findUnique({ where: { id: escrowId } });
        if (!escrow)
            throw new Error('Escrow not found');
        if (escrow.status === types_1.EscrowStatusEnum.COMPLETED || escrow.status === types_1.EscrowStatusEnum.CANCELLED) {
            throw new Error('Cannot cancel completed or already cancelled escrow');
        }
        await tx.escrow.update({
            where: { id: escrowId },
            data: { status: types_1.EscrowStatusEnum.CANCELLED },
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
async function getEscrowDetails(escrowId) {
    const escrow = await prisma_1.prisma.escrow.findUnique({
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
    if (!escrow)
        throw new Error('Escrow not found');
    const buyer = escrow.parties.find((p) => p.role === types_1.EscrowPartyRoleEnum.BUYER);
    const seller = escrow.parties.find((p) => p.role === types_1.EscrowPartyRoleEnum.SELLER);
    const mediator = escrow.parties.find((p) => p.role === types_1.EscrowPartyRoleEnum.MEDIATOR);
    return {
        id: escrow.id,
        title: escrow.title,
        description: escrow.description || undefined,
        status: escrow.status,
        currency: escrow.currency,
        totalAmount: Number(escrow.totalAmount),
        platformFee: Number(escrow.platformFee),
        buyer: {
            id: buyer.id,
            role: buyer.role,
            email: buyer.email,
            name: buyer.name || undefined,
            hasAccepted: buyer.hasAccepted,
            acceptedAt: buyer.acceptedAt || undefined,
        },
        seller: {
            id: seller.id,
            role: seller.role,
            email: seller.email,
            name: seller.name || undefined,
            hasAccepted: seller.hasAccepted,
            acceptedAt: seller.acceptedAt || undefined,
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
        milestones: escrow.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description || undefined,
            amount: Number(m.amount),
            status: m.status,
            amountFunded: Number(m.amountFunded),
            fundingProgress: Number(new decimal_js_1.default(m.amountFunded).div(m.amount).mul(100)),
            deliverableSubmitted: m.deliverableSubmitted,
            deliverableUrl: m.deliverableUrl || undefined,
        })),
        activities: escrow.activities.map((a) => ({
            id: a.id,
            type: a.type,
            description: a.description,
            performedBy: a.performedBy || undefined,
            performedByRole: a.performedByRole || undefined,
            createdAt: a.createdAt,
        })),
        disputes: escrow.disputes.map((d) => ({
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
async function getUserEscrows(userId, userEmail) {
    return await prisma_1.prisma.escrow.findMany({
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
async function logActivity(input) {
    await prisma_1.prisma.escrowActivity.create({
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
exports.EscrowService = {
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
