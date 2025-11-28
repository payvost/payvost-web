/**
 * Check if Mailgun is configured
 */
export declare function isMailgunConfigured(): boolean;
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
    template?: string;
}
export declare function sendEmail(options: SendEmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * Send batch emails (one email to multiple recipients)
 */
export declare function sendBatchEmail(recipients: string[], subject: string, html: string, text?: string, options?: Omit<SendEmailOptions, 'to' | 'subject' | 'html' | 'text'>): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * Generate HTML email template for rate alert
 */
export declare function generateRateAlertEmailHTML(params: {
    sourceCurrency: string;
    targetCurrency: string;
    currentRate: string | number;
    targetRate: string | number;
    userName?: string;
}): string;
/**
 * Send rate alert email using Mailgun template
 * Template name: 'rate-alert' (create this template in Mailgun dashboard)
 *
 * Required template variables:
 * - sourceCurrency: Source currency code (e.g., USD)
 * - targetCurrency: Target currency code (e.g., EUR)
 * - currentRate: Current exchange rate
 * - targetRate: Target rate that was set
 * - userName: User's name (optional)
 */
export declare function sendRateAlertEmail(to: string, subject: string, text: string, htmlParams?: {
    sourceCurrency: string;
    targetCurrency: string;
    currentRate: string | number;
    targetRate: string | number;
    userName?: string;
}): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
//# sourceMappingURL=mailgun.d.ts.map