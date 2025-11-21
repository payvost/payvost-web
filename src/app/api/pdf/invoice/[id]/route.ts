import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

// This route returns a signed URL for the pre-generated PDF
// If PDF doesn't exist, triggers generation

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
    
    if (!invoiceDoc.exists) {
      invoiceDoc = await adminDb.collection('businessInvoices').doc(id).get();
    }

    if (!invoiceDoc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoiceDoc.data();

    // Check if PDF URL exists in Firestore
    if (invoiceData?.pdfUrl) {
      console.log(`[PDF Download] Found existing PDF URL for invoice: ${id}`);
      
      // Return redirect to the signed URL
      return NextResponse.redirect(invoiceData.pdfUrl, { status: 302 });
    }

    // PDF doesn't exist - trigger generation and wait
    console.log(`[PDF Download] PDF not found, triggering generation for invoice: ${id}`);
    
    try {
      // Trigger PDF generation and wait for it (synchronous wait up to 30s)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
      
      console.log(`[PDF Download] Calling PDF generation API: ${baseUrl}/api/generate-invoice-pdf`);
      
      const generateResponse = await fetch(`${baseUrl}/api/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text().catch(() => 'Unknown error');
        console.error(`[PDF Download] PDF generation failed: ${generateResponse.status} - ${errorText}`);
        throw new Error(`PDF generation failed: ${errorText}`);
      }

      // Wait a bit for Storage upload to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if PDF exists in Storage now
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      const bucket = storageBucket ? adminStorage.bucket(storageBucket) : adminStorage.bucket();
      const fileName = `invoice_pdfs/${id}.pdf`;
      const file = bucket.file(fileName);
      
      const [exists] = await file.exists();
      
      if (exists) {
        // Generate signed URL
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        
        // Update Firestore
        await invoiceDoc.ref.update({ pdfUrl: signedUrl });
        
        console.log(`[PDF Download] PDF generated successfully, redirecting to: ${signedUrl}`);
        return NextResponse.redirect(signedUrl, { status: 302 });
      }

      // Check Firestore for updated pdfUrl (may have been set by generation)
      const updatedDoc = await invoiceDoc.ref.get();
      const updatedData = updatedDoc.data();
      
      if (updatedData?.pdfUrl) {
        console.log(`[PDF Download] Found PDF URL in Firestore: ${updatedData.pdfUrl}`);
        return NextResponse.redirect(updatedData.pdfUrl, { status: 302 });
      }

      // PDF doesn't exist yet - return error with retry suggestion
      return NextResponse.json({
        error: 'PDF generation in progress',
        message: 'PDF is being generated. Please try again in a few seconds.',
        retryAfter: 5,
      }, { 
        status: 202, // Accepted - processing
        headers: {
          'Retry-After': '5',
        },
      });

    } catch (error: any) {
      console.error('[PDF Download] Error checking/generating PDF:', error);
      return NextResponse.json({
        error: 'Failed to generate PDF',
        details: error.message,
      }, { status: 500 });
    }

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
