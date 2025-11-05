# Escrow System - Developer Quick Reference

## Quick Start

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (requires DATABASE_URL)
npx prisma migrate dev

# Start backend server
npm run dev:server  # Port 3001
```

### 2. Frontend Setup
```bash
# From project root
npm install

# Start frontend
npm run dev:client  # Port 3000
```

## API Usage Examples

### Create Escrow
```typescript
POST /api/escrow
Authorization: Bearer <firebase-token>

{
  "title": "Website Development Project",
  "description": "5-page marketing website",
  "currency": "USD",
  "buyerEmail": "buyer@example.com",
  "sellerEmail": "seller@example.com",
  "mediatorEmail": "mediator@example.com",
  "milestones": [
    {
      "title": "Design Phase",
      "description": "UI/UX mockups",
      "amount": 1000,
      "deliverableDescription": "Figma designs"
    },
    {
      "title": "Development",
      "amount": 2500
    }
  ],
  "autoReleaseEnabled": true,
  "autoReleaseDays": 7
}
```

### Fund Milestone
```typescript
POST /api/escrow/{escrowId}/milestones/{milestoneId}/fund
Authorization: Bearer <firebase-token>

{
  "amount": 1000,
  "accountId": "acc_xyz123"
}
```

### Submit Deliverable
```typescript
POST /api/escrow/{escrowId}/milestones/{milestoneId}/deliverable
Authorization: Bearer <firebase-token>

{
  "deliverableUrl": "https://example.com/design.pdf",
  "description": "Final design files"
}
```

### Release Milestone
```typescript
POST /api/escrow/{escrowId}/milestones/{milestoneId}/release
Authorization: Bearer <firebase-token>

{
  "notes": "Work approved"
}
```

### Raise Dispute
```typescript
POST /api/escrow/{escrowId}/dispute
Authorization: Bearer <firebase-token>

{
  "reason": "Deliverable not as agreed",
  "description": "The design does not match specifications...",
  "role": "BUYER",
  "evidenceUrls": [
    "https://storage.example.com/evidence1.pdf"
  ]
}
```

## Frontend Component Usage

### Create Escrow Form
```tsx
import { CreateEscrowAgreementForm } from '@/components/create-escrow-agreement-form';

function MyPage() {
  return (
    <CreateEscrowAgreementForm 
      onBack={() => router.push('/dashboard/escrow')}
    />
  );
}
```

### Milestone Card
```tsx
import { MilestoneCard } from '@/components/escrow/milestone-card';

function EscrowDetails() {
  return (
    <MilestoneCard
      milestone={milestone}
      currency="USD"
      userRole="BUYER"
      onFund={() => setFundDialogOpen(true)}
      onRelease={() => handleRelease()}
    />
  );
}
```

### Activity Timeline
```tsx
import { EscrowActivityTimeline } from '@/components/escrow/activity-timeline';

function EscrowDetails() {
  return <EscrowActivityTimeline activities={escrow.activities} />;
}
```

### Fund Milestone Dialog
```tsx
import { FundMilestoneDialog } from '@/components/escrow/fund-milestone-dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <FundMilestoneDialog
      open={open}
      onOpenChange={setOpen}
      escrowId={escrowId}
      milestoneId={milestoneId}
      milestoneTitle="Design Phase"
      requiredAmount={1000}
      currency="USD"
      accounts={userAccounts}
      onSuccess={() => refetch()}
    />
  );
}
```

## Database Queries

### Get Escrow with Details
```typescript
const escrow = await prisma.escrow.findUnique({
  where: { id: escrowId },
  include: {
    parties: true,
    milestones: { orderBy: { order: 'asc' } },
    activities: { orderBy: { createdAt: 'desc' }, take: 20 },
    disputes: { where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } },
  },
});
```

### Get User's Escrows
```typescript
const escrows = await prisma.escrow.findMany({
  where: {
    parties: {
      some: {
        OR: [{ userId }, { email: userEmail }],
      },
    },
  },
  include: {
    parties: true,
    milestones: true,
  },
  orderBy: { createdAt: 'desc' },
});
```

### Update Milestone Status
```typescript
await prisma.milestone.update({
  where: { id: milestoneId },
  data: {
    status: 'FUNDED',
    amountFunded: amount,
    fundedAt: new Date(),
  },
});
```

## State Transitions

### Valid Escrow Status Transitions
```
DRAFT → AWAITING_ACCEPTANCE
AWAITING_ACCEPTANCE → AWAITING_FUNDING
AWAITING_FUNDING → FUNDED
FUNDED → IN_PROGRESS
IN_PROGRESS → COMPLETED
IN_PROGRESS → DISPUTED
DISPUTED → IN_PROGRESS
DISPUTED → REFUNDED
Any (except COMPLETED) → CANCELLED
```

### Valid Milestone Status Transitions
```
PENDING → AWAITING_FUNDING
AWAITING_FUNDING → FUNDED
FUNDED → UNDER_REVIEW
UNDER_REVIEW → APPROVED
APPROVED → RELEASED
Any → DISPUTED
Any → CANCELLED
```

## Error Handling

### Common Error Codes
- `400` - Validation error (bad request)
- `401` - Authentication required
- `403` - KYC verification required or authorization failed
- `404` - Escrow/milestone not found
- `409` - Invalid state transition
- `500` - Server error

### Error Response Format
```json
{
  "error": "Validation failed",
  "message": "Amount exceeds milestone amount"
}
```

## Testing Utilities

### Create Test Escrow
```typescript
const testEscrow = await EscrowService.createEscrow({
  title: "Test Escrow",
  currency: "USD",
  buyerEmail: "buyer@test.com",
  sellerEmail: "seller@test.com",
  milestones: [
    { title: "Milestone 1", amount: 100 },
  ],
}, buyerUserId);
```

### Mock User Accounts
```typescript
const mockAccounts = [
  { id: 'acc_1', currency: 'USD', balance: 5000 },
  { id: 'acc_2', currency: 'EUR', balance: 3000 },
];
```

## Common Patterns

### Check User Role in Escrow
```typescript
function getUserRole(escrow: EscrowDetails, userId: string): EscrowPartyRole | null {
  const party = escrow.parties.find(p => p.userId === userId);
  return party?.role || null;
}
```

### Calculate Platform Fee
```typescript
function calculatePlatformFee(totalAmount: number, feePercent: number = 2.5): number {
  return (totalAmount * feePercent) / 100;
}
```

### Format Escrow Status for Display
```typescript
const statusLabels = {
  DRAFT: 'Draft',
  AWAITING_ACCEPTANCE: 'Awaiting Acceptance',
  AWAITING_FUNDING: 'Awaiting Funding',
  FUNDED: 'Funded',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};
```

## Environment Variables

```bash
# Backend
DATABASE_URL="postgresql://user:pass@localhost:5432/payvost"
DIRECT_URL="postgresql://user:pass@localhost:5432/payvost"
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_FIREBASE_API_KEY="..."
```

## File Structure

```
backend/
├── services/
│   └── escrow/
│       ├── index.ts          # Service exports
│       ├── routes.ts         # API routes
│       ├── service.ts        # Business logic
│       ├── types.ts          # TypeScript types
│       └── README.md         # Service documentation
└── prisma/
    └── schema.prisma         # Database schema

src/
├── app/
│   └── dashboard/
│       └── escrow/           # Escrow pages
├── components/
│   └── escrow/               # Escrow components
└── lib/
    └── api/
        └── escrow.ts         # API client
```

## Debugging Tips

### Enable Prisma Query Logging
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Check Escrow State
```typescript
console.log({
  escrowStatus: escrow.status,
  milestones: escrow.milestones.map(m => ({
    title: m.title,
    status: m.status,
    funded: m.amountFunded,
  })),
});
```

### Verify Permissions
```typescript
const canFund = userRole === 'BUYER' && milestone.status === 'AWAITING_FUNDING';
const canRelease = userRole === 'BUYER' && milestone.status === 'UNDER_REVIEW';
const canSubmit = userRole === 'SELLER' && milestone.status === 'FUNDED';
```

## Performance Tips

1. Use `include` wisely - only fetch needed relations
2. Implement pagination for large lists
3. Cache escrow statistics
4. Use database transactions for multi-step operations
5. Index frequently queried fields
6. Optimize activity log queries with `take` limit

## Support

For issues or questions:
1. Check `ESCROW_IMPLEMENTATION.md` for detailed documentation
2. Review `backend/services/escrow/README.md` for API reference
3. Examine test cases in `backend/services/escrow/tests/`
4. Consult the project's main README.md
