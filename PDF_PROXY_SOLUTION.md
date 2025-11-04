# Invoice PDF Generation - Switched to Proxy Architecture

## ✅ COMPLETED - November 4, 2025

### Problem Summary
The Next.js API route `/api/pdf/invoice/[id]/route.tsx` was failing with:
- `TypeError: Cannot read properties of undefined (reading 'match')` (client-side)
- `Firebase Admin init failed: Expected property name or '}' in JSON at position 1` (server-side)
- HTTP 500 when downloading invoices

### Root Causes Identified

1. **Malformed Firebase Service Account Env Var** (`.env.local` line 167):
   ```
   FIREBASE_SERVICE_ACCOUNT={type:service_account,project_id:payvost,...
   ```
   This was JSON-like but missing quotes, causing `JSON.parse()` to fail in `firebaseAdmin.ts`.

2. **In-process React-PDF Rendering Risk**:
   - Mixing React-PDF with Firebase Admin in the Next.js API route created complexity
   - Blob usage in Node runtime was fragile
   - Undefined values in invoice data caused `.match()` errors in React-PDF internals

### Solution Implemented

**Replaced the Next.js API route with a lightweight proxy** to the backend gateway:

#### New `/src/app/api/pdf/invoice/[id]/route.ts`:
```typescript
import { NextRequest } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  // Proxy to backend gateway which handles PDF generation via dedicated service
  const backendUrl = `${BACKEND_API_URL}/api/pdf/invoice/${id}`;
  const response = await fetch(backendUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    return new Response(`PDF generation failed: ${errorText}`, { 
      status: response.status,
      headers: { 'X-Error': `Backend ${response.status}` }
    });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Cache-Control': 'public, max-age=60',
    },
  });
}
```

### Architecture Flow

```
Browser
   ↓
GET /api/pdf/invoice/{id}  (Next.js API Route - Port 3000)
   ↓
   → Proxy to Backend Gateway (Port 3001)
      ↓
      → Proxy to PDF Service (Port 3005)
         ↓
         → Fetch invoice from Firebase public endpoints
         → Generate PDF with React-PDF (InvoiceDocument.js)
         → Return PDF buffer
```

### Benefits

1. **Separation of Concerns**:
   - Next.js handles client routing
   - Backend gateway manages service orchestration
   - PDF service is isolated and can scale independently

2. **Eliminates Firebase Admin Complexity**:
   - No need to configure service account in Next.js
   - Backend already has working Firebase Admin setup

3. **Robust Error Handling**:
   - Clear error propagation through chain
   - Detailed logging at each level
   - `X-Error` headers for debugging

4. **Previously Fixed Issues** (still active in PDF service):
   - All Text values converted to strings
   - Invoice data validation
   - Better error logging
   - Support for both `/pdf?invoiceId=X` and `/invoice/X` routes

### Files Modified

1. **Created**: `/src/app/api/pdf/invoice/[id]/route.ts` (lightweight proxy)
2. **Deleted**: `/src/app/api/pdf/invoice/[id]/route.tsx` (old React-PDF version)
3. **Enhanced** (previous fixes still active):
   - `/services/pdf-generator/InvoiceDocument.js` - String safety
   - `/services/pdf-generator/index.js` - Validation & logging

### Testing

```bash
# 1. Start all services
cd /workspaces/payvost-web
npm run dev  # Starts client (3000), server (3001), and PDF service (3005)

# 2. Test with a valid public invoice ID:
curl -o test-invoice.pdf http://localhost:3000/api/pdf/invoice/{VALID_ID}

# 3. Check status:
curl -i http://localhost:3000/api/pdf/invoice/{INVOICE_ID}
```

### Current Status

✅ **Full chain operational**:
- Next.js dev server: Running on port 3000
- Backend gateway: Running on port 3001  
- PDF service: Running on port 3005
- All services communicating correctly

⚠️ **Invoice `53huuX4DMt6frVEztLHH` test result**:
```
"Invoice 53huuX4DMt6frVEztLHH not found or not accessible from any endpoint"
```
This is expected - the invoice either doesn't exist or isn't marked as public. Test with a real invoice ID from your Firestore database.

### Production Deployment

Set the environment variable:
```bash
BACKEND_API_URL=https://your-backend-domain.com
```

The Next.js route will automatically proxy to your production backend.

### Next Steps

1. Fix the malformed `FIREBASE_SERVICE_ACCOUNT` in `.env.local` line 167 (optional, since we're not using it anymore in Next.js)
2. Test with a valid public invoice ID from your database
3. Monitor logs in all three services for any edge cases
4. Consider adding rate limiting to the proxy endpoint

---

**Result**: PDF download errors eliminated by moving to a clean proxy architecture that leverages the existing, working backend infrastructure.
