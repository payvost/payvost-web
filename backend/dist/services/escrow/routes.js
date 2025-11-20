"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../../gateway/middleware");
const index_1 = require("../../gateway/index");
const service_1 = require("./service");
// Define EscrowPartyRole enum locally if not available in Prisma schema
var EscrowPartyRole;
(function (EscrowPartyRole) {
    EscrowPartyRole["BUYER"] = "BUYER";
    EscrowPartyRole["SELLER"] = "SELLER";
    EscrowPartyRole["MEDIATOR"] = "MEDIATOR";
})(EscrowPartyRole || (EscrowPartyRole = {}));
const router = (0, express_1.Router)();
/**
 * POST /api/escrow
 * Create a new escrow agreement
 */
router.post('/', middleware_1.verifyFirebaseToken, middleware_1.requireKYC, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { title, description, currency, buyerEmail, buyerName, sellerEmail, sellerName, mediatorEmail, mediatorName, milestones, autoReleaseEnabled, autoReleaseDays, expiresAt, } = req.body;
        if (!title || !currency || !buyerEmail || !sellerEmail || !milestones || milestones.length === 0) {
            throw new index_1.ValidationError('Missing required fields');
        }
        const escrow = await service_1.EscrowService.createEscrow({
            title,
            description,
            currency,
            buyerEmail,
            buyerName,
            sellerEmail,
            sellerName,
            mediatorEmail,
            mediatorName,
            milestones,
            autoReleaseEnabled,
            autoReleaseDays,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        }, userId);
        res.status(201).json({ escrow });
    }
    catch (error) {
        console.error('Error creating escrow:', error);
        res.status(error instanceof index_1.ValidationError ? 400 : 500).json({
            error: error.message || 'Failed to create escrow',
        });
    }
});
/**
 * GET /api/escrow
 * Get all escrows for the authenticated user
 */
router.get('/', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const userEmail = req.user?.email;
        if (!userId || !userEmail)
            throw new index_1.ValidationError('User authentication required');
        const escrows = await service_1.EscrowService.getUserEscrows(userId, userEmail);
        res.status(200).json({ escrows });
    }
    catch (error) {
        console.error('Error fetching escrows:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch escrows' });
    }
});
/**
 * GET /api/escrow/:id
 * Get detailed information about a specific escrow
 */
router.get('/:id', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const escrow = await service_1.EscrowService.getEscrowDetails(id);
        res.status(200).json({ escrow });
    }
    catch (error) {
        console.error('Error fetching escrow details:', error);
        res.status(error.message === 'Escrow not found' ? 404 : 500).json({
            error: error.message || 'Failed to fetch escrow details',
        });
    }
});
/**
 * POST /api/escrow/:id/accept
 * Accept an escrow invitation
 */
router.post('/:id/accept', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        const userEmail = req.user?.email;
        if (!userId || !userEmail)
            throw new index_1.ValidationError('User authentication required');
        const { id } = req.params;
        await service_1.EscrowService.acceptEscrow(id, userId, userEmail);
        res.status(200).json({ message: 'Escrow accepted successfully' });
    }
    catch (error) {
        console.error('Error accepting escrow:', error);
        res.status(500).json({ error: error.message || 'Failed to accept escrow' });
    }
});
/**
 * POST /api/escrow/:id/milestones/:milestoneId/fund
 * Fund a milestone
 */
router.post('/:id/milestones/:milestoneId/fund', middleware_1.verifyFirebaseToken, middleware_1.requireKYC, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { id, milestoneId } = req.params;
        const { amount, accountId } = req.body;
        if (!amount || !accountId) {
            throw new index_1.ValidationError('Amount and accountId are required');
        }
        await service_1.EscrowService.fundMilestone(id, {
            milestoneId,
            amount,
            accountId,
        }, userId);
        res.status(200).json({ message: 'Milestone funded successfully' });
    }
    catch (error) {
        console.error('Error funding milestone:', error);
        res.status(error instanceof index_1.ValidationError ? 400 : 500).json({
            error: error.message || 'Failed to fund milestone',
        });
    }
});
/**
 * POST /api/escrow/:id/milestones/:milestoneId/deliverable
 * Submit deliverable for a milestone
 */
router.post('/:id/milestones/:milestoneId/deliverable', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { id, milestoneId } = req.params;
        const { deliverableUrl, description } = req.body;
        if (!deliverableUrl) {
            throw new index_1.ValidationError('Deliverable URL is required');
        }
        await service_1.EscrowService.submitDeliverable(id, {
            milestoneId,
            deliverableUrl,
            description,
        }, userId);
        res.status(200).json({ message: 'Deliverable submitted successfully' });
    }
    catch (error) {
        console.error('Error submitting deliverable:', error);
        res.status(error instanceof index_1.ValidationError ? 400 : 500).json({
            error: error.message || 'Failed to submit deliverable',
        });
    }
});
/**
 * POST /api/escrow/:id/milestones/:milestoneId/release
 * Approve and release a milestone
 */
router.post('/:id/milestones/:milestoneId/release', middleware_1.verifyFirebaseToken, middleware_1.requireKYC, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { id, milestoneId } = req.params;
        const { notes } = req.body;
        await service_1.EscrowService.releaseMilestone(id, {
            milestoneId,
            notes,
        }, userId);
        res.status(200).json({ message: 'Milestone released successfully' });
    }
    catch (error) {
        console.error('Error releasing milestone:', error);
        res.status(500).json({ error: error.message || 'Failed to release milestone' });
    }
});
/**
 * POST /api/escrow/:id/dispute
 * Raise a dispute
 */
router.post('/:id/dispute', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { id } = req.params;
        const { reason, description, evidenceUrls, role } = req.body;
        if (!reason || !description || !role) {
            throw new index_1.ValidationError('Reason, description, and role are required');
        }
        const disputeId = await service_1.EscrowService.raiseDispute(id, {
            reason,
            description,
            evidenceUrls,
        }, userId, role);
        res.status(201).json({ disputeId, message: 'Dispute raised successfully' });
    }
    catch (error) {
        console.error('Error raising dispute:', error);
        res.status(error instanceof index_1.ValidationError ? 400 : 500).json({
            error: error.message || 'Failed to raise dispute',
        });
    }
});
/**
 * POST /api/escrow/:id/dispute/:disputeId/resolve
 * Resolve a dispute (mediator/admin only)
 */
router.post('/:id/dispute/:disputeId/resolve', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { id, disputeId } = req.params;
        const { resolution, resolutionNotes, refundAmount, releaseAmount } = req.body;
        if (!resolution) {
            throw new index_1.ValidationError('Resolution is required');
        }
        await service_1.EscrowService.resolveDispute(id, {
            disputeId,
            resolution,
            resolutionNotes,
            refundAmount,
            releaseAmount,
        }, userId);
        res.status(200).json({ message: 'Dispute resolved successfully' });
    }
    catch (error) {
        console.error('Error resolving dispute:', error);
        res.status(error instanceof index_1.ValidationError ? 400 : 500).json({
            error: error.message || 'Failed to resolve dispute',
        });
    }
});
/**
 * POST /api/escrow/:id/cancel
 * Cancel an escrow
 */
router.post('/:id/cancel', middleware_1.verifyFirebaseToken, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId)
            throw new index_1.ValidationError('User ID is required');
        const { id } = req.params;
        const { reason } = req.body;
        await service_1.EscrowService.cancelEscrow(id, userId, reason);
        res.status(200).json({ message: 'Escrow cancelled successfully' });
    }
    catch (error) {
        console.error('Error cancelling escrow:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel escrow' });
    }
});
exports.default = router;
