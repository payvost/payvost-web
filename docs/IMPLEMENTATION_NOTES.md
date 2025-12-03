# Invoice PDF Pre-Generation Implementation

## Overview
This implementation uses the **pre-generation approach** where PDFs are generated once when invoices are created/updated and stored in Firebase Storage. Downloads are instant via signed URLs.

## Architecture

```
Invoice Created/Updated (status = Pending/Paid)
  ↓
Trigger PDF Generation API (/api/generate-invoice-pdf)
  ↓
Generate PDF using existing PDF service
  ↓
Upload to Firebase Storage (invoice_pdfs/{invoiceId}.pdf)
  ↓
Save signed URL in Firestore (invoice.pdfUrl)
  ↓
Download API (/api/pdf/invoice/[id]) returns signed URL (instant)
```

## Files Modified/Created

### 1. Storage Rules (`storage.rules`)
- Added `invoice_pdfs/{invoiceId}.pdf` path
- Public read access (uses signed URLs for security)
- Server-only write access

### 2. Firebase Admin SDK (`src/lib/firebase-admin.ts`)
- Added `adminStorage` export for Firebase Storage access
- Uses Proxy pattern for lazy initialization

### 3. PDF Generation Route (`src/app/api/generate-invoice-pdf/route.ts`)
- **POST** endpoint that generates PDFs and uploads to Storage
- Tries multiple PDF service endpoints:
  - `PDF_SERVICE_URL` env variable
  - `http://localhost:3005` (local React-PDF service)
  - Cloud Functions legacy endpoint
- Uploads PDF to `invoice_pdfs/{invoiceId}.pdf`
- Generates signed URL (valid for ~1 year)
- Saves `pdfUrl` in Firestore

### 4. PDF Download Route (`src/app/api/pdf/invoice/[id]/route.ts`)
- **GET** endpoint that returns signed URLs
- Checks Firestore for `pdfUrl` first (instant)
- If not found, checks Storage directly
- If still not found, triggers generation (async)
- Returns 202 (Accepted) if PDF is being generated

### 5. Invoice Creation Components
- `src/components/create-invoice-page.tsx`
- `src/components/create-business-invoice-form.tsx`
- Both trigger PDF generation when invoice status is "Pending" or "Paid" (not "Draft")

## Environment Variables

```env
# Optional: Custom PDF service URL
PDF_SERVICE_URL=http://localhost:3005

# Firebase Storage bucket (optional, uses default if not set)
FIREBASE_STORAGE_BUCKET=payvost.appspot.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=payvost.appspot.com
```

## How It Works

### 1. Invoice Creation
When a user creates/updates an invoice with status "Pending" or "Paid":
- Invoice is saved to Firestore
- Frontend triggers `/api/generate-invoice-pdf` (async, non-blocking)
- PDF is generated and uploaded to Storage
- Signed URL is saved in Firestore

### 2. PDF Download
When a user clicks "Download PDF":
- Frontend calls `/api/pdf/invoice/[id]`
- API checks Firestore for `pdfUrl`
- If found: Returns 302 redirect to signed URL (instant)
- If not found: Checks Storage, triggers generation if needed

### 3. PDF Regeneration
When an invoice is updated:
- If status changes to "Pending"/"Paid": PDF is regenerated
- Old PDF in Storage is overwritten
- New signed URL is saved in Firestore

## Benefits

✅ **No on-demand CPU** - PDFs generated once, not on every request  
✅ **Fast downloads** - Just a signed URL redirect  
✅ **No timeout issues** - Vercel serverless only handles lightweight requests  
✅ **Cost-effective** - Storage is cheaper than compute  
✅ **Scalable** - Same pattern used by Stripe, Paystack, PayPal  
✅ **Works with Vercel** - No heavy processing in serverless functions  

## Testing

1. **Create a new invoice** with status "Pending"
2. **Check Firestore** - Should have `pdfUrl` field after a few seconds
3. **Check Storage** - Should have file at `invoice_pdfs/{invoiceId}.pdf`
4. **Download PDF** - Should be instant via `/api/pdf/invoice/[id]`

## Troubleshooting

### PDF not generating?
- Check if PDF service is running (`http://localhost:3005`)
- Check console logs for PDF generation errors
- Verify Firebase Storage permissions

### PDF generation fails?
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is set
- Check Storage bucket configuration
- Verify PDF service endpoint is accessible

### Downloads slow?
- PDFs should be pre-generated, so downloads should be instant
- If not, check if PDF generation completed successfully

