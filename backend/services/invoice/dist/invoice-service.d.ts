import { PrismaClient } from '@prisma/client';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceType = 'USER' | 'BUSINESS';
export type PaymentMethod = 'PAYVOST' | 'MANUAL' | 'STRIPE' | 'RAPYD';
export interface CreateInvoiceInput {
    invoiceNumber: string;
    invoiceType: 'USER' | 'BUSINESS';
    userId: string;
    businessId?: string;
    createdBy: string;
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
export declare class InvoiceService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Calculate invoice totals
     */
    private calculateTotals;
    /**
     * Create a new invoice
     */
    createInvoice(input: CreateInvoiceInput): Promise<any>;
    /**
     * Get invoice by ID
     */
    getInvoiceById(id: string, userId?: string): Promise<any>;
    /**
     * Get all invoices for a user
     */
    getInvoicesByUserId(userId: string): Promise<any>;
    /**
     * Get invoice by invoice number
     */
    getInvoiceByNumber(invoiceNumber: string, userId?: string): Promise<any>;
    /**
     * Get public invoice (for public pages)
     * Checks Prisma (PostgreSQL), Firestore invoices collection, and Firestore businessInvoices collection
     */
    getPublicInvoice(idOrNumber: string): Promise<any>;
    /**
     * List invoices for a user
     */
    listUserInvoices(userId: string, options?: {
        status?: InvoiceStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        invoices: any;
        total: any;
    }>;
    /**
     * List business invoices
     */
    listBusinessInvoices(businessId: string, createdBy: string, options?: {
        status?: InvoiceStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        invoices: any;
        total: any;
    }>;
    /**
     * Update invoice
     */
    updateInvoice(id: string, userId: string, input: UpdateInvoiceInput): Promise<any>;
    /**
     * Mark invoice as paid
     * Handles both Prisma (PostgreSQL) and Firestore business invoices
     */
    markAsPaid(id: string, userId: string): Promise<any>;
    /**
     * Delete invoice
     */
    deleteInvoice(id: string, userId: string): Promise<boolean>;
    /**
     * Get invoice statistics
     */
    getInvoiceStats(userId: string): Promise<{
        total: number;
        pending: number;
        paid: number;
        overdue: number;
        totalOutstanding: number;
        totalPaid: number;
    }>;
}
//# sourceMappingURL=invoice-service.d.ts.map