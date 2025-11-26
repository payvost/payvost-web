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
   * Create a new invoice
   */
  async createInvoice(input: CreateInvoiceInput) {
    const { items, taxRate = 0, status = 'DRAFT', ...rest } = input;
    
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
        paymentMethod: input.paymentMethod as PaymentMethod,
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
   * Checks both Prisma (PostgreSQL) and Firestore (businessInvoices collection)
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

    // If not in Prisma, check Firestore businessInvoices collection
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

      // Try by document ID first
      const docRef = db.collection('businessInvoices').doc(idOrNumber);
      firestoreInvoice = await docRef.get();

      // If not found, try querying by invoiceNumber
      if (!firestoreInvoice.exists) {
        const querySnapshot = await db.collection('businessInvoices')
          .where('invoiceNumber', '==', idOrNumber)
          .limit(1)
          .get();
        
        if (!querySnapshot.empty) {
          firestoreInvoice = querySnapshot.docs[0];
        }
      }

      if (firestoreInvoice && firestoreInvoice.exists) {
        const data = firestoreInvoice.data();
        
        if (!data) {
          console.warn('Firestore invoice document exists but has no data');
          return null;
        }
        
        // Check if invoice is public (not a draft)
        const isDraft = data?.status === 'Draft';
        if (isDraft) {
          return null;
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

        // Convert Firestore data to match Prisma format
        return {
          id: firestoreInvoice.id,
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

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...input,
        grandTotal,
        isPublic,
        publicUrl,
        updatedAt: new Date(),
      },
    });

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, userId: string) {
    // Verify ownership first
    const existing = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

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

    return invoice;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string, userId: string): Promise<void> {
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

