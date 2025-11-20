# Invoice Migration Setup Instructions

## Current Status

✅ **Prisma Client Generated** - The Invoice model types are available  
⚠️ **Database Migration Pending** - Requires active database connection

## Database Connection Issue

The migration requires an active connection to your Neon PostgreSQL database. If you're seeing connection errors:

### Option 1: Ensure Database is Active (Neon)

Neon databases can pause after inactivity. To wake it up:

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. The database should auto-resume on connection attempt
4. Wait 2-3 seconds and try again

### Option 2: Use Manual SQL Migration

If Prisma migrate continues to fail, you can apply the migration manually:

```bash
# Connect to your database
psql $DATABASE_URL

# Or use Neon SQL Editor
# Then run the SQL from:
backend/prisma/migrations/manual_add_invoice_model.sql
```

### Option 3: Check Connection String

Verify your `.env` file has correct database URLs:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

## Step-by-Step Setup

### 1. Ensure Database is Accessible

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### 2. Run Prisma Migration

```bash
cd backend/prisma
npx prisma migrate dev --name add_invoice_model
```

This will:
- Create migration files
- Apply migration to database
- Update Prisma client

### 3. Verify Migration

```bash
# Check if Invoice table exists
npx prisma studio
# Or
psql $DATABASE_URL -c "\d \"Invoice\""
```

### 4. Set Firebase Credentials (for migration script)

Add to `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 5. Run Data Migration Script

```bash
# From project root
npx ts-node backend/services/invoice/migrate-firestore-to-postgres.ts
```

### 6. Test API Endpoints

Start your backend server:

```bash
cd backend
npm run dev
```

Then test:

```bash
# Test public endpoint (no auth)
curl http://localhost:3001/api/invoices/public/test-id

# Test authenticated endpoint (requires Firebase token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/invoices
```

## Troubleshooting

### Database Connection Timeout

**Solution**: 
- Check if Neon database is paused
- Verify network connectivity
- Check firewall rules
- Try using DIRECT_URL instead of DATABASE_URL

### Migration Already Exists

If migration was partially applied:

```bash
# Check migration status
npx prisma migrate status

# If needed, mark as applied
npx prisma migrate resolve --applied add_invoice_model
```

### Firebase Admin SDK Errors

**Solution**:
- Ensure private key is properly escaped (newlines as `\n`)
- Verify service account has Firestore read permissions
- Check project ID matches your Firebase project

## Next Steps After Migration

1. ✅ Verify all invoices migrated correctly
2. ✅ Test API endpoints
3. ⏳ Update frontend to use new API
4. ⏳ Remove Firestore invoice queries
5. ⏳ Add PDF caching

## Quick Reference

```bash
# Generate Prisma Client (no DB needed)
npx prisma generate

# Create migration (requires DB)
npx prisma migrate dev --name migration_name

# Apply migration manually
psql $DATABASE_URL < backend/prisma/migrations/manual_add_invoice_model.sql

# Run migration script
npx ts-node backend/services/invoice/migrate-firestore-to-postgres.ts
```

