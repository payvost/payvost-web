"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringInvoiceProcessor = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const date_fns_1 = require("date-fns");
const invoice_service_1 = require("./invoice-service");
class RecurringInvoiceProcessor {
    constructor(prisma) {
        this.prisma = prisma;
        this.db = firebase_admin_1.default.firestore();
        this.invoiceService = new invoice_service_1.InvoiceService(prisma);
    }
    /**
     * Process all recurring invoices that are due for generation
     * Should be called daily via a scheduled task or cron job
     */
    async processRecurringInvoices() {
        console.log('[RecurringInvoiceProcessor] Starting recurring invoice processing...');
        const generatedInvoices = [];
        try {
            // Fetch all recurring business invoices from Firestore
            const recurringSnapshot = await this.db
                .collection('businessInvoices')
                .where('isRecurring', '==', true)
                .where('status', '==', 'Pending') // Only generate from Pending invoices
                .get();
            console.log(`[RecurringInvoiceProcessor] Found ${recurringSnapshot.docs.length} recurring invoices`);
            for (const doc of recurringSnapshot.docs) {
                const invoice = doc.data();
                invoice.id = doc.id;
                try {
                    const generated = await this.processInvoice(invoice);
                    if (generated) {
                        generatedInvoices.push(generated);
                    }
                }
                catch (error) {
                    console.error(`[RecurringInvoiceProcessor] Error processing invoice ${invoice.id}:`, error);
                    // Continue processing other invoices
                }
            }
            console.log(`[RecurringInvoiceProcessor] Successfully generated ${generatedInvoices.length} recurring invoices`);
            return generatedInvoices;
        }
        catch (error) {
            console.error('[RecurringInvoiceProcessor] Error in processRecurringInvoices:', error);
            throw error;
        }
    }
    /**
     * Process a single recurring invoice
     */
    async processInvoice(invoice) {
        // Check if invoice should be generated
        const shouldGenerate = this.shouldGenerateInvoice(invoice);
        if (!shouldGenerate) {
            return null;
        }
        console.log(`[RecurringInvoiceProcessor] Generating new invoice for recurring invoice ${invoice.id}`);
        // Check if recurring period has ended
        if (invoice.recurringEndDate) {
            const endDate = invoice.recurringEndDate instanceof firestore_1.Timestamp
                ? invoice.recurringEndDate.toDate()
                : new Date(invoice.recurringEndDate);
            if ((0, date_fns_1.isBefore)(new Date(), endDate) === false) {
                console.log(`[RecurringInvoiceProcessor] Recurring invoice ${invoice.id} has ended`);
                // Optionally, mark the invoice as no longer recurring
                await this.db.collection('businessInvoices').doc(invoice.id).update({
                    isRecurring: false,
                });
                return null;
            }
        }
        // Calculate next issue and due dates
        const lastIssueDate = invoice.lastGeneratedAt
            ? (invoice.lastGeneratedAt instanceof firestore_1.Timestamp ? invoice.lastGeneratedAt.toDate() : new Date(invoice.lastGeneratedAt))
            : (invoice.issueDate instanceof firestore_1.Timestamp ? invoice.issueDate.toDate() : new Date(invoice.issueDate));
        const nextIssueDate = this.calculateNextDate(lastIssueDate, invoice.recurringFrequency);
        // Only generate if enough time has passed
        if ((0, date_fns_1.isBefore)(new Date(), nextIssueDate)) {
            console.log(`[RecurringInvoiceProcessor] Not ready to generate yet. Next generation: ${nextIssueDate}`);
            return null;
        }
        // Generate the new invoice
        const newInvoiceNumber = this.generateInvoiceNumber(invoice.invoiceNumber);
        const daysDifference = this.calculateDaysDifference(lastIssueDate, new Date());
        const dueDateDays = this.calculateDaysDifference(invoice.issueDate instanceof firestore_1.Timestamp ? invoice.issueDate.toDate() : new Date(invoice.issueDate), invoice.dueDate instanceof firestore_1.Timestamp ? invoice.dueDate.toDate() : new Date(invoice.dueDate));
        const newInvoice = {
            invoiceNumber: newInvoiceNumber,
            invoiceType: 'BUSINESS',
            userId: invoice.userId,
            businessId: invoice.businessId,
            createdBy: invoice.createdBy,
            issueDate: nextIssueDate,
            dueDate: (0, date_fns_1.addDays)(nextIssueDate, dueDateDays),
            currency: invoice.currency,
            fromName: invoice.fromName,
            fromAddress: invoice.fromAddress,
            fromEmail: invoice.fromEmail,
            toName: invoice.toName,
            toEmail: invoice.toEmail,
            toAddress: invoice.toAddress,
            items: invoice.items,
            notes: invoice.notes,
            taxRate: invoice.taxRate,
            grandTotal: invoice.grandTotal,
            paymentMethod: invoice.paymentMethod,
            status: 'PENDING',
            isPublic: true,
            manualBankDetails: invoice.manualBankDetails,
            // Don't copy recurring fields to new invoice
            isRecurring: false,
            recurringFrequency: null,
            recurringEndDate: null,
        };
        // Create the new invoice using the invoice service
        try {
            const createdInvoice = await this.invoiceService.createInvoice(newInvoice);
            // Update the original invoice with lastGeneratedAt timestamp
            await this.db.collection('businessInvoices').doc(invoice.id).update({
                lastGeneratedAt: firestore_1.Timestamp.now(),
            });
            // Trigger PDF generation for the new invoice
            await this.triggerPdfGeneration(createdInvoice.id);
            return {
                originalInvoiceId: invoice.id,
                newInvoiceNumber: newInvoiceNumber,
                newInvoiceId: createdInvoice.id,
                generatedAt: new Date(),
            };
        }
        catch (error) {
            console.error(`[RecurringInvoiceProcessor] Failed to create invoice from recurring template ${invoice.id}:`, error);
            throw error;
        }
    }
    /**
     * Determine if an invoice should be generated based on frequency and last generation time
     */
    shouldGenerateInvoice(invoice) {
        if (!invoice.isRecurring) {
            return false;
        }
        const lastGenerated = invoice.lastGeneratedAt
            ? (invoice.lastGeneratedAt instanceof firestore_1.Timestamp ? invoice.lastGeneratedAt.toDate() : new Date(invoice.lastGeneratedAt))
            : (invoice.issueDate instanceof firestore_1.Timestamp ? invoice.issueDate.toDate() : new Date(invoice.issueDate));
        const nextGenerationDate = this.calculateNextDate(lastGenerated, invoice.recurringFrequency);
        return !(0, date_fns_1.isBefore)(new Date(), nextGenerationDate);
    }
    /**
     * Calculate the next generation date based on frequency
     */
    calculateNextDate(baseDate, frequency) {
        const date = new Date(baseDate);
        switch (frequency) {
            case 'daily':
                return (0, date_fns_1.addDays)(date, 1);
            case 'weekly':
                return (0, date_fns_1.addWeeks)(date, 1);
            case 'monthly':
                return (0, date_fns_1.addMonths)(date, 1);
            default:
                return (0, date_fns_1.addMonths)(date, 1);
        }
    }
    /**
     * Calculate days difference between two dates
     */
    calculateDaysDifference(startDate, endDate) {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
    }
    /**
     * Generate a new invoice number based on the original
     * Example: INV-2025-001 -> INV-2025-002, or INV-12345 -> INV-12346
     */
    generateInvoiceNumber(baseNumber) {
        // Try to extract and increment a numeric part
        const match = baseNumber.match(/(\D*)(\d+)(\D*)$/);
        if (match) {
            const [, prefix, numStr, suffix] = match;
            const num = parseInt(numStr, 10);
            const paddedNum = numStr.length;
            return `${prefix}${String(num + 1).padStart(paddedNum, '0')}${suffix}`;
        }
        // Fallback: append timestamp
        return `${baseNumber}-${Date.now()}`;
    }
    /**
     * Trigger PDF generation for a newly created invoice
     */
    async triggerPdfGeneration(invoiceId) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/generate-invoice-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId }),
                signal: AbortSignal.timeout(120000),
            });
            if (!response.ok) {
                console.warn(`[RecurringInvoiceProcessor] PDF generation returned ${response.status} for invoice ${invoiceId}`);
            }
            else {
                console.log(`[RecurringInvoiceProcessor] PDF generation triggered for invoice ${invoiceId}`);
            }
        }
        catch (error) {
            console.error(`[RecurringInvoiceProcessor] Error triggering PDF generation for ${invoiceId}:`, error);
            // Don't throw - PDF generation is non-critical
        }
    }
}
exports.RecurringInvoiceProcessor = RecurringInvoiceProcessor;
exports.default = RecurringInvoiceProcessor;
