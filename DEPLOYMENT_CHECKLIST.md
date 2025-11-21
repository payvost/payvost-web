# PDF Service Deployment Checklist

## Issue Identified

The Vercel logs show "[PDF Generation] Generating PDF directly in Vercel" which means:
- ❌ Old code is still deployed on Vercel
- ❌ New code that uses Render service hasn't been deployed yet

## Solutions

### 1. Deploy Updated Code to Vercel

The code in the repo is correct (uses Render service), but it needs to be deployed:

```bash
# Commit changes
git add .
git commit -m "Update PDF generation to use Render service"
git push

# Vercel will auto-deploy from GitHub
# OR manually trigger deployment in Vercel Dashboard
```

### 2. Set Environment Variable in Vercel

**Critical:** Add `PDF_SERVICE_URL` to Vercel environment variables:

1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add:
   - **Key:** `PDF_SERVICE_URL`
   - **Value:** `https://payvost-pdf-generator.onrender.com`
   - **Environment:** Production, Preview, Development (all)
4. Save
5. **Redeploy** (important: environment variables need redeploy)

### 3. Verify Render Service is Deployed

✅ Render service is deployed: https://payvost-pdf-generator.onrender.com
✅ Health check works: GET `/health` returns `OK`
✅ POST endpoint exists: POST `/pdf` accepts invoice data

### 4. Test Flow

After deployment:

1. **Create new invoice** with status "Pending"
2. **Check Vercel logs** - should see "Generating PDF via Render service"
3. **Wait 5-10 seconds** for PDF generation
4. **Test download** via `/api/pdf/invoice/[id]`
5. **Check Firestore** - should have `pdfUrl` field
6. **Check Storage** - should have PDF file

## Current Status

- ✅ Render service deployed and working
- ✅ Code updated to use Render service
- ⏳ Code needs to be deployed to Vercel
- ⏳ Environment variable needs to be set in Vercel

## Next Steps

1. **Commit and push** code changes
2. **Set `PDF_SERVICE_URL`** in Vercel
3. **Redeploy** Vercel (to pick up env var)
4. **Test** end-to-end flow

## Troubleshooting

If you still see "Generating PDF directly in Vercel":

1. Check Vercel deployment logs - did the new code deploy?
2. Check environment variable - is `PDF_SERVICE_URL` set?
3. Clear Vercel cache - trigger a fresh deployment
4. Check Vercel logs - what error is shown when calling Render service?

