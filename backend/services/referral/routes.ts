import { Router, Request, Response } from 'express';
import { referralService } from './index';
import { authenticateJWT } from '../user/middleware/authMiddleware';
import { verifyFirebaseToken, requireAdmin, AuthenticatedRequest } from '../../gateway/middleware';
import { ValidationError } from '../../gateway/index';
import { Prisma } from '@prisma/client';

const router = Router();

// Get user's referral code
router.get('/code', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const code = await referralService.generateReferralCode(userId);
    res.json({ code });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// Get referral statistics
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const stats = await referralService.getUserReferralStats(userId);
    
    // Convert Decimal to string for JSON serialization
    const serializedStats = {
      ...stats,
      totalEarned: stats.totalEarned.toString(),
    };
    
    res.json(serializedStats);
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// Process referral during registration (called from registration endpoint)
router.post('/process', async (req, res) => {
  try {
    const { referredUserId, referralCode } = req.body;
    
    if (!referredUserId || !referralCode) {
      return res.status(400).json({ error: 'referredUserId and referralCode are required' });
    }
    
    const result = await referralService.processReferral(
      referredUserId,
      referralCode
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({ error: 'Failed to process referral' });
  }
});

// Validate referral code (public endpoint)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await referralService.validateReferralCode(code);
    res.json(result);
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ error: 'Failed to validate referral code' });
  }
});

// ==================== Admin Routes for Campaign Management ====================

/**
 * GET /api/v1/referral/admin/campaigns
 * List all referral campaigns (admin only)
 */
router.get('/admin/campaigns', verifyFirebaseToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isActive, startDate, endDate } = req.query;

    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    const campaigns = await referralService.listCampaigns(filters);

    // Serialize Decimal fields to strings for JSON
    const serializedCampaigns = campaigns.map((campaign: any) => ({
      ...campaign,
      signupBonus: campaign.signupBonus?.toString() || null,
      firstTxBonus: campaign.firstTxBonus?.toString() || null,
      firstTxMinAmount: campaign.firstTxMinAmount?.toString() || null,
      tier2Percentage: campaign.tier2Percentage?.toString() || null,
      tier3Percentage: campaign.tier3Percentage?.toString() || null,
      maxRewardPerUser: campaign.maxRewardPerUser?.toString() || null,
      maxRewardPerCampaign: campaign.maxRewardPerCampaign?.toString() || null,
    }));

    res.json({ campaigns: serializedCampaigns });
  } catch (error: any) {
    console.error('Error listing campaigns:', error);
    res.status(500).json({ error: error.message || 'Failed to list campaigns' });
  }
});

/**
 * GET /api/v1/referral/admin/campaigns/:id
 * Get a specific campaign by ID (admin only)
 */
router.get('/admin/campaigns/:id', verifyFirebaseToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await referralService.getCampaign(id);

    // Serialize Decimal fields
    const serializedCampaign = {
      ...campaign,
      signupBonus: campaign.signupBonus?.toString() || null,
      firstTxBonus: campaign.firstTxBonus?.toString() || null,
      firstTxMinAmount: campaign.firstTxMinAmount?.toString() || null,
      tier2Percentage: campaign.tier2Percentage?.toString() || null,
      tier3Percentage: campaign.tier3Percentage?.toString() || null,
      maxRewardPerUser: campaign.maxRewardPerUser?.toString() || null,
      maxRewardPerCampaign: campaign.maxRewardPerCampaign?.toString() || null,
    };

    res.json({ campaign: serializedCampaign });
  } catch (error: any) {
    console.error('Error getting campaign:', error);
    const status = error.message === 'Campaign not found' ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to get campaign' });
  }
});

/**
 * POST /api/v1/referral/admin/campaigns
 * Create a new referral campaign (admin only)
 */
router.post('/admin/campaigns', verifyFirebaseToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;

    console.log('[Referral Campaigns] Creating campaign with data:', JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.name) {
      throw new ValidationError('Campaign name is required');
    }
    if (!data.startDate) {
      throw new ValidationError('Start date is required');
    }

    const campaign = await referralService.createCampaign(data);

    // Serialize Decimal fields
    const serializedCampaign = {
      ...campaign,
      signupBonus: campaign.signupBonus?.toString() || null,
      firstTxBonus: campaign.firstTxBonus?.toString() || null,
      firstTxMinAmount: campaign.firstTxMinAmount?.toString() || null,
      tier2Percentage: campaign.tier2Percentage?.toString() || null,
      tier3Percentage: campaign.tier3Percentage?.toString() || null,
      maxRewardPerUser: campaign.maxRewardPerUser?.toString() || null,
      maxRewardPerCampaign: campaign.maxRewardPerCampaign?.toString() || null,
    };

    res.status(201).json({ campaign: serializedCampaign });
  } catch (error: any) {
    console.error('[Referral Campaigns] Error creating campaign:', error);
    console.error('[Referral Campaigns] Error stack:', error.stack);
    console.error('[Referral Campaigns] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    const status = error instanceof ValidationError ? 400 : 500;
    res.status(status).json({ 
      error: error.message || 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        details: {
          name: error.name,
          code: error.code,
          meta: error.meta,
        }
      })
    });
  }
});

/**
 * PUT /api/v1/referral/admin/campaigns/:id
 * Update an existing referral campaign (admin only)
 */
router.put('/admin/campaigns/:id', verifyFirebaseToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const campaign = await referralService.updateCampaign(id, data);

    // Serialize Decimal fields
    const serializedCampaign = {
      ...campaign,
      signupBonus: campaign.signupBonus?.toString() || null,
      firstTxBonus: campaign.firstTxBonus?.toString() || null,
      firstTxMinAmount: campaign.firstTxMinAmount?.toString() || null,
      tier2Percentage: campaign.tier2Percentage?.toString() || null,
      tier3Percentage: campaign.tier3Percentage?.toString() || null,
      maxRewardPerUser: campaign.maxRewardPerUser?.toString() || null,
      maxRewardPerCampaign: campaign.maxRewardPerCampaign?.toString() || null,
    };

    res.json({ campaign: serializedCampaign });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    const status = error.message === 'Campaign not found' ? 404 : (error instanceof ValidationError ? 400 : 500);
    res.status(status).json({ error: error.message || 'Failed to update campaign' });
  }
});

/**
 * DELETE /api/v1/referral/admin/campaigns/:id
 * Delete a referral campaign (admin only)
 * By default, performs soft delete (sets isActive to false)
 * Use ?hard=true for hard delete
 */
router.delete('/admin/campaigns/:id', verifyFirebaseToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === 'true';

    await referralService.deleteCampaign(id, hardDelete);

    res.json({ 
      success: true, 
      message: hardDelete ? 'Campaign deleted permanently' : 'Campaign deactivated' 
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    const status = error.message === 'Campaign not found' ? 404 : 400;
    res.status(status).json({ error: error.message || 'Failed to delete campaign' });
  }
});

/**
 * GET /api/v1/referral/admin/campaigns/:id/stats
 * Get statistics for a specific campaign (admin only)
 */
router.get('/admin/campaigns/:id/stats', verifyFirebaseToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await referralService.getCampaignStats(id);

    // Serialize Decimal fields
    const serializedStats = {
      ...stats,
      totalRewardsValue: stats.totalRewardsValue.toString(),
      campaign: {
        ...stats.campaign,
        signupBonus: stats.campaign.signupBonus?.toString() || null,
        firstTxBonus: stats.campaign.firstTxBonus?.toString() || null,
        firstTxMinAmount: stats.campaign.firstTxMinAmount?.toString() || null,
        tier2Percentage: stats.campaign.tier2Percentage?.toString() || null,
        tier3Percentage: stats.campaign.tier3Percentage?.toString() || null,
        maxRewardPerUser: stats.campaign.maxRewardPerUser?.toString() || null,
        maxRewardPerCampaign: stats.campaign.maxRewardPerCampaign?.toString() || null,
      },
    };

    res.json({ stats: serializedStats });
  } catch (error: any) {
    console.error('Error getting campaign stats:', error);
    const status = error.message === 'Campaign not found' ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to get campaign statistics' });
  }
});

export default router;

