// Type declarations for mailgun module
// The actual implementation is compiled to dist/common/mailgun.js by build-common.js
// This declaration file allows TypeScript to resolve the import during compilation

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

export function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
export function isMailgunConfigured(): boolean;

