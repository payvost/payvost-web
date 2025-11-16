import formData from 'form-data';
import Mailgun from 'mailgun.js';

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;

if (!apiKey || !domain) {
  throw new Error('Mailgun API key or domain not set in environment variables');
}

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: apiKey!, url: 'https://api.mailgun.net' });

export async function sendRateAlertEmail(to: string, subject: string, text: string) {
  await mg.messages.create(domain!, {
    from: `alerts@${domain}`,
    to: [to],
    subject,
    text,
  });
}
