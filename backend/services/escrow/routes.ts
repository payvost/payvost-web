import { Router, Request, Response } from 'express';
import { verifyFirebaseToken, requireKYC, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import { EscrowService } from './service';
import { EscrowPartyRole } from '@prisma/client';

const router = Router();

/**
 * POST /api/escrow
 * Create a new escrow agreement
 */
router.post('/', verifyFirebaseToken, requireKYC, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) throw new ValidationError('User ID is required');

    const {
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
      expiresAt,
    } = req.body;

    if (!title || !currency || !buyerEmail || !sellerEmail || !milestones || milestones.length === 0) {
      throw new ValidationError('Missing required fields');
    }

    const escrow = await EscrowService.createEscrow(
      {
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
      },
      userId
    );

    res.status(201).json({ escrow });
  } catch (error: any) {
    console.error('Error creating escrow:', error);
    res.status(error instanceof ValidationError ? 400 : 500).json({
      error: error.message || 'Failed to create escrow',
    });
  }
});

/**
 * GET /api/escrow
 * Get all escrows for the authenticated user
 */
router.get('/', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    if (!userId || !userEmail) throw new ValidationError('User authentication required');

    const escrows = await EscrowService.getUserEscrows(userId, userEmail);
    res.status(200).json({ escrows });
  } catch (error: any) {
    console.error('Error fetching escrows:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch escrows' });
  }
});

/**
 * GET /api/escrow/:id
 * Get detailed information about a specific escrow
 */
router.get('/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const escrow = await EscrowService.getEscrowDetails(id);
    res.status(200).json({ escrow });
  } catch (error: any) {
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
router.post('/:id/accept', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;
    if (!userId || !userEmail) throw new ValidationError('User authentication required');

    const { id } = req.params;
    await EscrowService.acceptEscrow(id, userId, userEmail);

    res.status(200).json({ message: 'Escrow accepted successfully' });
  } catch (error: any) {
    console.error('Error accepting escrow:', error);
    res.status(500).json({ error: error.message || 'Failed to accept escrow' });
  }
});

/**
 * POST /api/escrow/:id/milestones/:milestoneId/fund
 * Fund a milestone
 */
router.post(
  '/:id/milestones/:milestoneId/fund',
  verifyFirebaseToken,
  requireKYC,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) throw new ValidationError('User ID is required');

      const { id, milestoneId } = req.params;
      const { amount, accountId } = req.body;

      if (!amount || !accountId) {
        throw new ValidationError('Amount and accountId are required');
      }

      await EscrowService.fundMilestone(
        id,
        {
          milestoneId,
          amount,
          accountId,
        },
        userId
      );

      res.status(200).json({ message: 'Milestone funded successfully' });
    } catch (error: any) {
      console.error('Error funding milestone:', error);
      res.status(error instanceof ValidationError ? 400 : 500).json({
        error: error.message || 'Failed to fund milestone',
      });
    }
  }
);

/**
 * POST /api/escrow/:id/milestones/:milestoneId/deliverable
 * Submit deliverable for a milestone
 */
router.post(
  '/:id/milestones/:milestoneId/deliverable',
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) throw new ValidationError('User ID is required');

      const { id, milestoneId } = req.params;
      const { deliverableUrl, description } = req.body;

      if (!deliverableUrl) {
        throw new ValidationError('Deliverable URL is required');
      }

      await EscrowService.submitDeliverable(
        id,
        {
          milestoneId,
          deliverableUrl,
          description,
        },
        userId
      );

      res.status(200).json({ message: 'Deliverable submitted successfully' });
    } catch (error: any) {
      console.error('Error submitting deliverable:', error);
      res.status(error instanceof ValidationError ? 400 : 500).json({
        error: error.message || 'Failed to submit deliverable',
      });
    }
  }
);

/**
 * POST /api/escrow/:id/milestones/:milestoneId/release
 * Approve and release a milestone
 */
router.post(
  '/:id/milestones/:milestoneId/release',
  verifyFirebaseToken,
  requireKYC,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) throw new ValidationError('User ID is required');

      const { id, milestoneId } = req.params;
      const { notes } = req.body;

      await EscrowService.releaseMilestone(
        id,
        {
          milestoneId,
          notes,
        },
        userId
      );

      res.status(200).json({ message: 'Milestone released successfully' });
    } catch (error: any) {
      console.error('Error releasing milestone:', error);
      res.status(500).json({ error: error.message || 'Failed to release milestone' });
    }
  }
);

/**
 * POST /api/escrow/:id/dispute
 * Raise a dispute
 */
router.post('/:id/dispute', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) throw new ValidationError('User ID is required');

    const { id } = req.params;
    const { reason, description, evidenceUrls, role } = req.body;

    if (!reason || !description || !role) {
      throw new ValidationError('Reason, description, and role are required');
    }

    const disputeId = await EscrowService.raiseDispute(
      id,
      {
        reason,
        description,
        evidenceUrls,
      },
      userId,
      role as EscrowPartyRole
    );

    res.status(201).json({ disputeId, message: 'Dispute raised successfully' });
  } catch (error: any) {
    console.error('Error raising dispute:', error);
    res.status(error instanceof ValidationError ? 400 : 500).json({
      error: error.message || 'Failed to raise dispute',
    });
  }
});

/**
 * POST /api/escrow/:id/dispute/:disputeId/resolve
 * Resolve a dispute (mediator/admin only)
 */
router.post(
  '/:id/dispute/:disputeId/resolve',
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) throw new ValidationError('User ID is required');

      const { id, disputeId } = req.params;
      const { resolution, resolutionNotes, refundAmount, releaseAmount } = req.body;

      if (!resolution) {
        throw new ValidationError('Resolution is required');
      }

      await EscrowService.resolveDispute(
        id,
        {
          disputeId,
          resolution,
          resolutionNotes,
          refundAmount,
          releaseAmount,
        },
        userId
      );

      res.status(200).json({ message: 'Dispute resolved successfully' });
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      res.status(error instanceof ValidationError ? 400 : 500).json({
        error: error.message || 'Failed to resolve dispute',
      });
    }
  }
);

/**
 * POST /api/escrow/:id/cancel
 * Cancel an escrow
 */
router.post('/:id/cancel', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) throw new ValidationError('User ID is required');

    const { id } = req.params;
    const { reason } = req.body;

    await EscrowService.cancelEscrow(id, userId, reason);

    res.status(200).json({ message: 'Escrow cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling escrow:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel escrow' });
  }
});

export default router;
