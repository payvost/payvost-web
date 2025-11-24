# Firebase to Prisma User Sync

## Overview

This service ensures that Firebase users are automatically synced to the Prisma database. This is required because:

1. **Foreign Key Constraints**: The `Account` model has a foreign key relationship to `User`
2. **Firebase UID as Primary Key**: Prisma `User.id` now uses Firebase UID instead of auto-generated UUID
3. **Data Consistency**: Keeps user data synchronized between Firestore and PostgreSQL

## How It Works

### Automatic Sync

When a user performs certain actions (like creating a wallet), the system automatically:

1. Checks if a Prisma User exists for the Firebase UID
2. If not, fetches user data from Firestore
3. Creates a Prisma User record with the Firebase UID as the ID
4. Proceeds with the requested operation

### Manual Sync Script

For bulk migration of existing users, use the sync script:

```bash
npx ts-node backend/scripts/sync-firebase-users-to-prisma.ts
```

This script:
- Fetches all users from Firestore
- Creates Prisma User records for each
- Reports success/failure statistics

## Schema Changes

### User Model

The `User` model was updated to use Firebase UID as the primary key:

```prisma
model User {
  id         String            @id // Firebase UID (no default)
  email      String            @unique
  password   String
  // ... rest of fields
}
```

**Important**: The `@default(uuid())` was removed. All User records must now be created with an explicit ID (Firebase UID).

## Usage

### In Code

```typescript
import { ensurePrismaUser } from '../services/user/syncUser';

// Before creating an account or performing user-related operations
const { prismaUserId, created } = await ensurePrismaUser(firebaseUid);

if (created) {
  console.log(`Created new Prisma User: ${prismaUserId}`);
} else {
  console.log(`Prisma User already exists: ${prismaUserId}`);
}
```

### Data Mapping

The sync function maps Firestore fields to Prisma fields:

| Firestore Field | Prisma Field | Notes |
|----------------|--------------|-------|
| `email` | `email` | Required |
| `name` or `fullName` | `name` | Optional |
| `role` | `role` | Defaults to 'user' |
| `kycStatus` | `kycStatus` | Defaults to 'pending' |
| `country` or `countryCode` | `country` | Optional |
| `userTier` | `userTier` | Defaults to 'STANDARD' |
| `passwordHash` | `password` | Defaults to 'firebase_auth_only' if missing |
| 2FA fields | 2FA fields | Synced as-is |

## Error Handling

The sync function throws errors in these cases:

1. **Firebase user not found**: User doesn't exist in Firestore
2. **Missing email**: Firestore user has no email field
3. **Email conflict**: Email exists in Prisma with different ID
4. **Database error**: Prisma operation fails

## Integration Points

Currently integrated in:

- `POST /api/wallet/accounts` - Creates wallet (requires Prisma User)
- `GET /api/wallet/accounts` - Lists wallets (ensures Prisma User exists)

## Migration Notes

### For Existing Deployments

If you have existing Prisma User records with UUID IDs:

1. **Option A**: Run the sync script to create new User records with Firebase UIDs
2. **Option B**: Migrate existing User records to use Firebase UIDs (requires data migration)

### For New Deployments

No migration needed - users will be automatically synced on first use.

## Testing

Test the sync function:

```typescript
import { ensurePrismaUser } from '../services/user/syncUser';

// Test with a valid Firebase UID
const result = await ensurePrismaUser('test-firebase-uid');
console.log(result); // { prismaUserId: 'test-firebase-uid', created: true }
```

## Troubleshooting

### "User sync failed: Firebase user not found"

- Ensure the Firebase UID is correct
- Check that the user exists in Firestore
- Verify Firebase Admin SDK is properly initialized

### "Email already exists in Prisma with different ID"

- This indicates a data inconsistency
- Check if there are duplicate users
- May need manual cleanup

### "Failed to sync user: ..."

- Check backend logs for detailed error
- Verify database connection
- Ensure Prisma schema is up to date

