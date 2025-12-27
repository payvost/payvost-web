"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRecurringInvoices = processRecurringInvoices;
exports.getSchedulerStatus = getSchedulerStatus;
exports.startRecurringInvoiceScheduler = startRecurringInvoiceScheduler;
const client_1 = require("@prisma/client");
const recurring_invoice_processor_1 = __importDefault(require("./recurring-invoice-processor"));
let isProcessing = false;
let lastProcessedAt = null;
const prisma = new client_1.PrismaClient();
const processor = new recurring_invoice_processor_1.default(prisma);
/**
 * Process recurring invoices
 * Should be called via HTTP endpoint or scheduled task
 */
async function processRecurringInvoices() {
    // Prevent concurrent processing
    if (isProcessing) {
        return {
            success: false,
            message: 'Recurring invoice processing already in progress',
            generatedCount: 0,
            lastProcessedAt: lastProcessedAt || new Date(),
            error: 'Processing already in progress',
        };
    }
    isProcessing = true;
    try {
        console.log('[RecurringInvoiceScheduler] Starting recurring invoice processing');
        const generatedInvoices = await processor.processRecurringInvoices();
        lastProcessedAt = new Date();
        console.log(`[RecurringInvoiceScheduler] Successfully processed recurring invoices. Generated ${generatedInvoices.length} invoices`);
        return {
            success: true,
            message: `Successfully generated ${generatedInvoices.length} recurring invoices`,
            generatedCount: generatedInvoices.length,
            lastProcessedAt,
        };
    }
    catch (error) {
        console.error('[RecurringInvoiceScheduler] Error processing recurring invoices:', error);
        return {
            success: false,
            message: 'Error processing recurring invoices',
            generatedCount: 0,
            lastProcessedAt: lastProcessedAt || new Date(),
            error: error instanceof Error ? error.message : String(error),
        };
    }
    finally {
        isProcessing = false;
    }
}
/**
 * Get scheduler status
 */
function getSchedulerStatus() {
    return {
        isProcessing,
        lastProcessedAt,
    };
}
/**
 * Start the scheduler (can be called on backend startup)
 * Runs the processor daily at a specified time
 */
function startRecurringInvoiceScheduler(intervalMs = 24 * 60 * 60 * 1000) {
    console.log(`[RecurringInvoiceScheduler] Starting scheduler with interval: ${intervalMs}ms (${(intervalMs / (60 * 60 * 1000)).toFixed(1)} hours)`);
    // Run immediately on startup
    processRecurringInvoices();
    // Run at specified interval
    const interval = setInterval(() => {
        processRecurringInvoices();
    }, intervalMs);
    return interval;
}
exports.default = {
    processRecurringInvoices,
    getSchedulerStatus,
    startRecurringInvoiceScheduler,
};
