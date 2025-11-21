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
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    console.log(`[PDF Download] Requested for invoice: ${id}`);

    // Fetch invoice from Firestore
    let invoiceDoc = await adminDb.collection('invoices').doc(id).get();
    let collectionName = 'invoices';
    
    if (!invoiceDoc.exists) {
      invoiceDoc = await adminDb.collection('businessInvoices').doc(id).get();
      collectionName = 'businessInvoices';
    }

    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoiceDoc.data();

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

    // Get storage bucket
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = storageBucket ? adminStorage.bucket(storageBucket) : adminStorage.bucket();
    const fileName = `invoice_pdfs/${id}.pdf`;
    const file = bucket.file(fileName);

    // Check if PDF exists in Storage
    const [exists] = await file.exists();
    
    if (!exists) {
      // PDF doesn't exist - trigger generation
      console.log(`[PDF Download] PDF not found, triggering generation for invoice: ${id}`);
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
        const generateResponse = await fetch(`${baseUrl}/api/generate-invoice-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId: id }),
          signal: AbortSignal.timeout(30000),
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text().catch(() => 'Unknown error');
          console.error(`[PDF Download] PDF generation failed: ${generateResponse.status} - ${errorText}`);
          throw new Error(`PDF generation failed: ${errorText}`);
        }

        // Wait for upload to complete (with retries)
        const MAX_RETRIES = 6;
        let fileExistsNow = false;
        for (let i = 0; i < MAX_RETRIES; i++) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const [fileExists] = await file.exists();
          if (fileExists) {
            fileExistsNow = true;
            break;
          }
        }

        if (!fileExistsNow) {
          return NextResponse.json({
            error: 'PDF generation in progress',
            message: 'PDF is being generated. Please try again in a few seconds.',
            retryAfter: 5,
          }, { 
            status: 202,
            headers: { 'Retry-After': '5' },
          });
        }
      } catch (error: any) {
        console.error('[PDF Download] Error generating PDF:', error);
        return NextResponse.json({
          error: 'Failed to generate PDF',
          details: error.message,
        }, { status: 500 });
      }
    }

    // ✅ SERVE PDF DIRECTLY (no redirect - hides storage bucket URL)
    console.log(`[PDF Download] Serving PDF directly from Storage for invoice: ${id}`);

    // Create a readable stream from the file
    const stream = file.createReadStream();
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

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
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${id}.pdf"`, // 'inline' for viewing, 'attachment' for download
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour (private - not cached by CDN)
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.error('[PDF Download] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
