import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import InvoiceDocument from '@/lib/pdf/InvoiceDocument';

// Increase timeout for PDF generation (Vercel Pro allows up to 60s)
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    console.log(`[PDF] Generating PDF for invoice: ${id}`);

    // Try to fetch from invoices collection first
    let invoiceDoc = await adminDb.collection('invoices').doc(id).get();
    
    // If not found, try businessInvoices collection
    if (!invoiceDoc.exists) {
      invoiceDoc = await adminDb.collection('businessInvoices').doc(id).get();
    }

    if (!invoiceDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoiceData = invoiceDoc.data();
    
    // Check if invoice is public (for public access)
    if (!invoiceData?.isPublic) {
      // For non-public invoices, we could add auth check here
      // For now, we'll allow it if the request has proper auth
    }

    // Normalize Firestore timestamps to ISO strings (React-PDF works better with strings)
    const normalizeInvoice = (data: any) => {
      const normalizeDate = (date: any): string | null => {
        if (!date) return null;
        let dateObj: Date;
        try {
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

      // Ensure items are properly formatted
      const normalizeItems = (items: any) => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => ({
          description: String(item.description || item.name || 'Item'),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        }));
      };

      // Extract string values, handling both old and new formats
      const toName = data.toInfo?.name || data.toName || '';
      const toEmail = data.toInfo?.email || data.toEmail || '';
      const toAddress = data.toInfo?.address || data.toAddress || '';
      const fromName = data.fromInfo?.name || data.fromName || '';
      const fromAddress = data.fromInfo?.address || data.fromAddress || '';
      const fromEmail = data.fromInfo?.email || data.fromEmail || '';

      return {
        id: String(invoiceDoc.id),
        invoiceNumber: String(data.invoiceNumber || id),
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

    // Calculate tax if not provided
    if (!normalizedInvoice.tax && normalizedInvoice.taxRate) {
      const subtotal = normalizedInvoice.items.reduce((acc: number, item: any) => 
        acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0
      );
      normalizedInvoice.tax = subtotal * (Number(normalizedInvoice.taxRate) / 100);
    }

    // Validate normalized invoice data - ensure all values are primitives
    // Dates are already ISO strings from normalizeDate, so JSON serialization is safe
    const sanitizedInvoice = JSON.parse(JSON.stringify(normalizedInvoice));
    console.log('[PDF] Sanitized invoice data keys:', Object.keys(sanitizedInvoice));
    
    // Double-check: ensure all nested objects are plain objects (not Date instances)
    const finalInvoice = {
      ...sanitizedInvoice,
      items: sanitizedInvoice.items.map((item: any) => ({
        description: String(item.description || item.name || 'Item'),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      })),
    };

    // Log sample data for debugging
    console.log('[PDF] Final invoice sample:', {
      id: finalInvoice.id,
      invoiceNumber: finalInvoice.invoiceNumber,
      status: finalInvoice.status,
      itemsCount: finalInvoice.items?.length,
      firstItem: finalInvoice.items?.[0],
      issueDate: finalInvoice.issueDate,
      dueDate: finalInvoice.dueDate,
    });

    // Generate PDF using React-PDF
    // Use React.createElement to create the component element
    try {
      // Verify InvoiceDocument is a function
      if (typeof InvoiceDocument !== 'function') {
        throw new Error(`InvoiceDocument is not a function, got: ${typeof InvoiceDocument}`);
      }
      
      const invoiceDocElement = React.createElement(InvoiceDocument, { 
        invoice: finalInvoice 
      });
      
      if (!invoiceDocElement) {
        throw new Error('Failed to create React element for InvoiceDocument');
      }
      
      console.log('[PDF] Created React element, type:', typeof invoiceDocElement);
      console.log('[PDF] Rendering to stream...');
      
      // Use the imported renderToStream function
      const stream = await renderToStream(invoiceDocElement);

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const pdfBuffer = Buffer.concat(chunks);

      // Return PDF response
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (renderError: any) {
      console.error('[PDF] React-PDF render error:', renderError);
      console.error('[PDF] Error stack:', renderError.stack);
      console.error('[PDF] Error details:', JSON.stringify(renderError, Object.getOwnPropertyNames(renderError)));
      throw renderError; // Re-throw to preserve original error
    }

  } catch (error: any) {
    console.error('[PDF] Generation failed:', error);
    console.error('[PDF] Error stack:', error.stack);
    console.error('[PDF] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // In production, log full error but return sanitized message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : (error.message?.includes('React error #31') 
          ? 'PDF generation failed: Invalid data format' 
          : 'Internal server error');
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

