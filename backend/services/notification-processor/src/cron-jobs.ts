import { prisma } from './prisma';
import { sendEmailViaMailgun } from './mailgun';
import { renderInvoiceEmail } from './email-templates';

interface InvoiceToInfo {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
}

interface InvoiceFromInfo {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
}

/**
 * Invoice Reminder Cron Job
 * Sends reminders for unpaid invoices due within the next 3 days
 *
 * Note: Works with the actual Invoice schema where customer info
 * is stored in JSON fields (toInfo, fromInfo)
 */
export async function invoiceReminderCronJob() {
  console.log('📧 Starting invoice reminder job...');

  try {
    // Calculate date 3 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const now = new Date();

    // Find unpaid invoices due in next 3 days
    // Invoice schema uses DRAFT for unpaid and has toInfo/fromInfo as JSON fields
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: 'DRAFT', // Unpaid invoices
        dueDate: {
          lte: threeDaysFromNow,
          gte: now,
        },
        paidAt: null, // Explicitly not paid
      },
    });

    console.log(`📋 Found ${pendingInvoices.length} invoices due for reminders`);

    let remindersSent = 0;

    // Send reminder for each invoice
    for (const invoice of pendingInvoices) {
      try {
        // Extract recipient info from JSON field
        const toInfo = invoice.toInfo as unknown as InvoiceToInfo;
        const fromInfo = invoice.fromInfo as unknown as InvoiceFromInfo;

        const customerEmail = toInfo?.email || '';
        const customerName = toInfo?.name || 'Customer';

        if (!customerEmail) {
          console.warn(`⚠️ Invoice ${invoice.invoiceNumber} has no customer email, skipping`);
          continue;
        }

        // Send email
        const rendered = renderInvoiceEmail({
          to: customerEmail,
          name: customerName,
          type: 'reminder',
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.grandTotal.toString(),
          currency: invoice.currency,
          dueDate: invoice.dueDate.toISOString().split('T')[0],
          businessName: fromInfo?.name || 'Payvost',
          downloadLink: invoice.publicUrl || invoice.pdfUrl || '',
        });

        await sendEmailViaMailgun({
          to: customerEmail,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: rendered.tags,
        });

        remindersSent++;
        console.log(`✅ Reminder sent for invoice ${invoice.invoiceNumber} to ${customerEmail}`);
      } catch (error: any) {
        console.error(
          `❌ Failed to send reminder for invoice ${invoice.invoiceNumber}:`,
          error.message,
        );
      }
    }

    console.log(
      `📊 Invoice reminder job completed: ${remindersSent}/${pendingInvoices.length} reminders sent`,
    );
    return { success: true, remindersSent, totalChecked: pendingInvoices.length };
  } catch (error: any) {
    console.error('❌ Invoice reminder job failed:', error.message);
    return { success: false, error: error.message };
  }
}
