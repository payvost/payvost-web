# Invoice Migration Guide: Firestore → PostgreSQL

This guide walks you through migrating invoices from Firestore to PostgreSQL.

## Prerequisites

1. ✅ PostgreSQL database configured and accessible
2. ✅ Prisma installed and configured
3. ✅ Firebase Admin SDK credentials
4. ✅ Environment variables set

## Step-by-Step Migration

### Step 1: Review Current Data

Before migration, check your Firestore data:

```bash
# Count invoices in Firestore
# Use Firebase Console or Admin SDK to verify:
# - invoices collection count
# - businessInvoices collection count
```

### Step 2: Backup Firestore Data (Recommended)

```bash
# Export Firestore data (optional but recommended)
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

### Step 3: Apply Prisma Migration

```bash
cd backend/prisma

# Create migration
npx prisma migrate dev --name add_invoice_model

# Generate Prisma Client
npx prisma generate

# Verify schema
npx prisma studio
```

### Step 4: Set Environment Variables

Create or update `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Firebase Admin (for migration)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Step 5: Run Migration Script

```bash
# From project root
npx ts-node backend/services/invoice/migrate-firestore-to-postgres.ts
```

The script will:
- ✅ Read all invoices from `invoices` collection
- ✅ Read all invoices from `businessInvoices` collection
- ✅ Convert Firestore data to PostgreSQL format
- ✅ Preserve invoice IDs for reference integrity
- ✅ Report progress and errors

### Step 6: Verify Migration

```sql
-- Check total counts
SELECT 
  invoice_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid
FROM "Invoice"
GROUP BY invoice_type;

-- Check sample invoices
SELECT id, invoice_number, status, grand_total, created_at
FROM "Invoice"
ORDER BY created_at DESC
LIMIT 10;

-- Verify no duplicates
SELECT invoice_number, COUNT(*) 
FROM "Invoice"
GROUP BY invoice_number
HAVING COUNT(*) > 1;
```

### Step 7: Test API Endpoints

```bash
# Test public invoice endpoint
curl http://localhost:3001/api/invoices/public/{invoice-id}

# Test authenticated endpoint (with Firebase token)
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/api/invoices
```

## Rollback Plan

If migration fails:

1. **Keep Firestore data** - Don't delete until migration is verified
2. **Database rollback**:
   ```bash
   cd backend/prisma
   npx prisma migrate reset  # ⚠️ This will delete all data
   ```
3. **Re-run migration** after fixing issues

## Post-Migration Checklist

- [ ] Verify all invoices migrated
- [ ] Test API endpoints
- [ ] Update frontend to use new API
- [ ] Monitor for errors
- [ ] Update documentation
- [ ] Archive Firestore data (after 30 days)

## Common Issues

### Issue: Missing Firebase Credentials
**Solution**: Ensure `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PROJECT_ID` are set

### Issue: Database Connection Error
**Solution**: Verify `DATABASE_URL` is correct and database is accessible

### Issue: Duplicate Invoice Numbers
**Solution**: The migration script handles this by checking for existing invoices before creating

### Issue: Date Conversion Errors
**Solution**: The script handles various Firestore timestamp formats automatically

## Performance Notes

- Migration processes ~100-200 invoices per second
- Large datasets (>10k invoices) may take 5-10 minutes
- Monitor database connection pool during migration

## Next Steps After Migration

1. ✅ Update frontend components to use new API
2. ✅ Remove Firestore invoice queries
3. ✅ Update notification triggers
4. ✅ Add PDF caching
5. ✅ Monitor costs and performance

## Support

If you encounter issues:
1. Check migration script logs
2. Verify database schema matches Prisma schema
3. Check Firebase Admin credentials
4. Review error messages in migration output

