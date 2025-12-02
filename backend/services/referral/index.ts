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

  // ==================== Campaign Management Methods ====================

  /**
   * Create a new referral campaign
   */
  async createCampaign(data: {
    name: string;
    description?: string;
    isActive?: boolean;
    signupBonus?: number | string;
    signupCurrency?: string;
    firstTxBonus?: number | string;
    firstTxCurrency?: string;
    firstTxMinAmount?: number | string;
    tier2Percentage?: number | string;
    tier3Percentage?: number | string;
    minKycLevel?: string;
    eligibleCountries?: string[];
    excludedCountries?: string[];
    maxReferralsPerUser?: number;
    maxRewardPerUser?: number | string;
    maxRewardPerCampaign?: number | string;
    startDate: string | Date;
    endDate?: string | Date | null;
  }) {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Campaign name is required');
    }

    if (!data.startDate) {
      throw new Error('Start date is required');
    }

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw new Error('Invalid end date');
    }

    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate percentages
    if (data.tier2Percentage !== undefined) {
      const tier2 = new Decimal(data.tier2Percentage.toString());
      if (tier2.lessThan(0) || tier2.greaterThan(100)) {
        throw new Error('Tier 2 percentage must be between 0 and 100');
      }
    }

    if (data.tier3Percentage !== undefined) {
      const tier3 = new Decimal(data.tier3Percentage.toString());
      if (tier3.lessThan(0) || tier3.greaterThan(100)) {
        throw new Error('Tier 3 percentage must be between 0 and 100');
      }
    }

    // Validate amounts
    if (data.signupBonus !== undefined && new Decimal(data.signupBonus.toString()).lessThanOrEqualTo(0)) {
      throw new Error('Signup bonus must be greater than 0');
    }

    if (data.firstTxBonus !== undefined && new Decimal(data.firstTxBonus.toString()).lessThanOrEqualTo(0)) {
      throw new Error('First transaction bonus must be greater than 0');
    }

    const campaign = await prisma.referralCampaign.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isActive: data.isActive ?? true,
        signupBonus: data.signupBonus ? new Decimal(data.signupBonus.toString()) : null,
        signupCurrency: data.signupCurrency || null,
        firstTxBonus: data.firstTxBonus ? new Decimal(data.firstTxBonus.toString()) : null,
        firstTxCurrency: data.firstTxCurrency || null,
        firstTxMinAmount: data.firstTxMinAmount ? new Decimal(data.firstTxMinAmount.toString()) : null,
        tier2Percentage: data.tier2Percentage ? new Decimal(data.tier2Percentage.toString()) : null,
        tier3Percentage: data.tier3Percentage ? new Decimal(data.tier3Percentage.toString()) : null,
        minKycLevel: data.minKycLevel || null,
        eligibleCountries: data.eligibleCountries || [],
        excludedCountries: data.excludedCountries || [],
        maxReferralsPerUser: data.maxReferralsPerUser || null,
        maxRewardPerUser: data.maxRewardPerUser ? new Decimal(data.maxRewardPerUser.toString()) : null,
        maxRewardPerCampaign: data.maxRewardPerCampaign ? new Decimal(data.maxRewardPerCampaign.toString()) : null,
        startDate,
        endDate,
      },
    });

    return campaign;
  }

  /**
   * Update an existing referral campaign
   */
  async updateCampaign(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      signupBonus?: number | string | null;
      signupCurrency?: string | null;
      firstTxBonus?: number | string | null;
      firstTxCurrency?: string | null;
      firstTxMinAmount?: number | string | null;
      tier2Percentage?: number | string | null;
      tier3Percentage?: number | string | null;
      minKycLevel?: string | null;
      eligibleCountries?: string[];
      excludedCountries?: string[];
      maxReferralsPerUser?: number | null;
      maxRewardPerUser?: number | string | null;
      maxRewardPerCampaign?: number | string | null;
      startDate?: string | Date;
      endDate?: string | Date | null;
    }
  ) {
    // Check if campaign exists
    const existing = await prisma.referralCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Campaign not found');
    }

    // Validation
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Campaign name cannot be empty');
    }

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate;

    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate percentages
    if (data.tier2Percentage !== undefined && data.tier2Percentage !== null) {
      const tier2 = new Decimal(data.tier2Percentage.toString());
      if (tier2.lessThan(0) || tier2.greaterThan(100)) {
        throw new Error('Tier 2 percentage must be between 0 and 100');
      }
    }

    if (data.tier3Percentage !== undefined && data.tier3Percentage !== null) {
      const tier3 = new Decimal(data.tier3Percentage.toString());
      if (tier3.lessThan(0) || tier3.greaterThan(100)) {
        throw new Error('Tier 3 percentage must be between 0 and 100');
      }
    }

    // Build update data
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.signupBonus !== undefined) updateData.signupBonus = data.signupBonus ? new Decimal(data.signupBonus.toString()) : null;
    if (data.signupCurrency !== undefined) updateData.signupCurrency = data.signupCurrency || null;
    if (data.firstTxBonus !== undefined) updateData.firstTxBonus = data.firstTxBonus ? new Decimal(data.firstTxBonus.toString()) : null;
    if (data.firstTxCurrency !== undefined) updateData.firstTxCurrency = data.firstTxCurrency || null;
    if (data.firstTxMinAmount !== undefined) updateData.firstTxMinAmount = data.firstTxMinAmount ? new Decimal(data.firstTxMinAmount.toString()) : null;
    if (data.tier2Percentage !== undefined) updateData.tier2Percentage = data.tier2Percentage ? new Decimal(data.tier2Percentage.toString()) : null;
    if (data.tier3Percentage !== undefined) updateData.tier3Percentage = data.tier3Percentage ? new Decimal(data.tier3Percentage.toString()) : null;
    if (data.minKycLevel !== undefined) updateData.minKycLevel = data.minKycLevel || null;
    if (data.eligibleCountries !== undefined) updateData.eligibleCountries = data.eligibleCountries;
    if (data.excludedCountries !== undefined) updateData.excludedCountries = data.excludedCountries;
    if (data.maxReferralsPerUser !== undefined) updateData.maxReferralsPerUser = data.maxReferralsPerUser || null;
    if (data.maxRewardPerUser !== undefined) updateData.maxRewardPerUser = data.maxRewardPerUser ? new Decimal(data.maxRewardPerUser.toString()) : null;
    if (data.maxRewardPerCampaign !== undefined) updateData.maxRewardPerCampaign = data.maxRewardPerCampaign ? new Decimal(data.maxRewardPerCampaign.toString()) : null;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = endDate;

    const campaign = await prisma.referralCampaign.update({
      where: { id },
      data: updateData,
    });

    return campaign;
  }

  /**
   * Get a campaign by ID
   */
  async getCampaign(id: string) {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  }

  /**
   * List all campaigns with optional filters
   */
  async listCampaigns(filters?: {
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.startDate) {
      where.startDate = { lte: filters.startDate };
    }

    if (filters?.endDate) {
      where.OR = [
        { endDate: null },
        { endDate: { gte: filters.endDate } },
      ];
    }

    const campaigns = await prisma.referralCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  /**
   * Delete a campaign (soft delete by setting isActive to false)
   */
  async deleteCampaign(id: string, hardDelete: boolean = false) {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if campaign has referrals created during its active period
    if (campaign.isActive) {
      const dateFilter: any = {
        gte: campaign.startDate,
      };
      if (campaign.endDate) {
        dateFilter.lte = campaign.endDate;
      }

      const referralCount = await prisma.referral.count({
        where: {
          createdAt: dateFilter,
        },
      });

      if (referralCount > 0) {
        throw new Error('Cannot delete active campaign with existing referrals. Deactivate it first.');
      }
    }

    if (hardDelete) {
      await prisma.referralCampaign.delete({
        where: { id },
      });
    } else {
      // Soft delete
      await prisma.referralCampaign.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return { success: true };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(id: string) {
    const campaign = await prisma.referralCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Build date filter for campaign period
    const dateFilter: any = {
      gte: campaign.startDate,
    };
    if (campaign.endDate) {
      dateFilter.lte = campaign.endDate;
    }

    // Get referrals created during campaign period
    const campaignReferrals = await prisma.referral.findMany({
      where: {
        createdAt: dateFilter,
      },
      include: {
        referralCode: true,
        rewards: true,
      },
    });

    const activeReferrals = campaignReferrals.filter((r) => r.isActive).length;
    const firstTxCompleted = campaignReferrals.filter((r) => r.firstTransactionAt !== null).length;

    // Get rewards for these referrals
    const referralIds = campaignReferrals.map((r) => r.id);
    const [rewards, totalRewardsValue] = await Promise.all([
      prisma.referralReward.count({
        where: {
          referralId: { in: referralIds },
        },
      }),
      prisma.referralReward.aggregate({
        where: {
          referralId: { in: referralIds },
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      campaignId: id,
      totalReferrals: campaignReferrals.length,
      activeReferrals,
      firstTxCompleted,
      totalRewards: rewards,
      totalRewardsValue: totalRewardsValue._sum.amount || new Decimal(0),
      campaign,
    };
  }
}

export const referralService = new ReferralService();

