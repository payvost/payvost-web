import { apiClient } from '@/lib/api-client';

export interface CreateEscrowRequest {
  title: string;
  description?: string;
  currency: string;
  buyerEmail: string;
  buyerName?: string;
  sellerEmail: string;
  sellerName?: string;
  mediatorEmail?: string;
  mediatorName?: string;
  milestones: {
    title: string;
    description?: string;
    amount: number;
    deliverableDescription?: string;
    requiresApproval?: boolean;
  }[];
  autoReleaseEnabled?: boolean;
  autoReleaseDays?: number;
  expiresAt?: string;
}

export interface FundMilestoneRequest {
  amount: number;
  accountId: string;
}

export interface SubmitDeliverableRequest {
  deliverableUrl: string;
  description?: string;
}

export interface ReleaseMilestoneRequest {
  notes?: string;
}

export interface RaiseDisputeRequest {
  reason: string;
  description: string;
  evidenceUrls?: string[];
  role: 'BUYER' | 'SELLER';
}

export interface ResolveDisputeRequest {
  resolution: 'REFUND_BUYER' | 'RELEASE_SELLER' | 'PARTIAL_REFUND' | 'CUSTOM_SPLIT';
  resolutionNotes?: string;
  refundAmount?: number;
  releaseAmount?: number;
}

export interface CancelEscrowRequest {
  reason?: string;
}

/**
 * Escrow API Client
 */
export const escrowApi = {
  /**
   * Create a new escrow agreement
   */
  async createEscrow(data: CreateEscrowRequest) {
    const response = await apiClient.post('/api/escrow', data);
    return response.data;
  },

  /**
   * Get all escrows for the authenticated user
   */
  async getUserEscrows() {
    const response = await apiClient.get('/api/escrow');
    return response.data;
  },

  /**
   * Get detailed information about a specific escrow
   */
  async getEscrowDetails(escrowId: string) {
    const response = await apiClient.get(`/api/escrow/${escrowId}`);
    return response.data;
  },

  /**
   * Accept an escrow invitation
   */
  async acceptEscrow(escrowId: string) {
    const response = await apiClient.post(`/api/escrow/${escrowId}/accept`);
    return response.data;
  },

  /**
   * Fund a milestone
   */
  async fundMilestone(escrowId: string, milestoneId: string, data: FundMilestoneRequest) {
    const response = await apiClient.post(
      `/api/escrow/${escrowId}/milestones/${milestoneId}/fund`,
      data
    );
    return response.data;
  },

  /**
   * Submit deliverable for a milestone
   */
  async submitDeliverable(
    escrowId: string,
    milestoneId: string,
    data: SubmitDeliverableRequest
  ) {
    const response = await apiClient.post(
      `/api/escrow/${escrowId}/milestones/${milestoneId}/deliverable`,
      data
    );
    return response.data;
  },

  /**
   * Release a milestone
   */
  async releaseMilestone(
    escrowId: string,
    milestoneId: string,
    data: ReleaseMilestoneRequest
  ) {
    const response = await apiClient.post(
      `/api/escrow/${escrowId}/milestones/${milestoneId}/release`,
      data
    );
    return response.data;
  },

  /**
   * Raise a dispute
   */
  async raiseDispute(escrowId: string, data: RaiseDisputeRequest) {
    const response = await apiClient.post(`/api/escrow/${escrowId}/dispute`, data);
    return response.data;
  },

  /**
   * Resolve a dispute (mediator/admin only)
   */
  async resolveDispute(escrowId: string, disputeId: string, data: ResolveDisputeRequest) {
    const response = await apiClient.post(
      `/api/escrow/${escrowId}/dispute/${disputeId}/resolve`,
      data
    );
    return response.data;
  },

  /**
   * Cancel an escrow
   */
  async cancelEscrow(escrowId: string, data: CancelEscrowRequest) {
    const response = await apiClient.post(`/api/escrow/${escrowId}/cancel`, data);
    return response.data;
  },
};
