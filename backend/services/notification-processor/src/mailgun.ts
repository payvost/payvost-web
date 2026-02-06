import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: string[];
}

export async function sendEmailViaMailgun(options: SendEmailOptions) {
  const apiKey = process.env.MAILGUN_API_KEY || '';
  const domain = process.env.MAILGUN_DOMAIN || '';
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';

  if (!apiKey || !domain) {
    throw new Error('MAILGUN_API_KEY or MAILGUN_DOMAIN is missing');
  }

  const client = mailgun.client({
    username: 'api',
    key: apiKey,
  });

  const { to, subject, html, text, tags } = options;

  const message: Record<string, any> = {
    from: `Payvost <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  };

  if (tags && tags.length > 0) {
    message['o:tag'] = tags;
  }

  const result = await client.messages.create(domain, message as any);
  console.log(`[mailgun] queued to=${to} id=${result.id}`);
  return result;
}
