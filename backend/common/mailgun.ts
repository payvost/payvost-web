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
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
    contentType?: string;
  }>;
  tags?: string[];
  variables?: Record<string, any>;
  template?: string; // Mailgun template name
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

    // Use Mailgun template if provided
    if (options.template) {
      messageData.template = options.template;
      // Template variables are passed as v:variable_name in Mailgun
      if (options.variables) {
        Object.entries(options.variables).forEach(([key, value]) => {
          messageData[`v:${key}`] = String(value);
        });
      }
      // Don't set html/text when using template - Mailgun will use the template
    } else {
      // Use HTML/text directly
      if (options.html) {
        messageData.html = options.html;
      }

      if (options.text) {
        messageData.text = options.text;
      } else if (options.html) {
        // Auto-generate text from HTML if not provided
        messageData.text = options.html.replace(/<[^>]*>/g, '').trim();
      }
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

    if (options.attachments && options.attachments.length > 0) {
      messageData.attachment = options.attachments.map(att => ({
        filename: att.filename,
        data: att.data,
        contentType: att.contentType,
      }));
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

/**
 * Send batch emails (one email to multiple recipients)
 */
export async function sendBatchEmail(
  recipients: string[],
  subject: string,
  html: string,
  text?: string,
  options?: Omit<SendEmailOptions, 'to' | 'subject' | 'html' | 'text'>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    ...options,
    to: recipients,
    subject,
    html,
    text,
  });
}

/**
 * Send rate alert email (backward compatibility)
 */
export async function sendRateAlertEmail(to: string, subject: string, text: string) {
  const result = await sendEmail({
    to,
    subject,
    text,
    from: `alerts@${domain}`,
    tags: ['rate-alert'],
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send rate alert email');
  }

  return result;
}
