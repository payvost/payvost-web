"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const library_1 = require("@prisma/client/runtime/library");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
class InvoiceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Calculate invoice totals
     */
    calculateTotals(items, taxRate = 0) {
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const taxAmount = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxAmount;
        return { subtotal, taxAmount, grandTotal };
    }
    /**
     * Create a new invoice
     */
    async createInvoice(input) {
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
                invoiceType: input.invoiceType,
                // Ensure the value matches the Prisma enum type
                paymentMethod: (paymentMethod || 'PAYVOST'),
                status: status,
                grandTotal: new library_1.Decimal(grandTotal),
                taxRate: new library_1.Decimal(taxRate),
                fromInfo: input.fromInfo,
                toInfo: input.toInfo,
                items: items,
                manualBankDetails: input.manualBankDetails,
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
    async getInvoiceById(id, userId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
        });
        if (!invoice)
            return null;
        // Check access permissions
        if (!invoice.isPublic && invoice.userId !== userId && invoice.createdBy !== userId) {
            return null;
        }
        return invoice;
    }
    /**
     * Get all invoices for a user
     */
    async getInvoicesByUserId(userId) {
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
    async getInvoiceByNumber(invoiceNumber, userId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { invoiceNumber },
        });
        if (!invoice)
            return null;
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
    async getPublicInvoice(idOrNumber) {
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
            if (!firebase_admin_1.default.apps.length) {
                console.error('Firebase Admin not initialized');
                throw new Error('Firebase Admin SDK not initialized');
            }
            const db = firebase_admin_1.default.firestore();
            if (!db) {
                console.error('Firestore database not available');
                throw new Error('Firestore database not available');
            }
            let firestoreInvoice = null;
            let isBusinessInvoice = false;
            // Helper function to convert Firestore invoice to Prisma format
            const convertFirestoreInvoice = (invoiceDoc, isBusiness) => {
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
                }
                else {
                    // Regular invoices: check isPublic flag
                    if (data?.isPublic !== true) {
                        return null;
                    }
                }
                // Helper to safely convert Firestore Timestamp to Date
                const toDate = (timestamp) => {
                    if (!timestamp)
                        return new Date();
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
                        invoiceType: 'BUSINESS',
                        userId: data?.createdBy || '',
                        businessId: data?.businessId || null,
                        createdBy: data?.createdBy || '',
                        issueDate: toDate(data?.issueDate),
                        dueDate: toDate(data?.dueDate),
                        status: (data?.status?.toUpperCase() || 'PENDING'),
                        currency: data?.currency || 'USD',
                        grandTotal: new library_1.Decimal(Number(data?.grandTotal || 0)),
                        taxRate: new library_1.Decimal(Number(data?.taxRate || 0)),
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
                        paymentMethod: (data?.paymentMethod?.toUpperCase() || 'PAYVOST'),
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
                else {
                    // Convert regular invoice format
                    return {
                        id: invoiceDoc.id,
                        invoiceNumber: data?.invoiceNumber || '',
                        invoiceType: 'USER',
                        userId: data?.userId || '',
                        businessId: null,
                        createdBy: data?.userId || '',
                        issueDate: toDate(data?.issueDate),
                        dueDate: toDate(data?.dueDate),
                        status: (data?.status?.toUpperCase() || 'PENDING'),
                        currency: data?.currency || 'USD',
                        grandTotal: new library_1.Decimal(Number(data?.grandTotal || 0)),
                        taxRate: new library_1.Decimal(Number(data?.taxRate || 0)),
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
                        paymentMethod: (data?.paymentMethod?.toUpperCase() || 'PAYVOST'),
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
            }
            else {
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
                }
                else {
                    isBusinessInvoice = true;
                }
            }
            if (firestoreInvoice && firestoreInvoice.exists) {
                const converted = convertFirestoreInvoice(firestoreInvoice, isBusinessInvoice);
                if (converted) {
                    return converted;
                }
            }
        }
        catch (error) {
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
    async listUserInvoices(userId, options) {
        const where = {
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
    async listBusinessInvoices(businessId, createdBy, options) {
        const where = {
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
    async updateInvoice(id, userId, input) {
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
            grandTotal = new library_1.Decimal(newTotal);
        }
        // Update public URL if status changed
        let isPublic = existing.isPublic;
        let publicUrl = existing.publicUrl;
        if (input.status && input.status !== 'DRAFT') {
            isPublic = true;
            publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invoice/${existing.invoiceNumber}`;
        }
        else if (input.status === 'DRAFT') {
            isPublic = false;
            publicUrl = null;
        }
        // Build update data object explicitly to avoid type issues
        const updateData = {
            grandTotal,
            isPublic,
            publicUrl,
            updatedAt: new Date(),
        };
        // Only include fields that are provided in input
        if (input.invoiceNumber !== undefined)
            updateData.invoiceNumber = input.invoiceNumber;
        if (input.issueDate !== undefined)
            updateData.issueDate = input.issueDate;
        if (input.dueDate !== undefined)
            updateData.dueDate = input.dueDate;
        if (input.status !== undefined)
            updateData.status = input.status;
        if (input.fromInfo !== undefined)
            updateData.fromInfo = input.fromInfo;
        if (input.toInfo !== undefined)
            updateData.toInfo = input.toInfo;
        if (input.items !== undefined)
            updateData.items = input.items;
        if (input.taxRate !== undefined)
            updateData.taxRate = new library_1.Decimal(Number(input.taxRate));
        if (input.notes !== undefined)
            updateData.notes = input.notes;
        if (input.paymentMethod !== undefined)
            updateData.paymentMethod = input.paymentMethod;
        if (input.manualBankDetails !== undefined)
            updateData.manualBankDetails = input.manualBankDetails;
        if (input.pdfUrl !== undefined)
            updateData.pdfUrl = input.pdfUrl;
        if (input.publicUrl !== undefined)
            updateData.publicUrl = input.publicUrl;
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
    async markAsPaid(id, userId) {
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
            return invoice;
        }
        // If not in Prisma, check Firestore businessInvoices collection
        try {
            if (!firebase_admin_1.default.apps.length) {
                throw new Error('Firebase Admin SDK not initialized');
            }
            const db = firebase_admin_1.default.firestore();
            const docRef = db.collection('businessInvoices').doc(id);
            const firestoreInvoice = await docRef.get();
            if (!firestoreInvoice.exists) {
                throw new Error('Invoice not found');
            }
            const data = firestoreInvoice.data();
            if (!data) {
                throw new Error('Invoice data not found');
            }
            // Verify ownership
            if (data.createdBy !== userId) {
                throw new Error('Unauthorized');
            }
            // Update in Firestore
            await docRef.update({
                status: 'Paid',
                paidAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            });
            // Return updated data in Prisma format for consistency
            const updatedDoc = await docRef.get();
            const updatedData = updatedDoc.data();
            return {
                id: updatedDoc.id,
                invoiceNumber: updatedData?.invoiceNumber || '',
                invoiceType: 'BUSINESS',
                userId: updatedData?.createdBy || '',
                businessId: updatedData?.businessId || null,
                createdBy: updatedData?.createdBy || '',
                issueDate: updatedData?.issueDate?.toDate ? updatedData.issueDate.toDate() : new Date(updatedData?.issueDate),
                dueDate: updatedData?.dueDate?.toDate ? updatedData.dueDate.toDate() : new Date(updatedData?.dueDate),
                status: 'PAID',
                currency: updatedData?.currency || 'USD',
                grandTotal: new library_1.Decimal(Number(updatedData?.grandTotal || 0)),
                taxRate: new library_1.Decimal(Number(updatedData?.taxRate || 0)),
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
                paymentMethod: (updatedData?.paymentMethod?.toUpperCase() || 'PAYVOST'),
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
                paidAt: updatedData?.paidAt?.toDate ? updatedData.paidAt.toDate() : new Date(),
                createdAt: updatedData?.createdAt?.toDate ? updatedData.createdAt.toDate() : new Date(),
                updatedAt: updatedData?.updatedAt?.toDate ? updatedData.updatedAt.toDate() : new Date(),
            };
        }
        catch (error) {
            console.error('Error marking Firestore invoice as paid:', error);
            throw error;
        }
    }
    /**
     * Delete invoice
     */
    async deleteInvoice(id, userId) {
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
    async getInvoiceStats(userId) {
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
            .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
            .reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
        const totalPaid = allInvoices
            .filter((inv) => inv.status === 'PAID')
            .reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
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
exports.InvoiceService = InvoiceService;
//# sourceMappingURL=invoice-service.js.map