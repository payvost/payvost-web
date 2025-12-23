import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
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
    createInvoice(input: CreateInvoiceInput): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    }>;
    /**
     * Get invoice by ID
     */
    getInvoiceById(id: string, userId?: string): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    } | null>;
    /**
     * Get all invoices for a user
     */
    getInvoicesByUserId(userId: string): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    }[]>;
    /**
     * Get invoice by invoice number
     */
    getInvoiceByNumber(invoiceNumber: string, userId?: string): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    } | null>;
    /**
     * Get public invoice (for public pages)
     * Checks Prisma (PostgreSQL), Firestore invoices collection, and Firestore businessInvoices collection
     */
    getPublicInvoice(idOrNumber: string): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    } | {
        id: string;
        invoiceNumber: any;
        invoiceType: "BUSINESS";
        userId: any;
        businessId: any;
        createdBy: any;
        issueDate: Date;
        dueDate: Date;
        status: any;
        currency: any;
        grandTotal: Decimal;
        taxRate: Decimal;
        fromInfo: {
            name: any;
            address: any;
            email: any;
        };
        toInfo: {
            name: any;
            address: any;
            email: any;
        };
        items: any[];
        paymentMethod: any;
        manualBankDetails: {
            bankName: any;
            accountName: any;
            accountNumber: any;
            otherDetails: any;
        } | null;
        notes: any;
        isPublic: boolean;
        publicUrl: any;
        pdfUrl: any;
        createdAt: Date;
        updatedAt: Date;
    } | {
        id: string;
        invoiceNumber: any;
        invoiceType: "USER";
        userId: any;
        businessId: null;
        createdBy: any;
        issueDate: Date;
        dueDate: Date;
        status: any;
        currency: any;
        grandTotal: Decimal;
        taxRate: Decimal;
        fromInfo: {
            name: any;
            address: any;
            email: any;
        };
        toInfo: {
            name: any;
            address: any;
            email: any;
        };
        items: any[];
        paymentMethod: any;
        manualBankDetails: {
            bankName: any;
            accountName: any;
            accountNumber: any;
            otherDetails: any;
        } | null;
        notes: any;
        isPublic: boolean;
        publicUrl: any;
        pdfUrl: any;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    /**
     * List invoices for a user
     */
    listUserInvoices(userId: string, options?: {
        status?: InvoiceStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        invoices: {
            items: Prisma.JsonValue;
            taxRate: Prisma.Decimal;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            invoiceNumber: string;
            invoiceType: import(".prisma/client").$Enums.InvoiceType;
            userId: string;
            businessId: string | null;
            createdBy: string;
            issueDate: Date;
            dueDate: Date;
            currency: string;
            fromInfo: Prisma.JsonValue;
            toInfo: Prisma.JsonValue;
            notes: string | null;
            manualBankDetails: Prisma.JsonValue | null;
            grandTotal: Prisma.Decimal;
            id: string;
            isPublic: boolean;
            publicUrl: string | null;
            pdfUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            paidAt: Date | null;
        }[];
        total: number;
    }>;
    /**
     * List business invoices
     */
    listBusinessInvoices(businessId: string, createdBy: string, options?: {
        status?: InvoiceStatus;
        limit?: number;
        offset?: number;
    }): Promise<{
        invoices: {
            items: Prisma.JsonValue;
            taxRate: Prisma.Decimal;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
            invoiceNumber: string;
            invoiceType: import(".prisma/client").$Enums.InvoiceType;
            userId: string;
            businessId: string | null;
            createdBy: string;
            issueDate: Date;
            dueDate: Date;
            currency: string;
            fromInfo: Prisma.JsonValue;
            toInfo: Prisma.JsonValue;
            notes: string | null;
            manualBankDetails: Prisma.JsonValue | null;
            grandTotal: Prisma.Decimal;
            id: string;
            isPublic: boolean;
            publicUrl: string | null;
            pdfUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            paidAt: Date | null;
        }[];
        total: number;
    }>;
    /**
     * Update invoice
     */
    updateInvoice(id: string, userId: string, input: UpdateInvoiceInput): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    }>;
    /**
     * Mark invoice as paid
     * Handles both Prisma (PostgreSQL) and Firestore business invoices
     */
    markAsPaid(id: string, userId: string): Promise<{
        items: Prisma.JsonValue;
        taxRate: Prisma.Decimal;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod;
        invoiceNumber: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        userId: string;
        businessId: string | null;
        createdBy: string;
        issueDate: Date;
        dueDate: Date;
        currency: string;
        fromInfo: Prisma.JsonValue;
        toInfo: Prisma.JsonValue;
        notes: string | null;
        manualBankDetails: Prisma.JsonValue | null;
        grandTotal: Prisma.Decimal;
        id: string;
        isPublic: boolean;
        publicUrl: string | null;
        pdfUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        paidAt: Date | null;
    } | {
        id: string;
        invoiceNumber: any;
        invoiceType: "BUSINESS";
        userId: any;
        businessId: any;
        createdBy: any;
        issueDate: any;
        dueDate: any;
        status: any;
        currency: any;
        grandTotal: Decimal;
        taxRate: Decimal;
        fromInfo: {
            name: any;
            address: any;
            email: any;
        };
        toInfo: {
            name: any;
            address: any;
            email: any;
        };
        items: any[];
        paymentMethod: any;
        manualBankDetails: {
            bankName: any;
            accountName: any;
            accountNumber: any;
            otherDetails: any;
        } | null;
        notes: any;
        isPublic: boolean;
        publicUrl: any;
        pdfUrl: any;
        paidAt: any;
        createdAt: any;
        updatedAt: any;
    }>;
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