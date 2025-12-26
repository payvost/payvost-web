import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage, adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/auth-helpers';
import { FieldValue } from 'firebase-admin/firestore';

// ✅ SECURE PDF SERVING: Serves PDFs directly from Storage through API
// Hides storage bucket URL and provides access control

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string = '';
  
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    console.log(`[PDF Download] Requested for invoice: ${id}`);

    // Try to fetch invoice from backend API first (more reliable)
    let invoiceData: any = null;
    let collectionName = 'invoices';
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
      if (backendUrl) {
        const invoiceResponse = await fetch(`${backendUrl}/api/invoices/public/${id}`, {
          method: 'GET',
          cache: 'no-store',
        });
        
        if (invoiceResponse.ok) {
          invoiceData = await invoiceResponse.json();
          collectionName = invoiceData.businessId ? 'businessInvoices' : 'invoices';
          console.log(`[PDF Download] Fetched invoice from backend API`);
        }
      }
    } catch (apiError) {
      console.warn('[PDF Download] Backend API fetch failed, falling back to Firestore:', apiError);
    }

    // Fallback to Firestore if backend API didn't work
    if (!invoiceData) {
      try {
        // Check if Firebase Admin is initialized
        let invoiceDoc = await adminDb.collection('invoices').doc(id).get();
        collectionName = 'invoices';
        
        if (!invoiceDoc.exists) {
          invoiceDoc = await adminDb.collection('businessInvoices').doc(id).get();
          collectionName = 'businessInvoices';
        }

        if (!invoiceDoc.exists) {
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        invoiceData = invoiceDoc.data();
      } catch (firestoreError: any) {
        console.error('[PDF Download] Firestore error:', firestoreError);
        
        // If Firebase Admin isn't initialized, try using backend PDF service directly
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
        if (backendUrl) {
          console.log('[PDF Download] Using backend PDF service as fallback');
          try {
            const pdfResponse = await fetch(`${backendUrl}/api/pdf/invoice/${id}?origin=${encodeURIComponent(req.nextUrl.origin)}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/pdf',
              },
            });

            if (pdfResponse.ok && pdfResponse.headers.get('content-type')?.includes('application/pdf')) {
              const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
              return new NextResponse(pdfBuffer, {
                status: 200,
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
                  'Content-Length': pdfBuffer.length.toString(),
                },
              });
            }
          } catch (backendError) {
            console.error('[PDF Download] Backend PDF service error:', backendError);
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to access invoice data',
            details: firestoreError?.message || 'Firebase Admin may not be initialized'
          },
          { status: 500 }
        );
      }
    }

    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // ✅ ACCESS CONTROL: Match Firestore security rules
    if (collectionName === 'invoices') {
      // User invoices: public if isPublic=true, otherwise require ownership
      const isPublic = invoiceData?.isPublic === true;
      
      if (!isPublic) {
        // Private invoice - verify user authentication and ownership
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        
        if (!sessionCookie) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
          const decodedToken = await verifySessionCookie(sessionCookie);
          const userId = decodedToken.uid;
          
          // Check if user owns this invoice (matches Firestore rule)
          if (invoiceData?.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        } catch (error) {
          console.error('[PDF Download] Auth error:', error);
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }
    // businessInvoices are always public (per Firestore rules: allow read: if true), so no auth needed

    // Try to get PDF from Storage (if Firebase Admin is available)
    let pdfFromStorage: Buffer | null = null;
    
    try {
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = storageBucket ? adminStorage.bucket(storageBucket) : adminStorage.bucket();
      const fileName = `invoice_pdfs/${id}.pdf`;
      const file = bucket.file(fileName);

      // Check if PDF exists in Storage
      let [exists] = await file.exists();
    
      // Check if PDF needs regeneration (status may have changed)
      let shouldRegenerate = false;
      if (exists && invoiceData) {
        try {
          const metadata = await file.getMetadata();
          const timeCreated = metadata[0]?.timeCreated;
          
          // If we can't get the upload time, skip regeneration check
          if (!timeCreated) {
            console.warn('[PDF Download] Could not determine PDF upload time, skipping regeneration check');
          } else {
            const uploadedTime = new Date(timeCreated).getTime();
            const invoiceUpdatedTime = invoiceData.updatedAt 
              ? (invoiceData.updatedAt instanceof Date ? invoiceData.updatedAt.getTime() : new Date(invoiceData.updatedAt).getTime())
              : uploadedTime;
            
            // If invoice was updated after PDF was generated, regenerate
            if (invoiceUpdatedTime > uploadedTime) {
              console.log(`[PDF Download] Invoice was updated after PDF generation (${new Date(invoiceUpdatedTime).toISOString()} > ${new Date(uploadedTime).toISOString()}), regenerating PDF for: ${id}`);
              shouldRegenerate = true;
              exists = false; // Treat as if it doesn't exist to trigger regeneration
            }
          }
        } catch (metadataError: any) {
          console.warn('[PDF Download] Could not check PDF metadata:', metadataError?.message);
          // Continue without regenerating
        }
      }
    
      if (!exists) {
        // PDF doesn't exist or needs regeneration - trigger generation
        console.log(`[PDF Download] PDF ${shouldRegenerate ? 'outdated' : 'not found'}, triggering generation for invoice: ${id}`);
        
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
          const generateResponse = await fetch(`${baseUrl}/api/generate-invoice-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId: id }),
            signal: AbortSignal.timeout(120000), // 2 minutes - accounts for Render cold start
          });

          if (!generateResponse.ok) {
            const errorText = await generateResponse.text().catch(() => 'Unknown error');
            console.error(`[PDF Download] PDF generation failed: ${generateResponse.status} - ${errorText}`);
            // Don't throw - continue to fallback
          } else {
            // Wait for upload to complete (with retries)
            const MAX_RETRIES = 6;
            let fileExistsNow = false;
            for (let i = 0; i < MAX_RETRIES; i++) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              const [fileExists] = await file.exists();
              if (fileExists) {
                fileExistsNow = true;
                exists = true;
                break;
              }
            }

            if (!fileExistsNow) {
              // PDF is still being generated - continue to fallback instead of returning 202
              console.log('[PDF Download] PDF generation still in progress, using backend service');
            }
          }
        } catch (error: any) {
          console.error('[PDF Download] Error generating PDF:', error);
          // Continue to fallback instead of returning error
        }
      }

      // If PDF exists in Storage, serve it
      if (exists) {
        // ✅ SERVE PDF DIRECTLY (no redirect - hides storage bucket URL)
        console.log(`[PDF Download] Serving PDF directly from Storage for invoice: ${id}`);

        // Create a readable stream from the file
        const stream = file.createReadStream();
        
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        pdfFromStorage = Buffer.concat(chunks);
      }
    } catch (storageError: any) {
      console.warn('[PDF Download] Storage access failed, will use backend service:', storageError?.message);
      // Continue to fallback
    }

    // If we have PDF from Storage, serve it
    if (pdfFromStorage) {
      const pdfBuffer = pdfFromStorage;

      // ✅ LOG DOWNLOAD (optional - for analytics)
      console.log(`[PDF Download] PDF served successfully for invoice: ${id}, size: ${pdfBuffer.length} bytes`);
      
      // Optional: Log to Firestore for analytics
      try {
        await adminDb.collection('invoice_downloads').add({
          invoiceId: id,
          downloadedAt: FieldValue.serverTimestamp(),
          userAgent: req.headers.get('user-agent') || 'unknown',
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          collection: collectionName,
        });
      } catch (logError) {
        // Don't fail if logging fails
        console.warn('[PDF Download] Failed to log download:', logError);
      }

      // Return PDF with proper headers
      return new NextResponse(new Uint8Array(Buffer.isBuffer(pdfBuffer) ? pdfBuffer : pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="invoice-${id}.pdf"`, // 'inline' for viewing, 'attachment' for download
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour (private - not cached by CDN)
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Fallback: Use backend PDF service directly
    console.log('[PDF Download] Using backend PDF service as fallback');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    
    if (backendUrl) {
      try {
        const pdfResponse = await fetch(`${backendUrl}/api/pdf/invoice/${id}?origin=${encodeURIComponent(req.nextUrl.origin)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
          signal: AbortSignal.timeout(120000), // 2 minutes timeout - accounts for Render cold start
        });

        if (pdfResponse.ok && pdfResponse.headers.get('content-type')?.includes('application/pdf')) {
          const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
              'Content-Length': pdfBuffer.length.toString(),
              'Cache-Control': 'private, max-age=3600',
            },
          });
        } else {
          const errorText = await pdfResponse.text().catch(() => 'Unknown error');
          console.error(`[PDF Download] Backend PDF service returned error: ${pdfResponse.status} - ${errorText}`);
        }
      } catch (backendError: any) {
        console.error('[PDF Download] Backend PDF service error:', backendError);
      }
    }

    // Final fallback: Return error with helpful message
    return NextResponse.json(
      { 
        error: 'Failed to retrieve PDF',
        message: 'PDF generation service is temporarily unavailable. Please try again later.',
        details: 'Both local storage and backend service failed'
      },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('[PDF Download] Error:', error);
    
    // Try backend service as last resort before failing
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const pdfResponse = await fetch(`${backendUrl}/api/pdf/invoice/${id}?origin=${encodeURIComponent(req.nextUrl.origin)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/pdf' },
          signal: AbortSignal.timeout(120000), // 2 minutes - accounts for Render cold start
        });

        if (pdfResponse.ok && pdfResponse.headers.get('content-type')?.includes('application/pdf')) {
          const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
              'Content-Length': pdfBuffer.length.toString(),
            },
          });
        }
      } catch (fallbackError) {
        console.error('[PDF Download] Final fallback also failed:', fallbackError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve PDF',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
