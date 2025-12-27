import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData);

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

export async function sendEmailViaMailgun(options: SendEmailOptions) {
  try {
    const { to, subject, template, variables } = options;

    const client = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || '',
    });

    const domain = process.env.MAILGUN_DOMAIN || '';
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@payvost.com';

    // Send email using template
    const message = {
      from: `Payvost <${fromEmail}>`,
      to,
      subject,
      template,
      'h:X-Mailgun-Variables': JSON.stringify(variables),
    };

    const result = await client.messages.create(domain, message);

    console.log(`✅ Email sent to ${to} (ID: ${result.id})`);

    return result;
  } catch (error: any) {
    console.error('❌ Mailgun error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
