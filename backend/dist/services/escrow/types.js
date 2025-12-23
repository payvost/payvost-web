"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeResolutionEnum = exports.DisputeStatusEnum = exports.MilestoneStatusEnum = exports.EscrowPartyRoleEnum = exports.EscrowStatusEnum = void 0;
// Export enum values for runtime use - with fallback
exports.EscrowStatusEnum = {
    DRAFT: 'DRAFT',
    AWAITING_ACCEPTANCE: 'AWAITING_ACCEPTANCE',
    AWAITING_FUNDING: 'AWAITING_FUNDING',
    FUNDED: 'FUNDED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED',
    REFUNDED: 'REFUNDED',
};
exports.EscrowPartyRoleEnum = {
    BUYER: 'BUYER',
    SELLER: 'SELLER',
    MEDIATOR: 'MEDIATOR',
    ADMIN: 'ADMIN',
};
exports.MilestoneStatusEnum = {
    PENDING: 'PENDING',
    AWAITING_FUNDING: 'AWAITING_FUNDING',
    FUNDED: 'FUNDED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    RELEASED: 'RELEASED',
    DISPUTED: 'DISPUTED',
    CANCELLED: 'CANCELLED',
};
exports.DisputeStatusEnum = {
    OPEN: 'OPEN',
    UNDER_REVIEW: 'UNDER_REVIEW',
    EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
    AWAITING_DECISION: 'AWAITING_DECISION',
    RESOLVED_BUYER: 'RESOLVED_BUYER',
    RESOLVED_SELLER: 'RESOLVED_SELLER',
    RESOLVED_PARTIAL: 'RESOLVED_PARTIAL',
    CLOSED: 'CLOSED',
};
exports.DisputeResolutionEnum = {
    REFUND_BUYER: 'REFUND_BUYER',
    RELEASE_SELLER: 'RELEASE_SELLER',
    PARTIAL_REFUND: 'PARTIAL_REFUND',
    CUSTOM_SPLIT: 'CUSTOM_SPLIT',
};
