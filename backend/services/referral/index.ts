import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ReferralService {
  /**
   * Generate unique referral code for user
   */
  async generateReferralCode(userId: string): Promise<string> {
    // Check if user already has a code
    const existing = await prisma.referralCode.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing.code;
    }

    // Generate unique code (8 characters, alphanumeric)
    let code: string | undefined;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const exists = await prisma.referralCode.findUnique({
        where: { code },
      });
      if (!exists) {
        isUnique = true;
      }
      attempts++;
    }

    if (!code) {
      throw new Error('Failed to generate unique referral code');
    }

    await prisma.referralCode.create({
      data: {
        userId,
        code,
      },
    });

    return code;
  }

  /**
   * Process referral during user registration
   */
  async processReferral(
    referredUserId: string,
    referralCode: string
  ): Promise<{ success: boolean; referrerId?: string; error?: string }> {
    try {
      // Find referral code
      const codeRecord = await prisma.referralCode.findUnique({
        where: { code: referralCode },
        include: { user: true },
      });

      if (!codeRecord || !codeRecord.isActive) {
        return { success: false, error: 'Invalid referral code' };
      }

      const referrerId = codeRecord.userId;

      // Prevent self-referral
      if (referrerId === referredUserId) {
        return { success: false, error: 'Cannot refer yourself' };
      }

      // Check if already referred
      const existing = await prisma.referral.findUnique({
        where: { referredId: referredUserId },
      });

      if (existing) {
        return { success: false, error: 'User already has a referrer' };
      }

      // Get active campaign
      const campaign = await this.getActiveCampaign();

      // Create referral record
      const referral = await prisma.referral.create({
        data: {
          referrerId,
          referredId: referredUserId,
          referralCodeId: codeRecord.id,
          tier: 'TIER_1',
        },
      });

      // Update code usage count
      await prisma.referralCode.update({
        where: { id: codeRecord.id },
        data: { usageCount: { increment: 1 } },
      });

      // Process signup bonus if campaign has one
      if (campaign && campaign.signupBonus) {
        await this.createReward({
          referralId: referral.id,
          userId: referrerId,
          rewardType: 'SIGNUP_BONUS',
          amount: new Decimal(campaign.signupBonus.toString()),
          currency: campaign.signupCurrency || 'USD',
          tier: 'TIER_1',
          description: `Signup bonus for referring ${referredUserId}`,
        });
      }

      // Process multi-tier referrals
      await this.processMultiTierReferral(referral.id, referrerId, 'TIER_2');

      return { success: true, referrerId };
    } catch (error) {
      console.error('Error processing referral:', error);
      return { success: false, error: 'Failed to process referral' };
    }
  }

  /**
   * Process multi-tier referral rewards
   */
  private async processMultiTierReferral(
    referralId: string,
    referrerId: string,
    tier: 'TIER_2' | 'TIER_3'
  ): Promise<void> {
    // Find parent referral (who referred the referrer)
    const parentReferral = await prisma.referral.findFirst({
      where: { referredId: referrerId, isActive: true },
    });

    if (!parentReferral || tier === 'TIER_3') {
      return; // No parent or already at tier 3
    }

    const campaign = await this.getActiveCampaign();
    if (!campaign) return;

    const percentage =
      tier === 'TIER_2' ? campaign.tier2Percentage : campaign.tier3Percentage;
    if (!percentage) return;

    // Calculate reward based on direct referral's signup bonus
    const directReward = campaign.signupBonus
      ? new Decimal(campaign.signupBonus.toString())
      : new Decimal(0);
    const tierReward = directReward.times(percentage).dividedBy(100);

    if (tierReward.greaterThan(0)) {
      await this.createReward({
        referralId: parentReferral.id,
        userId: parentReferral.referrerId,
        rewardType: 'SIGNUP_BONUS',
        amount: tierReward,
        currency: campaign.signupCurrency || 'USD',
        tier,
        description: `${tier} bonus for indirect referral`,
      });

      // Recursively process tier 3
      if (tier === 'TIER_2') {
        await this.processMultiTierReferral(
          parentReferral.id,
          parentReferral.referrerId,
          'TIER_3'
        );
      }
    }
  }

  /**
   * Process first transaction reward
   */
  async processFirstTransaction(
    userId: string,
    transactionAmount: Decimal,
    currency: string
  ): Promise<void> {
    const referral = await prisma.referral.findUnique({
      where: { referredId: userId },
      include: { referralCode: { include: { user: true } } },
    });

    if (!referral || referral.firstTransactionAt) {
      return; // No referral or already processed
    }

    const campaign = await this.getActiveCampaign();
    if (!campaign || !campaign.firstTxBonus) return;

    // Check minimum transaction amount
    if (
      campaign.firstTxMinAmount &&
      transactionAmount.lessThan(new Decimal(campaign.firstTxMinAmount.toString()))
    ) {
      return;
    }

    // Update referral record
    await prisma.referral.update({
      where: { id: referral.id },
      data: { firstTransactionAt: new Date() },
    });

    // Create reward for referrer
    await this.createReward({
      referralId: referral.id,
      userId: referral.referrerId,
      rewardType: 'FIRST_TRANSACTION',
      amount: new Decimal(campaign.firstTxBonus.toString()),
      currency: campaign.firstTxCurrency || currency,
      tier: 'TIER_1',
      description: `First transaction bonus for referral`,
    });
  }

  /**
   * Create referral reward
   */
  private async createReward(params: {
    referralId: string;
    userId: string;
    rewardType: string;
    amount: Decimal;
    currency: string;
    tier: string;
    description?: string;
  }): Promise<string> {
    const reward = await prisma.referralReward.create({
      data: {
        referralId: params.referralId,
        userId: params.userId,
        rewardType: params.rewardType as any,
        amount: params.amount,
        currency: params.currency,
        tier: params.tier as any,
        description: params.description,
        status: 'PENDING',
      },
    });

    return reward.id;
  }

  /**
   * Approve and pay referral reward
   */
  async approveAndPayReward(
    rewardId: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const reward = await prisma.referralReward.findUnique({
        where: { id: rewardId },
        include: { referral: true },
      });

      if (!reward || reward.status !== 'PENDING') {
        return { success: false, error: 'Invalid reward' };
      }

      // Find or create account for user
      let account = await prisma.account.findFirst({
        where: {
          userId: reward.userId,
          currency: reward.currency,
        },
      });

      if (!account) {
        // Create account if doesn't exist
        account = await prisma.account.create({
          data: {
            userId: reward.userId,
            currency: reward.currency,
            balance: 0,
          },
        });
      }

      // Credit reward to account
      await prisma.$transaction(async (tx) => {
        // Update reward status
        await tx.referralReward.update({
          where: { id: rewardId },
          data: {
            status: 'APPROVED',
            approvedBy,
            approvedAt: new Date(),
            accountId: account!.id,
          },
        });

        // Credit account
        const currentBalance = new Decimal(account!.balance.toString());
        const rewardAmount = new Decimal(reward.amount.toString());
        const newBalance = currentBalance.plus(rewardAmount);

        await tx.account.update({
          where: { id: account!.id },
          data: {
            balance: newBalance,
          },
        });

        // Create ledger entry
        await tx.ledgerEntry.create({
          data: {
            accountId: account!.id,
            amount: rewardAmount,
            balanceAfter: newBalance,
            type: 'CREDIT',
            description: reward.description || 'Referral reward',
            referenceId: rewardId,
          },
        });

        // Mark as paid
        await tx.referralReward.update({
          where: { id: rewardId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Error approving reward:', error);
      return { success: false, error: 'Failed to approve reward' };
    }
  }

  /**
   * Get user's referral statistics
   */
  async getUserReferralStats(userId: string) {
    const [referralCode, referrals, rewards, totalEarned] = await Promise.all([
      prisma.referralCode.findUnique({ where: { userId } }),
      prisma.referral.findMany({
        where: { referrerId: userId, isActive: true },
        include: {
          referred: {
            select: {
              id: true,
              email: true,
              name: true,
              kycStatus: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.referralReward.findMany({
        where: { userId },
        select: {
          amount: true,
          currency: true,
          status: true,
          rewardType: true,
        },
      }),
      prisma.referralReward.aggregate({
        where: {
          userId,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      referralCode: referralCode?.code || null,
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter((r) => r.isActive).length,
      totalRewards: rewards.length,
      totalEarned: totalEarned._sum.amount || new Decimal(0),
      referrals: referrals.map((r) => ({
        id: r.id,
        referredUser: r.referred,
        joinedAt: r.createdAt,
        kycStatus: r.referred.kycStatus,
        firstTransactionAt: r.firstTransactionAt,
      })),
    };
  }

  /**
   * Get active referral campaign
   */
  private async getActiveCampaign() {
    const now = new Date();
    return await prisma.referralCampaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Validate referral code
   */
  async validateReferralCode(code: string): Promise<{ valid: boolean; error?: string }> {
    const codeRecord = await prisma.referralCode.findUnique({
      where: { code },
      include: { user: true },
    });

    if (!codeRecord) {
      return { valid: false, error: 'Referral code not found' };
    }

    if (!codeRecord.isActive) {
      return { valid: false, error: 'Referral code is inactive' };
    }

    if (codeRecord.expiresAt && codeRecord.expiresAt < new Date()) {
      return { valid: false, error: 'Referral code has expired' };
    }

    return { valid: true };
  }
}

export const referralService = new ReferralService();

