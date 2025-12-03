# Invoice Migration to Vercel Serverless Functions - Status

## ✅ Completed

1. **PDF Generation API Route** (`src/app/api/pdf/invoice/[id]/route.ts`)
   - Created Vercel serverless function for PDF generation
   - Uses Firebase Admin SDK to read from Firestore
   - Uses React-PDF to generate PDFs
   - Added `@react-pdf/renderer` to package.json

2. **InvoiceDocument Component** (`src/lib/pdf/InvoiceDocument.tsx`)
   - Converted from CommonJS to TypeScript/React
   - Handles both old and new invoice data formats

3. **Invoice Download Endpoint Updated**
   - Updated `src/app/invoice/[id]/page.tsx` to use `/api/pdf/invoice/${id}`

4. **Invoice Creation Reverted to Firestore**
   - `src/components/create-invoice-page.tsx` - Now uses Firestore
   - `src/components/create-business-invoice-form.tsx` - Now uses Firestore

## 🔄 In Progress / Remaining

1. **Invoice Listing Components** - Need to revert to Firestore:
   - `src/components/invoice-list-view.tsx`
   - `src/components/business-invoice-list-view.tsx`
   - `src/app/dashboard/page.tsx` (recent invoices section)

2. **Invoice Viewing Components** - Need to revert to Firestore:
   - `src/app/invoice/[id]/page.tsx` (public invoice view)
   - `src/app/dashboard/request-payment/invoice/[id]/page.tsx` (authenticated view)
   - `src/components/send-invoice-dialog.tsx`

3. **Backend Cleanup**:
   - Remove PostgreSQL invoice API routes from `backend/services/invoice/routes.ts`
   - Remove invoice service registration from `backend/index.ts`

## 📝 Notes

- All new invoices will be stored in Firestore (no PostgreSQL migration needed)
- PDF generation runs as Vercel serverless function (no separate Express server needed)
- Users can print/download invoices via the new `/api/pdf/invoice/[id]` endpoint
- Frontend components need to be reverted from PostgreSQL API calls back to Firestore queries

