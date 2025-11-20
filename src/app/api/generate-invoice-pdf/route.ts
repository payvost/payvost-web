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

    // Generate PDF directly using React-PDF in Vercel serverless function
    console.log(`[PDF Generation] Generating PDF directly in Vercel for invoice: ${invoiceId}`);
    
    let pdfBuffer: Buffer;
    
    try {
      // Import React-PDF dynamically to avoid build issues
      const React = await import('react');
      const { renderToStream } = await import('@react-pdf/renderer');
      const { InvoicePDFWrapper } = await import('@/lib/pdf/InvoicePDFWrapper');
      
      // Normalize invoice data for PDF
      const normalizeInvoice = (data: any) => {
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

      const normalizedInvoice = normalizeInvoice(invoiceData);

      // Calculate tax if not present
      if (!normalizedInvoice.tax && normalizedInvoice.taxRate) {
        const subtotal = normalizedInvoice.items.reduce((acc: number, item: any) =>
          acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0
        );
        normalizedInvoice.tax = subtotal * (Number(normalizedInvoice.taxRate) / 100);
      }

      // Sanitize data
      const sanitizedInvoice = JSON.parse(JSON.stringify(normalizedInvoice));

      console.log('[PDF Generation] Creating React element...');
      
      // Create React element using JSX
      const invoiceElement = React.createElement(InvoicePDFWrapper, {
        invoice: sanitizedInvoice
      });

      console.log('[PDF Generation] Rendering to stream...');
      
      // Render to stream
      const stream = await renderToStream(invoiceElement);

      // Collect chunks into buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      pdfBuffer = Buffer.concat(chunks);

      console.log(`[PDF Generation] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      
    } catch (error: any) {
      console.error('[PDF Generation] React-PDF error:', error);
      console.error('[PDF Generation] Error stack:', error.stack);
      return NextResponse.json({ 
        error: 'Failed to generate PDF',
        message: 'PDF generation failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }, { status: 500 });
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

