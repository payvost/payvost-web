# Comprehensive Referral System Implementation

## Overview

A complete referral system has been implemented for the Payvost cross-border platform, enabling users to refer friends and earn rewards through a multi-tier referral structure.

## What Was Implemented

### 1. Database Schema (`backend/prisma/schema.prisma`)

Added four new models:

- **ReferralCode**: Stores unique referral codes for each user
- **Referral**: Tracks referral relationships (referrer → referred)
- **ReferralReward**: Manages reward payouts with approval workflow
- **ReferralCampaign**: Configurable campaigns with reward rules

**Key Features:**
- Multi-tier referrals (up to 3 tiers)
- Reward approval workflow
- Campaign-based reward configuration
- Country-specific eligibility
- Automatic reward calculation

### 2. Backend Service (`backend/services/referral/`)

**Core Service (`index.ts`):**
- `generateReferralCode()`: Creates unique 8-character codes
- `processReferral()`: Handles referral during registration
- `processFirstTransaction()`: Triggers rewards on first transaction
- `approveAndPayReward()`: Approves and credits rewards to accounts
- `getUserReferralStats()`: Returns user's referral statistics
- Multi-tier reward processing

**API Routes (`routes.ts`):**
- `GET /api/v1/referral/code` - Get user's referral code
- `GET /api/v1/referral/stats` - Get referral statistics
- `POST /api/v1/referral/process` - Process referral during registration
- `GET /api/v1/referral/validate/:code` - Validate referral code

**Transaction Hook (`transaction-hook.ts`):**
- Automatically processes first transaction rewards
- Integrated with transaction manager

### 3. Frontend Components

**Registration Form (`src/components/registration-form.tsx`):**
- Added referral code input field
- Auto-populates from URL parameter (`?ref=CODE`)
- Validates and sends referral code during registration

**Referral Dashboard (`src/components/referral-dashboard.tsx`):**
- Displays user's referral code
- Shows referral statistics (total, active, earnings)
- Lists all referrals with status
- Copy/share referral link functionality

### 4. Integration Points

**Registration API (`src/app/api/auth/register/route.ts`):**
- Processes referral codes during user registration
- Non-blocking (registration succeeds even if referral processing fails)

**Transaction System (`backend/services/core-banking/src/transaction-manager.ts`):**
- Hooks into transaction completion
- Automatically processes first transaction rewards
- Non-blocking (transactions succeed even if referral processing fails)

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_referral_system
npx prisma generate
```

### 2. Create Initial Campaign

You can create an initial referral campaign using one of these methods:

**Option A: Direct Database Insert**
```sql
INSERT INTO "ReferralCampaign" (
  id, name, description, "isActive",
  "signupBonus", "signupCurrency",
  "firstTxBonus", "firstTxCurrency", "firstTxMinAmount",
  "tier2Percentage", "tier3Percentage",
  "startDate"
) VALUES (
  gen_random_uuid(),
  'Launch Campaign',
  'Initial referral campaign',
  true,
  10.00,  -- $10 signup bonus
  'USD',
  5.00,   -- $5 first transaction bonus
  'USD',
  50.00,  -- Minimum $50 transaction
  10.00,  -- 10% for tier 2
  5.00,   -- 5% for tier 3
  NOW()
);
```

**Option B: Admin API Endpoints** ✅ **RECOMMENDED - NOW IMPLEMENTED**

Use the admin API endpoints to create and manage campaigns through the UI. See the [Admin Campaign Management](#admin-campaign-management) section below for details.

**Example using the API client:**
```typescript
import { createCampaign } from '@/lib/api/referral-campaigns';

const campaign = await createCampaign({
  name: 'Launch Campaign',
  description: 'Initial referral campaign',
  signupBonus: 10.00,
  signupCurrency: 'USD',
  firstTxBonus: 5.00,
  firstTxCurrency: 'USD',
  firstTxMinAmount: 50.00,
  tier2Percentage: 10.00,
  tier3Percentage: 5.00,
  startDate: new Date().toISOString(),
  isActive: true,
});
```

### 3. Environment Variables

Ensure these are set:
```env
BACKEND_URL=http://localhost:3001  # For frontend to call backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001  # For client-side calls
DATABASE_URL=your_postgres_url
```

### 4. Add Referral Dashboard to User Interface

Add the referral dashboard to your user dashboard:

```tsx
import { ReferralDashboard } from '@/components/referral-dashboard';

// In your dashboard page
<ReferralDashboard />
```

### 5. Admin Campaign Management UI ✅ **IMPLEMENTED**

A complete admin UI component is available for managing referral campaigns:

**Component Location:** `src/components/admin/referral-campaign-manager.tsx`

**Page Location:** `/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/referral-campaigns`

**Features:**
- ✅ List all campaigns with status indicators
- ✅ Create new campaigns with full form validation
- ✅ Edit existing campaigns
- ✅ Activate/Deactivate campaigns
- ✅ View campaign statistics (referrals, rewards, etc.)
- ✅ Delete campaigns (with confirmation)
- ✅ Responsive design with modern UI

**Usage:**
The component is already integrated into the admin dashboard. Navigate to:
```
/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/referral-campaigns
```

Or use the component directly:
```tsx
import { ReferralCampaignManager } from '@/components/admin/referral-campaign-manager';

<ReferralCampaignManager />
```

The component automatically handles:
- Authentication (requires admin role)
- API calls to backend
- Form validation
- Error handling
- Success notifications

## How It Works

### User Flow

1. **User Registration:**
   - User can enter a referral code during registration
   - Code can be provided via URL parameter (`/signup?ref=ABC123`)
   - System validates code and creates referral relationship

2. **Reward Generation:**
   - Signup bonus: Created immediately when referral is processed
   - First transaction bonus: Triggered when referred user completes first transaction

3. **Multi-Tier Rewards:**
   - Tier 1: Direct referrer gets full reward
   - Tier 2: Referrer's referrer gets percentage (e.g., 10%)
   - Tier 3: Third level gets smaller percentage (e.g., 5%)

4. **Reward Approval:**
   - Rewards start as `PENDING`
   - Admin must approve via `approveAndPayReward()`
   - Once approved, reward is credited to user's account

### Admin Flow

1. **View Pending Rewards:**
   ```typescript
   // Query pending rewards
   const pendingRewards = await prisma.referralReward.findMany({
     where: { status: 'PENDING' }
   });
   ```

2. **Approve Rewards:**
   ```typescript
   await referralService.approveAndPayReward(rewardId, adminUserId);
   ```

3. **Manage Campaigns:**
   - Create/update campaigns via database or admin API
   - Set reward amounts, percentages, eligibility rules

## API Usage Examples

### Get User's Referral Code
```typescript
const response = await fetch('/api/v1/referral/code', {
  headers: { Authorization: `Bearer ${token}` }
});
const { code } = await response.json();
```

### Get Referral Statistics
```typescript
const response = await fetch('/api/v1/referral/stats', {
  headers: { Authorization: `Bearer ${token}` }
});
const stats = await response.json();
// Returns: { referralCode, totalReferrals, activeReferrals, totalEarned, referrals }
```

### Validate Referral Code
```typescript
const response = await fetch(`/api/v1/referral/validate/${code}`);
const { valid, error } = await response.json();
```

## Admin Campaign Management

### Overview

Admin API endpoints are available for managing referral campaigns through the UI. All endpoints require admin authentication.

### Frontend API Client

Use the provided API client (`src/lib/api/referral-campaigns.ts`):

```typescript
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
} from '@/lib/api/referral-campaigns';

// List all campaigns
const campaigns = await getCampaigns({ isActive: true });

// Get a specific campaign
const campaign = await getCampaign('campaign-id');

// Create a new campaign
const newCampaign = await createCampaign({
  name: 'Q1 2025 Campaign',
  description: 'First quarter referral campaign',
  signupBonus: 10.00,
  signupCurrency: 'USD',
  firstTxBonus: 5.00,
  firstTxCurrency: 'USD',
  firstTxMinAmount: 50.00,
  tier2Percentage: 10.00,
  tier3Percentage: 5.00,
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-03-31T23:59:59Z',
  eligibleCountries: ['US', 'GB', 'CA'],
  isActive: true,
});

// Update a campaign
const updated = await updateCampaign('campaign-id', {
  isActive: false,
});

// Delete a campaign (soft delete by default)
await deleteCampaign('campaign-id');

// Hard delete
await deleteCampaign('campaign-id', true);

// Get campaign statistics
const stats = await getCampaignStats('campaign-id');
```

### Backend API Endpoints

All endpoints are prefixed with `/api/v1/referral/admin/campaigns` and require:
- Firebase authentication token in `Authorization: Bearer <token>` header
- Admin role (`admin` or `super_admin`)

#### List Campaigns
```
GET /api/v1/referral/admin/campaigns
Query Parameters:
  - isActive (boolean, optional): Filter by active status
  - startDate (ISO date string, optional): Filter campaigns starting after this date
  - endDate (ISO date string, optional): Filter campaigns ending before this date

Response: { campaigns: ReferralCampaign[] }
```

#### Get Campaign
```
GET /api/v1/referral/admin/campaigns/:id

Response: { campaign: ReferralCampaign }
```

#### Create Campaign
```
POST /api/v1/referral/admin/campaigns
Body: CreateCampaignInput

Response: { campaign: ReferralCampaign }
```

**Required Fields:**
- `name`: Campaign name
- `startDate`: Campaign start date (ISO date string)

**Optional Fields:**
- `description`: Campaign description
- `isActive`: Whether campaign is active (default: true)
- `signupBonus`: Signup bonus amount
- `signupCurrency`: Currency for signup bonus (default: USD)
- `firstTxBonus`: First transaction bonus amount
- `firstTxCurrency`: Currency for first transaction bonus
- `firstTxMinAmount`: Minimum transaction amount to qualify
- `tier2Percentage`: Percentage for tier 2 rewards (0-100)
- `tier3Percentage`: Percentage for tier 3 rewards (0-100)
- `minKycLevel`: Required KYC level
- `eligibleCountries`: Array of eligible country codes
- `excludedCountries`: Array of excluded country codes
- `maxReferralsPerUser`: Maximum referrals per user
- `maxRewardPerUser`: Maximum reward per user
- `maxRewardPerCampaign`: Maximum reward per campaign
- `endDate`: Campaign end date (ISO date string, optional)

#### Update Campaign
```
PUT /api/v1/referral/admin/campaigns/:id
Body: Partial<CreateCampaignInput>

Response: { campaign: ReferralCampaign }
```

#### Delete Campaign
```
DELETE /api/v1/referral/admin/campaigns/:id
Query Parameters:
  - hard (boolean, optional): If true, permanently deletes. If false, soft deletes (default: false)

Response: { success: true, message: string }
```

#### Get Campaign Statistics
```
GET /api/v1/referral/admin/campaigns/:id/stats

Response: {
  stats: {
    campaignId: string;
    totalReferrals: number;
    activeReferrals: number;
    firstTxCompleted: number;
    totalRewards: number;
    totalRewardsValue: string;
    campaign: ReferralCampaign;
  }
}
```

### Validation Rules

- **Campaign Name**: Required, cannot be empty
- **Start Date**: Required, must be a valid date
- **End Date**: Optional, but if provided, must be after start date
- **Tier Percentages**: Must be between 0 and 100
- **Bonus Amounts**: Must be greater than 0 if provided
- **Country Codes**: Should be valid ISO country codes (e.g., 'US', 'GB', 'CA')

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created (for POST)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (not admin)
- `404`: Not Found (campaign doesn't exist)
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message here"
}
```

## Features

✅ **Multi-tier referrals** (up to 3 levels)  
✅ **Automatic reward calculation**  
✅ **Campaign management**  
✅ **Reward approval workflow**  
✅ **Country-specific eligibility**  
✅ **Fraud prevention** (self-referral checks, duplicate prevention)  
✅ **Analytics and reporting**  
✅ **Non-blocking integration** (doesn't affect core flows)  
✅ **URL-based referral links**  
✅ **Share functionality** (native share API support)

## Security Considerations

- Self-referral prevention
- Duplicate referral prevention
- Reward approval required before payout
- Campaign-based eligibility rules
- Country restrictions support
- Rate limiting on API endpoints (via gateway)

## Future Enhancements

1. **Admin Dashboard:**
   - UI for managing campaigns
   - Bulk reward approval
   - Analytics dashboard

2. **Automated Approval:**
   - Auto-approve rewards based on rules
   - Threshold-based approval

3. **Email Notifications:**
   - Notify referrers when rewards are earned
   - Notify when rewards are paid

4. **Advanced Analytics:**
   - Conversion tracking
   - Referral source tracking
   - Performance metrics

5. **Reward Expiration:**
   - Time-based reward expiration
   - Automatic cleanup

## Testing

### Manual Testing Steps

1. **Test Referral Code Generation:**
   ```bash
   curl -X GET http://localhost:3001/api/v1/referral/code \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Test Referral Processing:**
   - Register a new user with a referral code
   - Verify referral relationship is created
   - Check that signup bonus reward is created

3. **Test First Transaction Reward:**
   - Complete a transaction for referred user
   - Verify first transaction reward is created
   - Check reward amount matches campaign settings

4. **Test Multi-Tier:**
   - Create referral chain (A → B → C)
   - Verify all tiers get appropriate rewards

5. **Test Reward Approval:**
   - Approve a pending reward
   - Verify account is credited
   - Check ledger entry is created

## Troubleshooting

### Referral Code Not Working
- Check if campaign is active
- Verify code exists and is active
- Check campaign start/end dates

### Rewards Not Being Created
- Verify campaign has reward amounts set
- Check transaction meets minimum amount (for first transaction)
- Ensure referral relationship exists

### Rewards Not Being Paid
- Check reward status (must be PENDING)
- Verify account exists for reward currency
- Check approval workflow

## Support

For issues or questions, check:
- Service logs: `backend/services/referral/`
- Database: Check `Referral`, `ReferralReward`, `ReferralCampaign` tables
- API responses: Check error messages in responses

---

**Implementation Date:** 2025-01-XX  
**Status:** ✅ Complete and Ready for Testing

