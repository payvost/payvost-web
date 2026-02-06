// @ts-nocheck
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
      // When using template, still provide text version if available
      if (options.text) {
        messageData.text = options.text;
      }
      // Don't set html when using template - Mailgun will use the template HTML
    } else {
      // Use HTML/text directly (no template)
      if (options.html) {
        messageData.html = options.html;
      }

      if (options.text) {
        messageData.text = options.text;
      } else if (options.html) {
        // Auto-generate text from HTML if not provided
        messageData.text = options.html.replace(/<[^>]*>/g, '').trim();
      }
      
      // Set variables as v:variable_name even when not using template (for consistency)
      if (options.variables) {
        Object.entries(options.variables).forEach(([key, value]) => {
          messageData[`v:${key}`] = String(value);
        });
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
 * Generate HTML email template for rate alert
 */
export function generateRateAlertEmailHTML(params: {
  sourceCurrency: string;
  targetCurrency: string;
  currentRate: string | number;
  targetRate: string | number;
  userName?: string;
}): string {
  const { sourceCurrency, targetCurrency, currentRate, targetRate, userName } = params;
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FX Rate Alert - Payvost</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎯 Rate Alert Triggered!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great news! Your FX rate alert has been triggered. The exchange rate you were waiting for has been reached.
              </p>
              
              <!-- Rate Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 15px; text-align: center;">
                    <div style="font-size: 14px; color: #666666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Currency Pair</div>
                    <div style="font-size: 28px; font-weight: 700; color: #667eea; margin-bottom: 20px;">
                      ${sourceCurrency} / ${targetCurrency}
                    </div>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                      <tr>
                        <td style="padding: 10px; text-align: left; width: 50%;">
                          <div style="font-size: 12px; color: #666666; margin-bottom: 5px;">Current Rate</div>
                          <div style="font-size: 20px; font-weight: 600; color: #10b981;">${currentRate}</div>
                        </td>
                        <td style="padding: 10px; text-align: right; width: 50%;">
                          <div style="font-size: 12px; color: #666666; margin-bottom: 5px;">Target Rate</div>
                          <div style="font-size: 20px; font-weight: 600; color: #667eea;">${targetRate}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                The rate for <strong>${sourceCurrency} to ${targetCurrency}</strong> is now <strong>${currentRate}</strong>, which meets your target of <strong>${targetRate}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="https://payvost.com/fx-rates" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Exchange Rates</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                This alert has been automatically deactivated. You can set up a new alert anytime from your FX Rates page.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                This is an automated notification from Payvost.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © ${new Date().getFullYear()} Payvost. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send rate alert email using rich HTML (no Mailgun stored template required)
 * 
 * If you later want to switch back to Mailgun templates, you can pass `template`
 * instead of `html` in sendEmail() and keep variables consistent.
 */
export async function sendRateAlertEmail(
  to: string, 
  subject: string, 
  text: string,
  htmlParams?: {
    sourceCurrency: string;
    targetCurrency: string;
    currentRate: string | number;
    targetRate: string | number;
    userName?: string;
  }
) {
  let textContent = text;
  
  // Use rich HTML if params provided, otherwise send plain text
  if (htmlParams) {
    // Use provided text or generate from params
    if (!text || text === '') {
      textContent = `Your FX rate alert: ${htmlParams.sourceCurrency}/${htmlParams.targetCurrency}\n\nGood news! The rate for ${htmlParams.sourceCurrency} to ${htmlParams.targetCurrency} is now ${htmlParams.currentRate}, meeting your target of ${htmlParams.targetRate}.`;
    }

    const html = generateRateAlertEmailHTML(htmlParams);
    const result = await sendEmail({
      to,
      subject,
      text: textContent,
      html,
      from: `Payvost Alerts <alerts@${domain}>`,
      tags: ['rate-alert'],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send rate alert email');
    }

    return result;
  } else {
    // Fallback: generate HTML if no template params (backward compatibility)
    const result = await sendEmail({
      to,
      subject,
      text: textContent,
      from: `Payvost Alerts <alerts@${domain}>`,
      tags: ['rate-alert'],
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send rate alert email');
    }

    return result;
  }
}
