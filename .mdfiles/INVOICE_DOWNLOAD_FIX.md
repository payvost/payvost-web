# Invoice Download Fix

## Problem
The invoice download feature at `https://us-central1-payvost.cloudfunctions.net/api2/download/invoice/{id}` and the PDF service at `https://pdf-generator-882514216036.africa-south1.run.app` are both failing with:
```
Error: Server Error
The service you requested is not available yet.
Please try again in 30 seconds.
```

## Root Causes

### 1. **CRITICAL: Billing is Disabled (Primary Issue)**

According to the Firebase Functions logs:
```
The request failed because billing is disabled for this project.
```

This is preventing both:
- The Firebase Functions from accepting new deployments
- The Cloud Run PDF service from running properly
- Any requests from being processed correctly

**This must be fixed first before anything else will work.**

### 2. Missing Environment Variable (Secondary Issue)

Even after billing is fixed, the `PDF_SERVICE_URL` environment variable needs to be configured in the deployed Firebase Functions. The code at `functions/src/index.ts` line 51-54 checks for this variable and returns a 500 error if it's missing:

```typescript
if (!PDF_SERVICE_URL) {
  console.error('Missing PDF_SERVICE_URL environment variable');
  return res.status(500).send('PDF service not configured');
}
```

## Solution

### Step 0: Enable Billing (MUST DO FIRST)

1. **Enable billing for the Firebase/Google Cloud project:**
   - Go to [Google Cloud Console - Billing](https://console.cloud.google.com/billing/linkedaccount?project=payvost)
   - Or go to [Firebase Console](https://console.firebase.google.com/project/payvost/overview) → Project Settings → Usage and Billing
   - Link a valid billing account to the project

2. **Verify billing is active:**
   ```bash
   gcloud billing projects describe payvost
   ```
   
   Or check in Firebase Console that the project shows an active billing plan.

**Without billing enabled, none of the following steps will work.**

---

### Option 1: Deploy with Environment Variables (Recommended)

**Prerequisites: Billing must be enabled first (see Step 0 above)**

The `.env` file already contains the correct configuration:
```env
PDF_SERVICE_URL=https://pdf-generator-882514216036.africa-south1.run.app
```

**Steps to fix:**

1. Ensure billing is enabled for the Firebase project
2. Deploy the functions with the environment variables:
   ```bash
   cd functions
   firebase deploy --only functions:api2
   ```

The Firebase CLI will automatically load the `.env` file during deployment (you'll see: "Loaded environment variables from .env").

### Option 2: Set Environment Variables via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/payvost/functions/list)
2. Select the `api2` function
3. Click "Edit" → "Runtime, build, connections and security settings"
4. Under "Runtime environment variables", add:
   - Key: `PDF_SERVICE_URL`
   - Value: `https://pdf-generator-882514216036.africa-south1.run.app`
5. Click "Deploy"

### Option 3: Use Google Cloud Console

1. Go to [Cloud Functions](https://console.cloud.google.com/functions/list?project=payvost)
2. Find and click on the `api2` function
3. Click "Edit"
4. Under "Runtime, build, connections and security settings" → "Environment variables"
5. Add:
   - `PDF_SERVICE_URL` = `https://pdf-generator-882514216036.africa-south1.run.app`
6. Click "Next" then "Deploy"

## Verification

After deployment, test the endpoint:
```bash
curl https://us-central1-payvost.cloudfunctions.net/api2/download/invoice/53huuX4DMt6frVEztLHH
```

Or test in browser:
```
https://us-central1-payvost.cloudfunctions.net/api2/download/invoice/53huuX4DMt6frVEztLHH
```

## Other Environment Variables to Verify

While fixing this, ensure these other environment variables are also set:
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `PUBLIC_SITE_URL`

All values are in the `functions/.env` file.

## Technical Details

The download flow:
1. Client requests: `/download/invoice/{id}`
2. Function validates invoice exists and is public in Firestore
3. Function proxies request to PDF service: `https://pdf-generator-882514216036.africa-south1.run.app/pdf?invoiceId={id}`
4. PDF service fetches invoice data and generates PDF using React-PDF
5. Function returns PDF to client

The PDF service (`services/pdf-generator`) is deployed separately to Cloud Run and is working correctly. The issue is only with the missing environment variable in the Firebase Function.
