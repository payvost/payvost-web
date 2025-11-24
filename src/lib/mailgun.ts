/**
 * Mailgun API Service for Next.js API Routes
 * Provides email sending functionality using Mailgun API
 */

import formData from 'form-data';
import Mailgun from 'mailgun.js';

const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN || 'payvost.com';
const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'no-reply@payvost.com';

// Initialize Mailgun client (lazy initialization)
let mailgunClient: any = null;

function getMailgunClient() {
  if (!mailgunClient) {
    if (!apiKey || !domain) {
      throw new Error('Mailgun API key or domain not set in environment variables. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN');
    }

    const mailgun = new Mailgun(formData);
    mailgunClient = mailgun.client({ 
      username: 'api', 
      key: apiKey, 
      url: 'https://api.mailgun.net' 
    });
  }
  return mailgunClient;
}

/**
 * Check if Mailgun is configured
 */
export function isMailgunConfigured(): boolean {
  return !!(apiKey && domain);
}

/**
 * Send email via Mailgun API
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  tags?: string[];
  variables?: Record<string, any>;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isMailgunConfigured()) {
      return { success: false, error: 'Mailgun is not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN' };
    }

    const mg = getMailgunClient();
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from || `Payvost <${fromEmail}>`;

    const messageData: any = {
      from,
      to: recipients,
      subject: options.subject,
    };

    if (options.html) {
      messageData.html = options.html;
    }

    if (options.text) {
      messageData.text = options.text;
    } else if (options.html) {
      // Auto-generate text from HTML if not provided
      messageData.text = options.html.replace(/<[^>]*>/g, '').trim();
    }

    if (options.cc) {
      messageData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
    }

    if (options.bcc) {
      messageData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    }

    if (options.replyTo) {
      messageData['h:Reply-To'] = options.replyTo;
    }

    if (options.tags && options.tags.length > 0) {
      messageData['o:tag'] = options.tags;
    }

    if (options.variables) {
      Object.entries(options.variables).forEach(([key, value]) => {
        messageData[`v:${key}`] = value;
      });
    }

    const result = await mg.messages.create(domain, messageData);

    return {
      success: true,
      messageId: result.id || result.message || 'unknown',
    };
  } catch (error: any) {
    console.error('Mailgun API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email via Mailgun API',
    };
  }
}

