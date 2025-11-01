# Prisma Postgres Setup Guide

This guide walks you through setting up Prisma Postgres from Vercel for the Payvost application.

## Overview

Prisma Postgres is a managed PostgreSQL database service provided by Vercel with built-in connection pooling through Prisma Accelerate. This setup provides:

- Managed PostgreSQL database hosted on Vercel
- Automatic connection pooling and query caching with Prisma Accelerate
- Seamless integration with Vercel deployments
- SSL-encrypted connections

## Database URLs

Your Prisma Postgres instance provides two connection URLs:

1. **POSTGRES_URL** (Direct connection)
   - Use for migrations and local development
   - Direct connection to the PostgreSQL database
   - Format: `postgres://user:password@db.prisma.io:5432/postgres?sslmode=require`

2. **PRISMA_DATABASE_URL** (Prisma Accelerate)
   - Use for production/serverless environments
   - Provides connection pooling and query caching
   - Format: `prisma+postgres://accelerate.prisma-data.net/?api_key=...`

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Your `.env.development.local` file has been created with the database connection URL. Add your other environment variables:

```bash
# The DATABASE_URL is already set to your Prisma Postgres instance
# Add the remaining Firebase, OneSignal, and Stripe credentials
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Migrations

Apply existing migrations to your new database:

```bash
npx prisma migrate deploy
```

Or create a new migration if you need to sync the schema:

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database (Optional)

If you have a seed script defined in `package.json`:

```bash
npx prisma db seed
```

### 6. Start Development Server

```bash
npm run dev
```

## Vercel Deployment Setup

### 1. Link Your Vercel Project

```bash
npm install -g vercel
vercel link
```

Follow the prompts to link your local project to your Vercel project.

### 2. Pull Environment Variables from Vercel

If you've already set up environment variables in Vercel dashboard:

```bash
vercel env pull .env.development.local
```

### 3. Add Database URL to Vercel

Go to your Vercel project settings and add environment variables:

**Option A: Using Direct PostgreSQL Connection**

Add to Vercel Environment Variables:
```
DATABASE_URL = postgres://efe8adbe29875076ebcec041a84337a53cc5112191322c2bc59b59fde0bc110c:sk_j0QrL7-WOR0xr95rtvGAx@db.prisma.io:5432/postgres?sslmode=require
```

**Option B: Using Prisma Accelerate (Recommended for Production)**

To use Prisma Accelerate's connection pooling and caching:

1. Update your `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

2. Add both URLs to Vercel:
   ```
   DATABASE_URL = prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19qMFFyTDctV09SMHhyOTVydHZHQXgiLCJhcGlfa2V5IjoiMDFLOFlOU01YODg5V1Y3SkcxWUJIRldTMEUiLCJ0ZW5hbnRfaWQiOiJlZmU4YWRiZTI5ODc1MDc2ZWJjZWMwNDFhODQzMzdhNTNjYzUxMTIxOTEzMjJjMmJjNTliNTlmZGUwYmMxMTBjIiwiaW50ZXJuYWxfc2VjcmV0IjoiMTg5MmMyNTgtZTEyMy00Y2U0LWJjZmQtMjEyNTYzM2JiZDM5In0.aKpKy6WNxL6_ThQGLG77sedSHiYJPSvCwWoVIbtQQIc
   
   DIRECT_URL = postgres://efe8adbe29875076ebcec041a84337a53cc5112191322c2bc59b59fde0bc110c:sk_j0QrL7-WOR0xr95rtvGAx@db.prisma.io:5432/postgres?sslmode=require
   ```

3. Install Prisma Accelerate extension:
   ```bash
   npm install @prisma/extension-accelerate
   ```

4. Update your Prisma client initialization to use Accelerate:
   ```typescript
   import { PrismaClient } from '@prisma/client'
   import { withAccelerate } from '@prisma/extension-accelerate'
   
   const prisma = new PrismaClient().$extends(withAccelerate())
   ```

### 4. Add Other Required Environment Variables

Make sure all these are set in Vercel (see VERCEL_DEPLOYMENT.md for complete list):

- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_*` (all Firebase public keys)
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

### 5. Deploy to Vercel

```bash
vercel --prod
```

Or push to your main branch to trigger automatic deployment.

## Running Migrations on Vercel

### During Deployment

Vercel will automatically run `prisma generate` during the build process if configured in `package.json`.

To run migrations during deployment, you can:

1. Add a build script in `package.json`:
   ```json
   "scripts": {
     "vercel-build": "prisma migrate deploy && next build"
   }
   ```

2. Or use Vercel's build command override in project settings:
   ```
   prisma migrate deploy && npm run build
   ```

### Manual Migration

If you need to run migrations manually:

```bash
# Set the environment variable locally
export DATABASE_URL="postgres://..."

# Run migrations
npx prisma migrate deploy
```

## Prisma Studio

To view and edit your database data:

```bash
npx prisma studio
```

This will open a browser-based database GUI at `http://localhost:5555`.

## Database Management

### View Database Connection

```bash
npx prisma db pull
```

### Reset Database (WARNING: Deletes all data)

```bash
npx prisma migrate reset
```

### Create New Migration

```bash
npx prisma migrate dev --name description_of_changes
```

## Troubleshooting

### Connection Timeout

If you get connection timeouts, ensure:
- Your database URL is correct
- SSL mode is enabled (`?sslmode=require`)
- You're not behind a restrictive firewall

### Migration Failed

If migrations fail:
1. Check the migration SQL files in `backend/prisma/migrations/`
2. Manually connect to the database and check the schema
3. Use `prisma migrate resolve` to mark migrations as applied

### Prisma Client Out of Sync

If you get "Prisma Client out of sync" errors:

```bash
npx prisma generate
```

### Using Prisma Accelerate

If you want to enable Prisma Accelerate for better performance:

1. The `@prisma/extension-accelerate` is already installed
2. Update your schema.prisma datasource (see Option B above)
3. Update Prisma client initialization in your code
4. Redeploy to Vercel

## Security Best Practices

1. ✅ Never commit `.env.development.local` or `.env.local` files
2. ✅ Use environment variables in Vercel for production credentials
3. ✅ Rotate database credentials periodically
4. ✅ Use Prisma Accelerate URL for production (connection pooling)
5. ✅ Keep DATABASE_URL as a secret in Vercel settings

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Accelerate](https://www.prisma.io/docs/accelerate)
- [Vercel Prisma Integration](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## Support

For issues specific to:
- Prisma setup: Check Prisma documentation
- Vercel deployment: Check VERCEL_DEPLOYMENT.md
- Database schema: Check backend/prisma/schema.prisma
