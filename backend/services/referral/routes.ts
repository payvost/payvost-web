import { Router } from 'express';
import { referralService } from './index';
import { authMiddleware } from '../user/middleware/authMiddleware';

const router = Router();

// Get user's referral code
router.get('/code', authMiddleware, async (req, res) => {
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
router.get('/stats', authMiddleware, async (req, res) => {
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

export default router;

