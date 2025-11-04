import { apiClient } from '@/services/apiClient';

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
    return apiClient.post<any>('/api/escrow', data);
  },

  /**
   * Get all escrows for the authenticated user
   */
  async getUserEscrows() {
    return apiClient.get<any[]>('/api/escrow');
  },

  /**
   * Get detailed information about a specific escrow
   */
  async getEscrowDetails(escrowId: string) {
    return apiClient.get<any>(`/api/escrow/${escrowId}`);
  },

  /**
   * Accept an escrow invitation
   */
  async acceptEscrow(escrowId: string) {
    return apiClient.post<any>(`/api/escrow/${escrowId}/accept`);
  },

  /**
   * Fund a milestone
   */
  async fundMilestone(escrowId: string, milestoneId: string, data: FundMilestoneRequest) {
    return apiClient.post<any>(
      `/api/escrow/${escrowId}/milestones/${milestoneId}/fund`,
      data
    );
  },

  /**
   * Submit deliverable for a milestone
   */
  async submitDeliverable(
    escrowId: string,
    milestoneId: string,
    data: SubmitDeliverableRequest
  ) {
    return apiClient.post<any>(
      `/api/escrow/${escrowId}/milestones/${milestoneId}/deliverable`,
      data
    );
  },

  /**
   * Release a milestone
   */
  async releaseMilestone(
    escrowId: string,
    milestoneId: string,
    data: ReleaseMilestoneRequest
  ) {
    return apiClient.post<any>(
      `/api/escrow/${escrowId}/milestones/${milestoneId}/release`,
      data
    );
  },

  /**
   * Raise a dispute
   */
  async raiseDispute(escrowId: string, data: RaiseDisputeRequest) {
    return apiClient.post<any>(`/api/escrow/${escrowId}/dispute`, data);
  },

  /**
   * Resolve a dispute (mediator/admin only)
   */
  async resolveDispute(escrowId: string, disputeId: string, data: ResolveDisputeRequest) {
    return apiClient.post<any>(
      `/api/escrow/${escrowId}/dispute/${disputeId}/resolve`,
      data
    );
  },

  /**
   * Cancel an escrow
   */
  async cancelEscrow(escrowId: string, data: CancelEscrowRequest) {
    return apiClient.post<any>(`/api/escrow/${escrowId}/cancel`, data);
  },
};
