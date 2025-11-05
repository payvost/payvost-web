# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Service account JSON file (backend/payvost-ae91662ec061.json)
- Prisma Postgres database (see PRISMA_POSTGRES_SETUP.md)

## Step 1: Prepare Service Account Key

Get your Firebase service account JSON content:

```bash
cat backend/payvost-ae91662ec061.json
```

Copy the **entire JSON output** (it will be one long line or formatted JSON).

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Import your project to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `payvost-web` repository

2. **Configure Environment Variables**
   - Go to your project settings
   - Navigate to **Settings** → **Environment Variables**
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `FIREBASE_SERVICE_ACCOUNT_KEY` | Entire JSON content from service account file | Production, Preview, Development |
   | `FIREBASE_DATABASE_URL` | `https://payvost-default-rtdb.firebaseio.com` | All |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | From .env.local | All |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From .env.local | All |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From .env.local | All |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From .env.local | All |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From .env.local | All |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | From .env.local | All |
   | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | From .env.local | All |
   | `ONESIGNAL_APP_ID` | From .env.local | All |
   | `ONESIGNAL_API_KEY` | From .env.local | All |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From .env.local | All |
   | `STRIPE_SECRET_KEY` | From .env.local (Secret) | All |
   | `DATABASE_URL` | Prisma Postgres URL (see PRISMA_POSTGRES_SETUP.md) | All |

   **Database URL Options:**
   - **Direct Connection**: `postgres://user:password@db.prisma.io:5432/postgres?sslmode=require`
   - **Prisma Accelerate** (Recommended): `prisma+postgres://accelerate.prisma-data.net/?api_key=...`
   
   See PRISMA_POSTGRES_SETUP.md for detailed database configuration.

   **Important for FIREBASE_SERVICE_ACCOUNT_KEY:**
   - Paste the entire JSON as a single line (no line breaks)
   - OR paste the formatted JSON as-is (Vercel handles both)
   - Make sure to include the outer `{` and `}`

3. **Deploy**
   - Click **Deploy**
   - Vercel will build and deploy your application
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run from project root)
vercel link

# Add environment variables
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# Paste the entire JSON content when prompted

vercel env add FIREBASE_DATABASE_URL production
# Enter: https://payvost-default-rtdb.firebaseio.com

# Add all other environment variables...
# (Repeat for each variable listed above)

# Deploy to production
vercel --prod
```

## Step 3: Verify Deployment

After deployment:

1. **Check Build Logs**
   - Look for: "Firebase Admin SDK: Using service account from environment variable"
   - Should NOT see: "Service account file not found"

2. **Test API Endpoints**
   ```bash
   # Test dashboard stats
   curl https://your-project.vercel.app/api/admin/dashboard/stats
   
   # Test payment links
   curl https://your-project.vercel.app/api/admin/payment-links
   ```

3. **Check Browser Console**
   - Navigate to your deployed site
   - Check for any Firebase initialization errors

## Troubleshooting

### Issue: "Service account file not found"
**Solution:** Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is set in Vercel dashboard.

### Issue: "Failed to parse service account key"
**Solution:** Ensure the JSON is properly formatted. Copy the entire content including `{` and `}`.

### Issue: "Permission denied" errors
**Solution:** Verify that your service account has the correct roles in Firebase Console:
- Firebase Admin SDK Administrator Service Agent
- Cloud Datastore User

## Security Checklist

- ✅ Service account JSON file is in `.gitignore`
- ✅ Environment variables are set in Vercel dashboard (not in code)
- ✅ Secret keys (STRIPE_SECRET_KEY, DATABASE_URL) are marked as "Secret" in Vercel
- ✅ Service account file is NOT committed to GitHub
- ✅ `.env.local` is NOT committed to GitHub

## Local Development

For local development, the app will automatically use the service account file from:
```
backend/payvost-ae91662ec061.json
```

No need to set `FIREBASE_SERVICE_ACCOUNT_KEY` locally.

## Updating Environment Variables

To update environment variables after deployment:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit the variable
3. Redeploy the application (or wait for next push to trigger automatic deployment)

Or via CLI:
```bash
vercel env rm FIREBASE_SERVICE_ACCOUNT_KEY production
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# Paste new value
vercel --prod
```
