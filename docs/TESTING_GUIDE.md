# Testing Guide - Invoice PDF Generation on Vercel

## ✅ What's Ready to Test

1. **PDF Generation API** (`/api/pdf/invoice/[id]`)
   - Vercel serverless function
   - Reads from Firestore
   - Generates PDF using React-PDF

2. **Invoice Creation** (Firestore)
   - User invoices: `src/components/create-invoice-page.tsx`
   - Business invoices: `src/components/create-business-invoice-form.tsx`

3. **Invoice Viewing** (Firestore)
   - Public invoice page: `src/app/invoice/[id]/page.tsx`
   - Download button uses new Vercel API route

## 🧪 How to Test

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test PDF Generation

**Option A: Via Browser**
1. Navigate to an invoice page: `http://localhost:3000/invoice/{invoice-id}`
2. Click "Download PDF" button
3. PDF should download

**Option B: Direct API Call**
```bash
curl http://localhost:3000/api/pdf/invoice/{invoice-id} --output test-invoice.pdf
```

### 3. Test Invoice Creation

1. Go to invoice creation page
2. Fill out invoice form
3. Save as "Pending" (creates public invoice)
4. Verify invoice appears in list
5. Test PDF download

### 4. Test Print Functionality

1. Navigate to invoice page
2. Click "Print" button
3. Browser print dialog should open
4. Verify print preview looks correct

## 🔍 What to Check

- ✅ PDF downloads successfully
- ✅ PDF contains correct invoice data
- ✅ PDF formatting looks good
- ✅ Invoice creation works
- ✅ Invoice viewing works
- ✅ Print functionality works
- ✅ No console errors

## ⚠️ Known Issues to Watch For

1. **Vercel Timeout**: If PDF generation takes > 10s (Hobby) or > 60s (Pro), it may timeout
2. **Firebase Admin**: Ensure service account credentials are set in environment variables
3. **React-PDF**: First PDF generation may be slower (cold start)

## 🐛 Troubleshooting

### PDF Generation Fails
- Check browser console for errors
- Check server logs for Firebase Admin errors
- Verify invoice exists in Firestore
- Verify invoice is public (`isPublic: true`)

### PDF is Empty or Malformed
- Check invoice data structure in Firestore
- Verify all required fields are present
- Check React-PDF component rendering

### Timeout Errors
- Upgrade to Vercel Pro plan (60s timeout)
- Or optimize PDF generation (cache, reduce complexity)

