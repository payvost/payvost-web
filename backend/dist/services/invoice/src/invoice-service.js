"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const library_1 = require("@prisma/client/runtime/library");
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
                invoiceType: input.invoiceType,
                paymentMethod: input.paymentMethod,
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
     */
    async getPublicInvoice(idOrNumber) {
        // Try by ID first
        let invoice = await this.prisma.invoice.findUnique({
            where: { id: idOrNumber },
        });
        // If not found, try by invoice number
        if (!invoice) {
            invoice = await this.prisma.invoice.findUnique({
                where: { invoiceNumber: idOrNumber },
            });
        }
        if (!invoice || !invoice.isPublic) {
            return null;
        }
        return invoice;
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
    async markAsPaid(id, userId) {
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
