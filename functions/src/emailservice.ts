/**
 * Email Service using Nodemailer/Mailgun
 * Replaced OneSignal with direct SMTP
 */
import { sendKycStatusNotification } from './services/notificationService';

export async function sendVerificationWelcomeEmail(toEmail: string, toName: string) {
  try {
    const result = await sendKycStatusNotification({
      email: toEmail,
      name: toName,
      status: 'approved',
      nextSteps: 'You now have full access to all Payvost features.',
    });
    
    if (result.success) {
      console.log('✅ Welcome email sent:', result.messageId);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message || error);
  }
}
