import { prisma } from '../../common/prisma';
import { sendEmailViaMailgun } from './mailgun';

/**
 * Invoice Reminder Cron Job
 * Sends reminders for invoices due within the next 3 days
 */
export async function invoiceReminderCronJob() {
  console.log('📧 Starting invoice reminder job...');

  try {
    // Calculate date 3 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find pending invoices due in next 3 days that haven't had a reminder sent
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lte: threeDaysFromNow,
          gte: new Date(), // Not already overdue
        },
        reminderSentAt: null, // Haven't sent reminder yet
      },
      include: {
        user: true,
        business: true,
      },
    });

    console.log(`📋 Found ${pendingInvoices.length} invoices due for reminders`);

    let remindersSent = 0;

    // Send reminder for each invoice
    for (const invoice of pendingInvoices) {
      try {
        // Send email
        await sendEmailViaMailgun({
          to: invoice.customerEmail,
          subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} is due soon`,
          template: 'invoice-reminder',
          variables: {
            customerName: invoice.customerName,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount.toString(),
            currency: invoice.currency,
            dueDate: invoice.dueDate.toISOString().split('T')[0],
            businessName: invoice.business?.businessName || 'Payvost',
            downloadLink: invoice.downloadUrl || '',
          },
        });

        // Update invoice to mark reminder as sent
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { reminderSentAt: new Date() },
        });

        // Log to database
        await prisma.sentNotification.create({
          data: {
            type: 'invoice_reminder',
            email: invoice.customerEmail,
            status: 'sent',
            recipientName: invoice.customerName,
            sentAt: new Date(),
          },
        });

        remindersSent++;
        console.log(`✅ Reminder sent for invoice ${invoice.invoiceNumber}`);
      } catch (error: any) {
        console.error(`❌ Failed to send reminder for invoice ${invoice.invoiceNumber}:`, error);
      }
    }

    console.log(`📊 Invoice reminder job completed: ${remindersSent} reminders sent`);
    return { success: true, remindersSent };
  } catch (error: any) {
    console.error('❌ Invoice reminder job failed:', error);
    throw new Error(`Invoice reminder job failed: ${error.message}`);
  }
}
