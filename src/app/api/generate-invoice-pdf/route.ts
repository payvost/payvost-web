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

    // Generate PDF using existing PDF service
    // Try multiple PDF service endpoints
    const pdfServiceUrls = [
      process.env.PDF_SERVICE_URL,
      'http://localhost:3005', // Local Puppeteer service
      'https://us-central1-payvost.cloudfunctions.net/api2/download/invoice', // Cloud Functions (legacy)
    ].filter(Boolean);

    let pdfBuffer: Buffer | null = null;
    let lastError: Error | null = null;

    // Try each PDF service URL
    for (const baseUrl of pdfServiceUrls) {
      try {
        // Try different endpoint formats
        const endpoints = [
          `${baseUrl}/pdf?invoiceId=${invoiceId}`, // React-PDF service format
          `${baseUrl}/invoice/${invoiceId}`, // Alternative format
        ];
        
        for (const pdfUrl of endpoints) {
          try {
            console.log(`[PDF Generation] Trying PDF service: ${pdfUrl}`);
            
            const pdfResponse = await fetch(pdfUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/pdf',
              },
            });

            if (pdfResponse.ok) {
              const arrayBuffer = await pdfResponse.arrayBuffer();
              pdfBuffer = Buffer.from(arrayBuffer);
              console.log(`[PDF Generation] Generated via PDF service, size: ${pdfBuffer.length} bytes`);
              break;
            }
          } catch (err: any) {
            console.warn(`[PDF Generation] Endpoint failed (${pdfUrl}): ${err.message}`);
            continue;
          }
        }
        
        if (pdfBuffer) break;
        
      } catch (error: any) {
        console.warn(`[PDF Generation] PDF service failed (${baseUrl}): ${error.message}`);
        lastError = error;
        continue;
      }
    }

    if (!pdfBuffer) {
      return NextResponse.json({ 
        error: 'PDF generation service unavailable',
        message: 'All PDF services failed. Please ensure a PDF service is running.',
        details: lastError?.message
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

