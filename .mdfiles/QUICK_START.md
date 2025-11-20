# Quick Start Guide - Prisma Postgres Setup

This is a quick reference for setting up your Payvost application with Prisma Postgres from Vercel.

## 🚀 5-Minute Setup

### 1. Environment Variables (1 min)

Your database URL is already configured in `.env.development.local`. Just add your other credentials:

```bash
# Open .env.development.local and fill in:
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_API_KEY=your-api-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 2. Generate Prisma Client (30 sec)

```bash
npx prisma generate
```

### 3. Run Migrations (30 sec)

```bash
npx prisma migrate deploy
```

### 4. Test Database Connection (15 sec)

```bash
npm run db:test
```

You should see:
```
✅ Database connection successful!
✅ Query execution successful!
```

### 5. Start Development (15 sec)

```bash
npm run dev
```

Your app will be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📋 Troubleshooting

### "Environment variable not found: DATABASE_URL"
→ Make sure `.env.development.local` exists in the project root

### "Can't reach database server"
→ Check if the DATABASE_URL in `.env.development.local` is correct

### "Migration failed"
→ Try: `npx prisma migrate reset` (WARNING: This will delete all data)

## 🚢 Deploy to Vercel

### Quick Deploy

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link Project**
   ```bash
   vercel link
   ```

3. **Add Database URL**
   ```bash
   vercel env add DATABASE_URL production
   # Paste: postgres://efe8adbe29875076ebcec041a84337a53cc5112191322c2bc59b59fde0bc110c:sk_j0QrL7-WOR0xr95rtvGAx@db.prisma.io:5432/postgres?sslmode=require
   ```

4. **Add Other Environment Variables**
   ```bash
   vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
   # Paste your Firebase service account JSON
   
   # Add all other environment variables from .env.development.local
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

## 📚 Full Documentation

- **Complete Setup Guide**: [PRISMA_POSTGRES_SETUP.md](PRISMA_POSTGRES_SETUP.md)
- **Vercel Deployment**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Project Overview**: [README.md](README.md)

## 🔗 Useful Commands

```bash
# Database
npm run db:test          # Test database connection
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create new migration

# Development
npm run dev              # Start both frontend and backend
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Build
npm run build            # Build for production
npm run typecheck        # Check TypeScript

# Deployment
vercel --prod            # Deploy to Vercel production
```

## ✅ Your Database URLs

### Direct Connection (for migrations and local dev)
```
postgres://efe8adbe29875076ebcec041a84337a53cc5112191322c2bc59b59fde0bc110c:sk_j0QrL7-WOR0xr95rtvGAx@db.prisma.io:5432/postgres?sslmode=require
```

### Prisma Accelerate (optional, for production with caching)
```
prisma+postgres://accelerate.prisma-data.net/?api_key=<your-prisma-accelerate-api-key>
**SECURITY NOTE:** Replace with your actual Prisma Accelerate API key from the dashboard. Never commit real keys.
```

## 🎯 Next Steps

1. ✅ Database URLs configured
2. ⏭️ Add Firebase/Stripe/OneSignal credentials
3. ⏭️ Run `npx prisma generate`
4. ⏭️ Run `npx prisma migrate deploy`
5. ⏭️ Run `npm run db:test`
6. ⏭️ Start development with `npm run dev`
7. ⏭️ Deploy to Vercel when ready

---

Need help? Check the detailed guides or open an issue.
