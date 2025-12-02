/**
 * API Client for Referral Campaign Management (Admin)
 * 
 * Provides functions to manage referral campaigns through the backend API.
 * All endpoints require admin authentication.
 */

export interface ReferralCampaign {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  signupBonus: string | null;
  signupCurrency: string | null;
  firstTxBonus: string | null;
  firstTxCurrency: string | null;
  firstTxMinAmount: string | null;
  tier2Percentage: string | null;
  tier3Percentage: string | null;
  minKycLevel: string | null;
  eligibleCountries: string[];
  excludedCountries: string[];
  maxReferralsPerUser: number | null;
  maxRewardPerUser: string | null;
  maxRewardPerCampaign: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
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
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {}

export interface CampaignStats {
  campaignId: string;
  totalReferrals: number;
  activeReferrals: number;
  firstTxCompleted: number;
  totalRewards: number;
  totalRewardsValue: string;
  campaign: ReferralCampaign;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Get authentication token from Firebase
 */
async function getAuthToken(): Promise<string> {
  const { auth } = await import('@/lib/firebase');
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

/**
 * Make authenticated request to backend
 */
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  const url = `${BACKEND_URL}/api/v1/referral${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

/**
 * List all referral campaigns
 */
export async function getCampaigns(filters?: {
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<ReferralCampaign[]> {
  const queryParams = new URLSearchParams();
  if (filters?.isActive !== undefined) {
    queryParams.append('isActive', String(filters.isActive));
  }
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/admin/campaigns${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(endpoint);
  const data = await response.json();
  return data.campaigns || [];
}

/**
 * Get a specific campaign by ID
 */
export async function getCampaign(id: string): Promise<ReferralCampaign> {
  const response = await authenticatedFetch(`/admin/campaigns/${id}`);
  const data = await response.json();
  return data.campaign;
}

/**
 * Create a new referral campaign
 */
export async function createCampaign(input: CreateCampaignInput): Promise<ReferralCampaign> {
  const response = await authenticatedFetch('/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.campaign;
}

/**
 * Update an existing referral campaign
 */
export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput
): Promise<ReferralCampaign> {
  const response = await authenticatedFetch(`/admin/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  const data = await response.json();
  return data.campaign;
}

/**
 * Delete a referral campaign
 * @param id Campaign ID
 * @param hardDelete If true, permanently deletes the campaign. If false, soft deletes (sets isActive to false)
 */
export async function deleteCampaign(id: string, hardDelete: boolean = false): Promise<void> {
  const queryString = hardDelete ? '?hard=true' : '';
  await authenticatedFetch(`/admin/campaigns/${id}${queryString}`, {
    method: 'DELETE',
  });
}

/**
 * Get statistics for a specific campaign
 */
export async function getCampaignStats(id: string): Promise<CampaignStats> {
  const response = await authenticatedFetch(`/admin/campaigns/${id}/stats`);
  const data = await response.json();
  return data.stats;
}

