import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import admin from 'firebase-admin';

// Define enum types locally to avoid Prisma import issues during build
export type InvoiceStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceType = 
  | 'USER'
  | 'BUSINESS';

export type PaymentMethod = 
  | 'PAYVOST'
  | 'MANUAL'
  | 'STRIPE'
  | 'RAPYD';

export interface CreateInvoiceInput {
  invoiceNumber: string;
  invoiceType: 'USER' | 'BUSINESS';
  userId: string;
  businessId?: string;
  createdBy: string; // Firebase UID
  issueDate: Date;
  dueDate: Date;
  currency: string;
  fromInfo: {
    name: string;
    address: string;
    email?: string;
    phone?: string;
  };
  toInfo: {
    name: string;
    address: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  taxRate?: number;
  notes?: string;
  paymentMethod: 'PAYVOST' | 'MANUAL' | 'STRIPE' | 'RAPYD';
  manualBankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    otherDetails?: string;
  };
  status?: 'DRAFT' | 'PENDING';
}

export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  issueDate?: Date;
  dueDate?: Date;
  status?: InvoiceStatus;
  fromInfo?: any;
  toInfo?: any;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  taxRate?: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
  manualBankDetails?: any;
  pdfUrl?: string;
  publicUrl?: string;
}

export class InvoiceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate invoice totals
   */
  private calculateTotals(
    items: Array<{ quantity: number; price: number }>,
    taxRate: number = 0
  ): { subtotal: number; taxAmount: number; grandTotal: number } {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    return { subtotal, taxAmount, grandTotal };
  }

  /**
   * Trigger PDF regeneration (async, non-blocking)
   * Triggers the PDF generation by calling the frontend API
   * Falls back to direct regeneration if frontend is unavailable
   */
  private async triggerPdfRegeneration(invoiceId: string, source: string): Promise<void> {
    try {
      // Try to get the frontend URL from environment
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
      
      // If no base URL set, log and skip PDF regeneration
      if (!baseUrl) {
        console.warn(`[triggerPdfRegeneration] No NEXT_PUBLIC_BASE_URL or BASE_URL set, skipping PDF regeneration for ${invoiceId}`);
        return;
      }

      const pdfGenerationUrl = `${baseUrl}/api/generate-invoice-pdf`;
      
      console.log(`[triggerPdfRegeneration] Triggering PDF regeneration for invoice ${invoiceId} (source: ${source}) via ${pdfGenerationUrl}`);
      
      const response = await fetch(pdfGenerationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
        signal: AbortSignal.timeout(120000), // 2 minutes timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[triggerPdfRegeneration] PDF generation returned ${response.status}: ${errorText}`);
      } else {
        console.log(`[triggerPdfRegeneration] PDF regeneration triggered successfully for invoice ${invoiceId}`);
      }
    } catch (error: any) {
      console.warn(`[triggerPdfRegeneration] Warning triggering PDF regeneration for invoice ${invoiceId}:`, error?.message);
      // Don't throw - this is async and non-blocking
      // In production, PDFs can be regenerated on-demand when downloaded
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(input: CreateInvoiceInput) {
    const { items, taxRate = 0, status = 'DRAFT', paymentMethod, ...rest } = input;
    
    // Calculate totals
    const { grandTotal } = this.calculateTotals(items, taxRate);
    
    // Generate public URL if not draft
    const isPublic = status !== 'DRAFT';
    const publicUrl = isPublic 
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invoice/${input.invoiceNumber}`
      : null;

    const invoice = await this.prisma.invoice.create({
      data: {
        ...rest,
        invoiceType: input.invoiceType as InvoiceType,
        // Ensure the value matches the Prisma enum type
        paymentMethod: (paymentMethod || 'PAYVOST') as any,
        status: status as InvoiceStatus,
        grandTotal: new Decimal(grandTotal),
        taxRate: new Decimal(taxRate),
        fromInfo: input.fromInfo as any,
        toInfo: input.toInfo as any,
        items: items as any,
        manualBankDetails: input.manualBankDetails as any,
        notes: input.notes,
        isPublic,
        publicUrl,
      },
    });
  
    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) return null;

    // Check access permissions
    if (!invoice.isPublic && invoice.userId !== userId && invoice.createdBy !== userId) {
      return null;
    }

    return invoice;
  }

  /**
   * Get all invoices for a user
   */
  async getInvoicesByUserId(userId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        OR: [
          { userId },
          { createdBy: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices;
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (!invoice) return null;

    // Check access permissions
    if (!invoice.isPublic && invoice.userId !== userId && invoice.createdBy !== userId) {
      return null;
    }

    return invoice;
  }

  /**
   * Get public invoice (for public pages)
   * Checks Prisma (PostgreSQL), Firestore invoices collection, and Firestore businessInvoices collection
   */
  async getPublicInvoice(idOrNumber: string) {
    // Try Prisma first (for migrated invoices)
    let invoice = await this.prisma.invoice.findUnique({
      where: { id: idOrNumber },
    });

    // If not found, try by invoice number
    if (!invoice) {
      invoice = await this.prisma.invoice.findUnique({
        where: { invoiceNumber: idOrNumber },
      });
    }

    // If found in Prisma, check if public
    if (invoice) {
      if (!invoice.isPublic) {
        return null;
      }
      return invoice;
    }

    // If not in Prisma, check Firestore collections (both invoices and businessInvoices)
    try {
      // Check if Firebase Admin is initialized
      if (!admin.apps.length) {
        console.error('Firebase Admin not initialized');
        throw new Error('Firebase Admin SDK not initialized');
      }

      const db = admin.firestore();
      if (!db) {
        console.error('Firestore database not available');
        throw new Error('Firestore database not available');
      }

      let firestoreInvoice: admin.firestore.DocumentSnapshot | null = null;
      let isBusinessInvoice = false;

      // Helper function to convert Firestore invoice to Prisma format
      const convertFirestoreInvoice = (invoiceDoc: admin.firestore.DocumentSnapshot, isBusiness: boolean) => {
        const data = invoiceDoc.data();
        
        if (!data) {
          console.warn('Firestore invoice document exists but has no data');
          return null;
        }
        
        // Check if invoice is public
        if (isBusiness) {
          // Business invoices: check if draft
          const isDraft = data?.status === 'Draft';
          if (isDraft) {
            return null;
          }
        } else {
          // Regular invoices: check isPublic flag
          if (data?.isPublic !== true) {
            return null;
          }
        }

        // Helper to safely convert Firestore Timestamp to Date
        const toDate = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            return new Date(timestamp);
          }
          return new Date();
        };

        if (isBusiness) {
          // Convert business invoice format
          return {
            id: invoiceDoc.id,
            invoiceNumber: data?.invoiceNumber || '',
            invoiceType: 'BUSINESS' as const,
            userId: data?.createdBy || '',
            businessId: data?.businessId || null,
            createdBy: data?.createdBy || '',
            issueDate: toDate(data?.issueDate),
            dueDate: toDate(data?.dueDate),
            status: (data?.status?.toUpperCase() || 'PENDING') as any,
            currency: data?.currency || 'USD',
            grandTotal: new Decimal(Number(data?.grandTotal || 0)),
            taxRate: new Decimal(Number(data?.taxRate || 0)),
            fromInfo: {
              name: data?.fromName || '',
              address: data?.fromAddress || '',
              email: data?.fromEmail || '',
            },
            toInfo: {
              name: data?.toName || '',
              address: data?.toAddress || '',
              email: data?.toEmail || '',
            },
            items: Array.isArray(data?.items) ? data.items : [],
            paymentMethod: (data?.paymentMethod?.toUpperCase() || 'PAYVOST') as any,
            manualBankDetails: data?.paymentMethod === 'manual' ? {
              bankName: data?.manualBankName || '',
              accountName: data?.manualAccountName || '',
              accountNumber: data?.manualAccountNumber || '',
              otherDetails: data?.manualOtherDetails || '',
            } : null,
            notes: data?.notes || null,
            isPublic: data?.isPublic !== false,
            publicUrl: data?.publicUrl || null,
            pdfUrl: data?.pdfUrl || null,
            createdAt: toDate(data?.createdAt),
            updatedAt: toDate(data?.updatedAt),
          };
        } else {
          // Convert regular invoice format
          return {
            id: invoiceDoc.id,
            invoiceNumber: data?.invoiceNumber || '',
            invoiceType: 'USER' as const,
            userId: data?.userId || '',
            businessId: null,
            createdBy: data?.userId || '',
            issueDate: toDate(data?.issueDate),
            dueDate: toDate(data?.dueDate),
            status: (data?.status?.toUpperCase() || 'PENDING') as any,
            currency: data?.currency || 'USD',
            grandTotal: new Decimal(Number(data?.grandTotal || 0)),
            taxRate: new Decimal(Number(data?.taxRate || 0)),
            fromInfo: {
              name: data?.fromName || '',
              address: data?.fromAddress || '',
              email: data?.fromEmail || '',
            },
            toInfo: {
              name: data?.toName || '',
              address: data?.toAddress || '',
              email: data?.toEmail || '',
            },
            items: Array.isArray(data?.items) ? data.items : [],
            paymentMethod: (data?.paymentMethod?.toUpperCase() || 'PAYVOST') as any,
            manualBankDetails: data?.paymentMethod === 'manual' ? {
              bankName: data?.manualBankName || '',
              accountName: data?.manualAccountName || '',
              accountNumber: data?.manualAccountNumber || '',
              otherDetails: data?.manualOtherDetails || '',
            } : null,
            notes: data?.notes || null,
            isPublic: data?.isPublic === true,
            publicUrl: data?.publicUrl || null,
            pdfUrl: data?.pdfUrl || null,
            createdAt: toDate(data?.createdAt),
            updatedAt: toDate(data?.updatedAt),
          };
        }
      };

      // First, try regular invoices collection
      let docRef = db.collection('invoices').doc(idOrNumber);
      firestoreInvoice = await docRef.get();

      // If not found by ID, try querying by invoiceNumber in invoices collection
      if (!firestoreInvoice.exists) {
        const querySnapshot = await db.collection('invoices')
          .where('invoiceNumber', '==', idOrNumber)
          .limit(1)
          .get();
        
        if (!querySnapshot.empty) {
          firestoreInvoice = querySnapshot.docs[0];
          isBusinessInvoice = false;
        }
      } else {
        isBusinessInvoice = false;
      }

      // If not found in invoices collection, try businessInvoices collection
      if (!firestoreInvoice || !firestoreInvoice.exists) {
        docRef = db.collection('businessInvoices').doc(idOrNumber);
        firestoreInvoice = await docRef.get();
        
        if (!firestoreInvoice.exists) {
          const querySnapshot = await db.collection('businessInvoices')
            .where('invoiceNumber', '==', idOrNumber)
            .limit(1)
            .get();
          
          if (!querySnapshot.empty) {
            firestoreInvoice = querySnapshot.docs[0];
            isBusinessInvoice = true;
          }
        } else {
          isBusinessInvoice = true;
        }
      }

      if (firestoreInvoice && firestoreInvoice.exists) {
        const converted = convertFirestoreInvoice(firestoreInvoice, isBusinessInvoice);
        if (converted) {
          return converted;
        }
      }
    } catch (error) {
      console.error('Error fetching invoice from Firestore:', error);
      console.error('Error details:', error instanceof Error ? error.stack : String(error));
      console.error('Invoice ID/Number:', idOrNumber);
      // Re-throw the error so the route handler can catch it and return proper error
      throw error;
    }

    return null;
  }

  /**
   * List invoices for a user
   */
  async listUserInvoices(
    userId: string,
    options?: {
      status?: InvoiceStatus;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = {
      OR: [
        { userId },
        { createdBy: userId },
      ],
    };

    if (options?.status) {
      where.status = options.status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  /**
   * List business invoices
   */
  async listBusinessInvoices(
    businessId: string,
    createdBy: string,
    options?: {
      status?: InvoiceStatus;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = {
      businessId,
      createdBy,
      invoiceType: 'BUSINESS',
    };

    if (options?.status) {
      where.status = options.status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  /**
   * Update invoice
   */
  async updateInvoice(
    id: string,
    userId: string,
    input: UpdateInvoiceInput
  ) {
    // Verify ownership
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    if (existing.userId !== userId && existing.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    // Recalculate totals if items changed
    let grandTotal = existing.grandTotal;
    if (input.items) {
      const taxRate = input.taxRate !== undefined 
        ? Number(input.taxRate) 
        : Number(existing.taxRate);
      const { grandTotal: newTotal } = this.calculateTotals(input.items, taxRate);
      grandTotal = new Decimal(newTotal);
    }

    // Update public URL if status changed
    let isPublic = existing.isPublic;
    let publicUrl = existing.publicUrl;
    if (input.status && input.status !== 'DRAFT') {
      isPublic = true;
      publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invoice/${existing.invoiceNumber}`;
    } else if (input.status === 'DRAFT') {
      isPublic = false;
      publicUrl = null;
    }

    // Build update data object explicitly to avoid type issues
    const updateData: any = {
      grandTotal,
      isPublic,
      publicUrl,
      updatedAt: new Date(),
    };

    // Only include fields that are provided in input
    if (input.invoiceNumber !== undefined) updateData.invoiceNumber = input.invoiceNumber;
    if (input.issueDate !== undefined) updateData.issueDate = input.issueDate;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.fromInfo !== undefined) updateData.fromInfo = input.fromInfo;
    if (input.toInfo !== undefined) updateData.toInfo = input.toInfo;
    if (input.items !== undefined) updateData.items = input.items;
    if (input.taxRate !== undefined) updateData.taxRate = new Decimal(Number(input.taxRate));
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;
    if (input.manualBankDetails !== undefined) updateData.manualBankDetails = input.manualBankDetails;
    if (input.pdfUrl !== undefined) updateData.pdfUrl = input.pdfUrl;
    if (input.publicUrl !== undefined) updateData.publicUrl = input.publicUrl;

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return invoice;
  }

  /**
   * Mark invoice as paid
   * Handles both Prisma (PostgreSQL) and Firestore business invoices
   */
  async markAsPaid(id: string, userId: string) {
    // Try Prisma first
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (existing) {
      // Verify ownership
      if (existing.userId !== userId && existing.createdBy !== userId) {
        throw new Error('Unauthorized');
      }

      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Trigger PDF regeneration (async, non-blocking) to update status in PDF
      this.triggerPdfRegeneration(id, 'Prisma').catch(error => {
        console.error('[markAsPaid] Failed to trigger PDF regeneration:', error);
        // Don't throw - mark as paid succeeded, PDF regeneration is async
      });

      return invoice;
    }

    // If not in Prisma, check Firestore businessInvoices collection
    try {
      if (!admin.apps.length) {
        console.error('[markAsPaid] Firebase Admin SDK not initialized');
        throw new Error('Firebase Admin SDK not initialized');
      }

      const db = admin.firestore();
      const docRef = db.collection('businessInvoices').doc(id);
      const firestoreInvoice = await docRef.get();

      if (!firestoreInvoice.exists) {
        console.error(`[markAsPaid] Invoice not found in businessInvoices collection: ${id}`);
        // Try to find by invoiceNumber as fallback
        const querySnapshot = await db.collection('businessInvoices')
          .where('invoiceNumber', '==', id)
          .limit(1)
          .get();
        
        if (querySnapshot.empty) {
        throw new Error('Invoice not found');
        }
        
        // Use the found invoice
        const foundDoc = querySnapshot.docs[0];
        const foundData = foundDoc.data();
        
        if (!foundData) {
          throw new Error('Invoice data not found');
        }

        // Verify ownership
        if (foundData.createdBy !== userId) {
          console.error(`[markAsPaid] Unauthorized: userId=${userId}, invoice.createdBy=${foundData.createdBy}`);
          throw new Error('Unauthorized');
        }

        // Update using the found document reference
        const foundDocRef = foundDoc.ref;
        await foundDocRef.update({
          status: 'Paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Trigger PDF regeneration (async, non-blocking)
        this.triggerPdfRegeneration(id, 'Firestore').catch(error => {
          console.error('[markAsPaid] Failed to trigger PDF regeneration:', error);
          // Don't throw - mark as paid succeeded, PDF regeneration is async
        });

        // Return updated data
        const updatedDoc = await foundDocRef.get();
        const updatedData = updatedDoc.data();
        
        if (!updatedData) {
          throw new Error('Invoice data not found after update');
        }

        // Helper to safely convert Firestore Timestamp to Date
        const toDate = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          if (timestamp instanceof Date) {
            return timestamp;
          }
          if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            return new Date(timestamp);
          }
          return new Date();
        };

        try {
          const result = {
            id: updatedDoc.id,
            invoiceNumber: updatedData?.invoiceNumber || '',
            invoiceType: 'BUSINESS' as const,
            userId: updatedData?.createdBy || '',
            businessId: updatedData?.businessId || null,
            createdBy: updatedData?.createdBy || '',
            issueDate: toDate(updatedData?.issueDate),
            dueDate: toDate(updatedData?.dueDate),
            status: 'PAID' as any,
            currency: updatedData?.currency || 'USD',
            grandTotal: new Decimal(Number(updatedData?.grandTotal || 0)),
            taxRate: new Decimal(Number(updatedData?.taxRate || 0)),
            fromInfo: {
              name: updatedData?.fromName || '',
              address: updatedData?.fromAddress || '',
              email: updatedData?.fromEmail || '',
            },
            toInfo: {
              name: updatedData?.toName || '',
              address: updatedData?.toAddress || '',
              email: updatedData?.toEmail || '',
            },
            items: Array.isArray(updatedData?.items) ? updatedData.items : [],
            paymentMethod: (updatedData?.paymentMethod?.toUpperCase() || 'PAYVOST') as any,
            manualBankDetails: updatedData?.paymentMethod === 'manual' ? {
              bankName: updatedData?.manualBankName || '',
              accountName: updatedData?.manualAccountName || '',
              accountNumber: updatedData?.manualAccountNumber || '',
              otherDetails: updatedData?.manualOtherDetails || '',
            } : null,
            notes: updatedData?.notes || null,
            isPublic: updatedData?.isPublic !== false,
            publicUrl: updatedData?.publicUrl || null,
            pdfUrl: updatedData?.pdfUrl || null,
            paidAt: toDate(updatedData?.paidAt),
            createdAt: toDate(updatedData?.createdAt),
            updatedAt: toDate(updatedData?.updatedAt),
          };
          console.log('[markAsPaid] Successfully built return object (fallback path) for invoice:', updatedDoc.id);
          return result;
        } catch (buildError: any) {
          console.error('[markAsPaid] Error building return object (fallback path):', buildError);
          console.error('[markAsPaid] Build error stack:', buildError?.stack);
          throw new Error(`Failed to build invoice response: ${buildError?.message || 'Unknown error'}`);
        }
      }

      const data = firestoreInvoice.data();
      if (!data) {
        console.error(`[markAsPaid] Invoice document exists but has no data: ${id}`);
        throw new Error('Invoice data not found');
      }

      // Verify ownership
      if (data.createdBy !== userId) {
        console.error(`[markAsPaid] Unauthorized: userId=${userId}, invoice.createdBy=${data.createdBy}`);
        throw new Error('Unauthorized');
      }

      // Helper to safely convert Firestore Timestamp to Date
      const toDate = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();
        }
        if (timestamp instanceof Date) {
          return timestamp;
        }
        if (typeof timestamp === 'string' || typeof timestamp === 'number') {
          return new Date(timestamp);
        }
        return new Date();
      };

      // Update in Firestore
      try {
      await docRef.update({
        status: 'Paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      } catch (updateError: any) {
        console.error('[markAsPaid] Firestore update error:', updateError);
        console.error('[markAsPaid] Update error code:', updateError?.code);
        console.error('[markAsPaid] Update error message:', updateError?.message);
        throw new Error(`Failed to update invoice in Firestore: ${updateError?.message || 'Unknown error'}`);
      }

      // Trigger PDF regeneration (async, non-blocking)
      this.triggerPdfRegeneration(id, 'Firestore').catch(error => {
        console.error('[markAsPaid] Failed to trigger PDF regeneration:', error);
        // Don't throw - mark as paid succeeded, PDF regeneration is async
      });

      // Return updated data in Prisma format for consistency
      // Note: serverTimestamp() values are resolved when reading the document
      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data();
      
      if (!updatedData) {
        console.error('[markAsPaid] Invoice data not found after update, document ID:', updatedDoc.id);
        throw new Error('Invoice data not found after update');
      }
      
      try {
        // Build the return object with proper error handling
        const result = {
        id: updatedDoc.id,
        invoiceNumber: updatedData?.invoiceNumber || '',
        invoiceType: 'BUSINESS' as const,
        userId: updatedData?.createdBy || '',
        businessId: updatedData?.businessId || null,
        createdBy: updatedData?.createdBy || '',
          issueDate: toDate(updatedData?.issueDate),
          dueDate: toDate(updatedData?.dueDate),
        status: 'PAID' as any,
        currency: updatedData?.currency || 'USD',
        grandTotal: new Decimal(Number(updatedData?.grandTotal || 0)),
        taxRate: new Decimal(Number(updatedData?.taxRate || 0)),
        fromInfo: {
          name: updatedData?.fromName || '',
          address: updatedData?.fromAddress || '',
          email: updatedData?.fromEmail || '',
        },
        toInfo: {
          name: updatedData?.toName || '',
          address: updatedData?.toAddress || '',
          email: updatedData?.toEmail || '',
        },
        items: Array.isArray(updatedData?.items) ? updatedData.items : [],
        paymentMethod: (updatedData?.paymentMethod?.toUpperCase() || 'PAYVOST') as any,
        manualBankDetails: updatedData?.paymentMethod === 'manual' ? {
          bankName: updatedData?.manualBankName || '',
          accountName: updatedData?.manualAccountName || '',
          accountNumber: updatedData?.manualAccountNumber || '',
          otherDetails: updatedData?.manualOtherDetails || '',
        } : null,
        notes: updatedData?.notes || null,
        isPublic: updatedData?.isPublic !== false,
        publicUrl: updatedData?.publicUrl || null,
        pdfUrl: updatedData?.pdfUrl || null,
          paidAt: toDate(updatedData?.paidAt),
          createdAt: toDate(updatedData?.createdAt),
          updatedAt: toDate(updatedData?.updatedAt),
        };
        
        console.log('[markAsPaid] Successfully built return object for invoice:', updatedDoc.id);
        return result;
      } catch (buildError: any) {
        console.error('[markAsPaid] Error building return object:', buildError);
        console.error('[markAsPaid] Build error stack:', buildError?.stack);
        console.error('[markAsPaid] Updated data keys:', Object.keys(updatedData || {}));
        throw new Error(`Failed to build invoice response: ${buildError?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('[markAsPaid] Error marking Firestore invoice as paid:', error);
      console.error('[markAsPaid] Invoice ID:', id);
      console.error('[markAsPaid] User ID:', userId);
      console.error('[markAsPaid] Error message:', error?.message);
      console.error('[markAsPaid] Error stack:', error?.stack);
      throw error;
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string, userId: string): Promise<boolean> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.userId !== userId && invoice.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.invoice.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(userId: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    totalOutstanding: number;
    totalPaid: number;
  }> {
    const where = {
      OR: [
        { userId },
        { createdBy: userId },
      ],
    };

    const [total, pending, paid, overdue, allInvoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
      this.prisma.invoice.findMany({
        where,
        select: { status: true, grandTotal: true },
      }),
    ]);

    const totalOutstanding = allInvoices
      .filter((inv: any) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + Number(inv.grandTotal), 0);

    const totalPaid = allInvoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + Number(inv.grandTotal), 0);

    return {
      total,
      pending,
      paid,
      overdue,
      totalOutstanding,
      totalPaid,
    };
  }
}

