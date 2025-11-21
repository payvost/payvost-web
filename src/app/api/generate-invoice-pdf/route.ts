import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

// This route generates a PDF and uploads it to Firebase Storage
// Called when invoice is created/updated (status = Pending/Paid)

export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    console.log(`[PDF Generation] Starting for invoice: ${invoiceId}`);

    // Fetch invoice from Firestore
    let invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
    let collectionName = 'invoices';
    
    if (!invoiceDoc.exists) {
      invoiceDoc = await adminDb.collection('businessInvoices').doc(invoiceId).get();
      collectionName = 'businessInvoices';
    }

    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoiceDoc.data();
    
    // Only generate PDF for public invoices (Pending, Paid, Overdue - not Draft)
    if (invoiceData?.status === 'Draft' || !invoiceData?.isPublic) {
      return NextResponse.json({ 
        message: 'Invoice is draft or not public, skipping PDF generation' 
      }, { status: 200 });
    }

    // Generate PDF using Render service (offloads CPU from Vercel)
    const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'https://payvost-pdf-generator.onrender.com';
    console.log(`[PDF Generation] Generating PDF via Render service for invoice: ${invoiceId}`);
    
    let pdfBuffer: Buffer;
    
    try {
      // Call Render PDF service
      const pdfUrl = `${pdfServiceUrl}/pdf?invoiceId=${invoiceId}`;
      console.log(`[PDF Generation] Calling PDF service: ${pdfUrl}`);
      
      const pdfResponse = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(50000), // 50 seconds timeout
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text().catch(() => 'Unknown error');
        console.error(`[PDF Generation] PDF service returned ${pdfResponse.status}: ${errorText}`);
        throw new Error(`PDF service returned ${pdfResponse.status}: ${errorText}`);
      }

      const arrayBuffer = await pdfResponse.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      
      console.log(`[PDF Generation] PDF generated successfully via Render service, size: ${pdfBuffer.length} bytes`);
      
    } catch (error: any) {
      console.error('[PDF Generation] PDF service error:', error);
      console.error('[PDF Generation] Error stack:', error.stack);
      
      // Check if it's a timeout error
      if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        return NextResponse.json({ 
          error: 'PDF generation timeout',
          message: 'PDF service took too long to respond. Please try again.',
          details: 'Service may be cold-starting (free tier)'
        }, { status: 504 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to generate PDF',
        message: 'PDF generation service unavailable. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Service unavailable'
      }, { status: 503 });
    }

    // Upload to Firebase Storage
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = storageBucket ? adminStorage.bucket(storageBucket) : adminStorage.bucket();
    const fileName = `invoice_pdfs/${invoiceId}.pdf`;
    const file = bucket.file(fileName);

    // Upload the PDF
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      public: false, // Private, use signed URLs
    });

    console.log(`[PDF Generation] Uploaded to Storage: ${fileName}`);

    // Generate a signed URL (valid for 1 year)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Far future date (Firebase limit)
    });

    // Update Firestore with PDF URL
    await adminDb.collection(collectionName).doc(invoiceId).update({
      pdfUrl: signedUrl,
      pdfGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[PDF Generation] Updated Firestore with PDF URL for invoice: ${invoiceId}`);

    return NextResponse.json({
      success: true,
      pdfUrl: signedUrl,
      message: 'PDF generated and uploaded successfully',
    });

  } catch (error: any) {
    console.error('[PDF Generation] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

