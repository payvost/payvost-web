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

    // Normalize Firestore timestamps to Date objects
    const normalizeInvoice = (data: any) => {
      const normalizeDate = (date: any) => {
        if (!date) return null;
        if (date.toDate) return date.toDate();
        if (date._seconds) return new Date(date._seconds * 1000);
        if (typeof date === 'string') return new Date(date);
        return date;
      };

      return {
        ...data,
        id: invoiceDoc.id,
        invoiceNumber: data.invoiceNumber || id,
        issueDate: normalizeDate(data.issueDate),
        dueDate: normalizeDate(data.dueDate),
        createdAt: normalizeDate(data.createdAt),
        updatedAt: normalizeDate(data.updatedAt),
        paidAt: data.paidAt ? normalizeDate(data.paidAt) : null,
        // Handle both old format (toName, fromName) and new format (toInfo, fromInfo)
        toName: data.toInfo?.name || data.toName,
        toEmail: data.toInfo?.email || data.toEmail,
        toAddress: data.toInfo?.address || data.toAddress,
        fromName: data.fromInfo?.name || data.fromName,
        fromAddress: data.fromInfo?.address || data.fromAddress,
        fromEmail: data.fromInfo?.email || data.fromEmail,
        items: data.items || [],
        status: data.status || 'Pending',
        currency: data.currency || 'USD',
        grandTotal: data.grandTotal || 0,
        taxRate: data.taxRate || 0,
        tax: data.tax || 0,
        discount: data.discount || 0,
        notes: data.notes || '',
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

    // Generate PDF using React-PDF
    const invoiceDocElement = React.createElement(InvoiceDocument, { 
      invoice: normalizedInvoice 
    });
    
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

  } catch (error: any) {
    console.error('[PDF] Generation failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

