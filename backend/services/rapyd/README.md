# Rapyd Integration for Wallet Creation

This service integrates Rapyd wallet creation with the Payvost wallet system.

## Overview

When a user creates a wallet account, the system now:
1. Creates a database record (as before)
2. **NEW**: Creates a corresponding Rapyd wallet
3. Stores the Rapyd wallet ID in the database for future reference

## Configuration

### Environment Variables

Add these to your `.env` file (backend or root):

```bash
# Rapyd Sandbox (for testing)
RAPYD_ACCESS_KEY=your_sandbox_access_key
RAPYD_SECRET_KEY=your_sandbox_secret_key
RAPYD_ENV=sandbox

# Rapyd Production (when ready)
# RAPYD_ACCESS_KEY=your_production_access_key
# RAPYD_SECRET_KEY=your_production_secret_key
# RAPYD_ENV=production
```

### Getting Rapyd Credentials

1. Sign up at [Rapyd Dashboard](https://dashboard.rapyd.net/)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Access Key** and **Secret Key**
4. For sandbox testing, use the sandbox credentials
5. For production, use the production credentials

## How It Works

### Wallet Creation Flow

1. User requests wallet creation via `POST /api/wallet/accounts`
2. System validates KYC status (must be `verified`)
3. System checks for duplicate accounts
4. **NEW**: System fetches user data from Firestore
5. **NEW**: System creates Rapyd wallet with user information
6. System creates database account record with `rapydWalletId`
7. Returns account data (including `rapydWalletId` if created)

### Error Handling

The system uses a **graceful fallback** approach:

- If Rapyd wallet creation fails, the database account is still created
- The `rapydWalletId` field will be `null` if Rapyd creation failed
- Errors are logged but don't prevent wallet creation
- This ensures the system continues to work even if Rapyd is unavailable

### Database Schema

The `Account` model now includes:
```prisma
model Account {
  // ... existing fields
  rapydWalletId String?  // Rapyd wallet ID (nullable)
  // ... rest of fields
}
```

## Testing

### Sandbox Testing

1. Set `RAPYD_ENV=sandbox` in your environment
2. Use sandbox credentials from Rapyd dashboard
3. Create a wallet via the API
4. Check Rapyd sandbox dashboard to verify wallet was created
5. Check database to confirm `rapydWalletId` is stored

### Production Deployment

1. Update environment variables with production credentials
2. Set `RAPYD_ENV=production`
3. The system automatically switches to production API endpoints

## API Response

### Success Response

```json
{
  "account": {
    "id": "uuid",
    "userId": "firebase-uid",
    "currency": "USD",
    "balance": "0",
    "type": "PERSONAL",
    "rapydWalletId": "ewallet_1234567890abcdef",
    "createdAt": "2025-11-24T23:15:54.000Z",
    "updatedAt": "2025-11-24T23:15:54.000Z"
  },
  "rapydWalletId": "ewallet_1234567890abcdef"
}
```

### Fallback Response (Rapyd Failed)

```json
{
  "account": {
    "id": "uuid",
    "userId": "firebase-uid",
    "currency": "USD",
    "balance": "0",
    "type": "PERSONAL",
    "rapydWalletId": null,
    "createdAt": "2025-11-24T23:15:54.000Z",
    "updatedAt": "2025-11-24T23:15:54.000Z"
  }
}
```

## Troubleshooting

### Rapyd Wallet Not Created

1. **Check credentials**: Verify `RAPYD_ACCESS_KEY` and `RAPYD_SECRET_KEY` are set
2. **Check environment**: Verify `RAPYD_ENV` is set to `sandbox` or `production`
3. **Check logs**: Look for `[Rapyd]` prefixed log messages
4. **Check user data**: Ensure user has `email` in Firestore
5. **Check Rapyd dashboard**: Verify credentials are active

### Common Errors

- **"Rapyd credentials not configured"**: Missing environment variables
- **"Failed to create wallet"**: Check Rapyd API response in logs
- **"User missing email"**: User must have email in Firestore profile

## Future Enhancements

- [ ] Sync balances between Rapyd and database
- [ ] Handle Rapyd webhooks for balance updates
- [ ] Support multiple currencies per Rapyd wallet
- [ ] Retry mechanism for failed Rapyd wallet creation
- [ ] Migration script for existing accounts

## Related Files

- `backend/services/rapyd/index.ts` - Rapyd service implementation
- `backend/services/wallet/routes.ts` - Wallet creation route
- `backend/prisma/schema.prisma` - Database schema
- `src/services/rapydService.ts` - Frontend Rapyd service (for other features)

