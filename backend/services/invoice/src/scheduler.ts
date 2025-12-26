import { PrismaClient } from '@prisma/client';
import RecurringInvoiceProcessor from './recurring-invoice-processor';

let isProcessing = false;
let lastProcessedAt: Date | null = null;

const prisma = new PrismaClient();
const processor = new RecurringInvoiceProcessor(prisma);

/**
 * Process recurring invoices
 * Should be called via HTTP endpoint or scheduled task
 */
export async function processRecurringInvoices(): Promise<{
  success: boolean;
  message: string;
  generatedCount: number;
  lastProcessedAt: Date;
  error?: string;
}> {
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

  } catch (error) {
    console.error('[RecurringInvoiceScheduler] Error processing recurring invoices:', error);

    return {
      success: false,
      message: 'Error processing recurring invoices',
      generatedCount: 0,
      lastProcessedAt: lastProcessedAt || new Date(),
      error: error instanceof Error ? error.message : String(error),
    };

  } finally {
    isProcessing = false;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isProcessing: boolean;
  lastProcessedAt: Date | null;
} {
  return {
    isProcessing,
    lastProcessedAt,
  };
}

/**
 * Start the scheduler (can be called on backend startup)
 * Runs the processor daily at a specified time
 */
export function startRecurringInvoiceScheduler(intervalMs: number = 24 * 60 * 60 * 1000): NodeJS.Timer {
  console.log(`[RecurringInvoiceScheduler] Starting scheduler with interval: ${intervalMs}ms (${(intervalMs / (60 * 60 * 1000)).toFixed(1)} hours)`);

  // Run immediately on startup
  processRecurringInvoices();

  // Run at specified interval
  const interval = setInterval(() => {
    processRecurringInvoices();
  }, intervalMs);

  return interval;
}

export default {
  processRecurringInvoices,
  getSchedulerStatus,
  startRecurringInvoiceScheduler,
};
