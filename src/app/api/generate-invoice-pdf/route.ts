import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
    const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'https://payvost-pdf-generator-45c7.onrender.com';
    console.log(`[PDF Generation] Generating PDF via Render service for invoice: ${invoiceId}`);
    
    let pdfBuffer: Buffer;
    
    try {
      // Normalize invoice data for PDF
      const normalizeInvoiceData = (data: any) => {
        // Convert Firestore Timestamps to ISO strings
        const normalizeDate = (date: any): string | null => {
          if (!date) return null;
          try {
            let dateObj: Date;
            if (date && typeof date.toDate === 'function') {
              dateObj = date.toDate();
            } else if (date && date._seconds) {
              dateObj = new Date(date._seconds * 1000);
            } else if (typeof date === 'string') {
              dateObj = new Date(date);
            } else if (date instanceof Date) {
              dateObj = date;
            } else {
              dateObj = new Date(date);
            }
            if (isNaN(dateObj.getTime())) return null;
            return dateObj.toISOString();
          } catch (e) {
            return null;
          }
        };

        const normalizeItems = (items: any) => {
          if (!Array.isArray(items)) return [];
          return items.map((item: any) => ({
            description: String(item.description || item.name || 'Item'),
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
          }));
        };

        const toName = data.toInfo?.name || data.toName || '';
        const toEmail = data.toInfo?.email || data.toEmail || '';
        const toAddress = data.toInfo?.address || data.toAddress || '';
        const fromName = data.fromInfo?.name || data.fromName || '';
        const fromAddress = data.fromInfo?.address || data.fromAddress || '';
        const fromEmail = data.fromInfo?.email || data.fromEmail || '';

        return {
          id: String(invoiceId),
          invoiceNumber: String(data.invoiceNumber || invoiceId),
          issueDate: normalizeDate(data.issueDate),
          dueDate: normalizeDate(data.dueDate),
          createdAt: normalizeDate(data.createdAt),
          updatedAt: normalizeDate(data.updatedAt),
          paidAt: data.paidAt ? normalizeDate(data.paidAt) : null,
          toName: String(toName),
          toEmail: String(toEmail),
          toAddress: String(toAddress),
          fromName: String(fromName),
          fromAddress: String(fromAddress),
          fromEmail: String(fromEmail),
          items: normalizeItems(data.items),
          status: String(data.status || 'Pending'),
          currency: String(data.currency || 'USD'),
          grandTotal: Number(data.grandTotal) || 0,
          taxRate: Number(data.taxRate) || 0,
          tax: Number(data.tax) || 0,
          discount: Number(data.discount) || 0,
          notes: String(data.notes || ''),
          description: String(data.description || ''),
          amount: Number(data.amount) || 0,
        };
      };

      const normalizedInvoice = normalizeInvoiceData(invoiceData);

      // Send invoice data to Render service via POST (more efficient)
      const pdfUrl = `${pdfServiceUrl}/pdf`;
      console.log(`[PDF Generation] Calling PDF service: ${pdfUrl}`);
      
      const pdfResponse = await fetch(pdfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({
          invoiceData: normalizedInvoice,
          invoiceId: invoiceId,
        }),
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

    // ✅ DON'T generate signed URL - serve through API instead
    // This keeps storage bucket URL hidden and allows access control
    // PDFs are served via /api/pdf/invoice/[id] which handles access control

    // Update Firestore to indicate PDF is ready (no signed URL stored)
    await adminDb.collection(collectionName).doc(invoiceId).update({
      pdfGeneratedAt: FieldValue.serverTimestamp(),
      pdfReady: true, // Flag to indicate PDF is ready
      // Don't store signed URL - serve through /api/pdf/invoice/[id] instead
    });

    console.log(`[PDF Generation] Updated Firestore - PDF ready for invoice: ${invoiceId} (served via API)`);

    return NextResponse.json({
      success: true,
      message: 'PDF generated and uploaded successfully',
      // Don't return signed URL - client should use /api/pdf/invoice/[id]
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

