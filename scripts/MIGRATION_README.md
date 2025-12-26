# Data Migration: Neon → Prisma Data Platform

This script migrates all data from your existing Neon database to the new Prisma Data Platform database.

## Prerequisites

1. ✅ Prisma Data Platform database is set up and migrations are applied
2. ✅ Both databases are accessible
3. ✅ Environment variables are configured correctly

## Environment Variables Setup

Before running the migration, ensure your `.env` file has:

```env
# Prisma Data Platform (TARGET - where data will be migrated to)
DATABASE_URL=postgres://...@db.prisma.io:5432/postgres?sslmode=require&pool=true
DIRECT_URL=postgres://...@db.prisma.io:5432/postgres?sslmode=require

# Neon Database (SOURCE - where data will be migrated from)
NEON_DATABASE_URL=postgresql://neondb_owner:npg_DOkxXyE50Yft@ep-lingering-art-adc5d3rq.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important:**
- `DATABASE_URL` should point to **Prisma Data Platform** (target)
- `NEON_DATABASE_URL` should point to **Neon** (source)
- If `NEON_DATABASE_URL` is not set, the script will use a default Neon URL

## Running the Migration

```bash
npm run db:migrate-data
```

Or directly:

```bash
npx ts-node scripts/migrate-neon-to-prisma.ts
```

## What the Script Does

1. ✅ Tests connections to both databases
2. ✅ Migrates tables in dependency order (respects foreign keys)
3. ✅ Processes data in batches (50 records at a time)
4. ✅ Handles errors gracefully (continues if one table fails)
5. ✅ Provides detailed progress and summary report
6. ✅ Uses `ON CONFLICT DO NOTHING` to avoid duplicates

## Migration Order

Tables are migrated in this order to respect foreign key constraints:

1. User (no dependencies)
2. ReferralCode, Account, ReferralCampaign (depend on User)
3. Referral (depends on User, ReferralCode)
4. ReferralReward (depends on Referral, User, Account)
5. ... and so on

## After Migration

1. **Verify data** in Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. **Test your application** with the new database

3. **Once verified**, you can:
   - Update your application to use Prisma Data Platform
   - Decommission the old Neon database (optional)

## Troubleshooting

### Connection Errors
- Ensure both databases are active/accessible
- Check that connection strings are correct
- Verify SSL mode is set correctly (`sslmode=require`)

### Foreign Key Errors
- The script migrates in dependency order, but if you see FK errors:
  - Check that parent tables were migrated successfully
  - Verify the migration order matches your schema

### Large Tables
- The script processes in batches of 50 records
- For very large tables, this may take time
- Progress is shown for each batch

### Duplicate Records
- The script uses `ON CONFLICT DO NOTHING`
- If records already exist (based on primary key), they will be skipped
- This is safe to run multiple times

## Notes

- ⚠️ **Backup first**: Always backup your data before migration
- ⚠️ **Test environment**: Consider testing on a copy first
- ✅ **Idempotent**: Safe to run multiple times (won't create duplicates)
- ✅ **Resumable**: If interrupted, you can run again (skips existing records)

