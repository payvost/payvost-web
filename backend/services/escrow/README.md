# Escrow Service

Comprehensive escrow management service for secure, milestone-based transactions with dispute resolution.

## Features

- **Multi-Party Escrow**: Support for buyer, seller, and optional mediator roles
- **Milestone-Based Payments**: Break transactions into funded and approved milestones
- **State Machine**: Robust state transitions with validation
- **Dispute Resolution**: Built-in dispute workflow with evidence submission
- **Auto-Release**: Optional automatic fund release after approval period
- **Activity Logging**: Complete audit trail of all escrow activities
- **Document Management**: Attach agreements and evidence files

## Escrow Lifecycle

```
DRAFT → AWAITING_ACCEPTANCE → AWAITING_FUNDING → FUNDED → IN_PROGRESS → COMPLETED
                                                    ↓
                                                DISPUTED → REFUNDED/RESOLVED
```

## Milestone States

- **PENDING**: Not yet ready for funding
- **AWAITING_FUNDING**: Ready to receive funds
- **FUNDED**: Fully funded, work can begin
- **UNDER_REVIEW**: Deliverable submitted, awaiting approval
- **APPROVED**: Approved but not yet released
- **RELEASED**: Funds released to seller
- **DISPUTED**: Under dispute
- **CANCELLED**: Milestone cancelled

## API Endpoints

### Create Escrow
```
POST /api/escrow
```

### List User Escrows
```
GET /api/escrow
```

### Get Escrow Details
```
GET /api/escrow/:id
```

### Accept Escrow Invitation
```
POST /api/escrow/:id/accept
```

### Fund Milestone
```
POST /api/escrow/:id/milestones/:milestoneId/fund
```

### Submit Deliverable
```
POST /api/escrow/:id/milestones/:milestoneId/deliverable
```

### Release Milestone
```
POST /api/escrow/:id/milestones/:milestoneId/release
```

### Raise Dispute
```
POST /api/escrow/:id/dispute
```

### Resolve Dispute
```
POST /api/escrow/:id/dispute/:disputeId/resolve
```

### Cancel Escrow
```
POST /api/escrow/:id/cancel
```

## Security

- All endpoints require Firebase authentication
- Financial operations require KYC verification
- Role-based access control for party-specific actions
- Mediator/admin-only dispute resolution

## Platform Fees

Default platform fee: **2.5%** of total escrow amount
- Configurable per escrow
- Collected upon milestone release

## Usage Example

```typescript
// Create escrow
const escrow = await EscrowService.createEscrow({
  title: "Website Development",
  currency: "USD",
  buyerEmail: "buyer@example.com",
  sellerEmail: "seller@example.com",
  milestones: [
    { title: "Design Phase", amount: 1000, deliverableDescription: "UI mockups" },
    { title: "Development", amount: 2000, deliverableDescription: "Functional website" },
  ],
  autoReleaseEnabled: true,
  autoReleaseDays: 7,
}, buyerUserId);

// Fund first milestone
await EscrowService.fundMilestone(escrow.id, {
  milestoneId: milestone1Id,
  amount: 1000,
  accountId: buyerAccountId,
}, buyerUserId);

// Submit deliverable
await EscrowService.submitDeliverable(escrow.id, {
  milestoneId: milestone1Id,
  deliverableUrl: "https://example.com/design.pdf",
}, sellerUserId);

// Release milestone
await EscrowService.releaseMilestone(escrow.id, {
  milestoneId: milestone1Id,
  notes: "Design approved",
}, buyerUserId);
```

## Database Models

- **Escrow**: Main escrow agreement
- **EscrowParty**: Participants (buyer, seller, mediator)
- **Milestone**: Payment milestones with deliverables
- **EscrowTransaction**: Financial transactions (funding, releases)
- **Dispute**: Dispute records with resolution
- **DisputeEvidence**: Supporting documents
- **DisputeMessage**: Communication thread
- **EscrowActivity**: Audit log
- **EscrowDocument**: Attached documents

## Integration

The service integrates with:
- **Wallet Service**: For fund transfers
- **Notification Service**: For event notifications
- **User Service**: For party verification
- **PDF Service**: For generating agreements
