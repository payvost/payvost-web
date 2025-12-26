import twilio from 'twilio';
import { logger } from '../../common/logger';

let twilioClient: twilio.Twilio | null = null;
let twilioConfigured = false;

/**
 * Initialize Twilio client
 */
export function initTwilio() {
  // Trim whitespace from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  // Check if credentials are missing or empty
  if (!accountSid || !authToken || !phoneNumber) {
    logger.warn('Twilio credentials not configured. SMS notifications will be disabled.');
    return;
  }

  // Validate Account SID format (must start with "AC")
  if (!accountSid.startsWith('AC')) {
    logger.warn(
      `Invalid Twilio Account SID format. Account SID must start with "AC". SMS notifications will be disabled.`
    );
    return;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    twilioConfigured = true;
    logger.info('Twilio client initialized successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Twilio client');
    twilioConfigured = false;
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(
  to: string,
  message: string,
  options?: {
    from?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioConfigured || !twilioClient) {
    logger.warn('Twilio not configured. SMS will not be sent.');
    return { success: false, error: 'SMS service not configured' };
  }

  const from = options?.from || process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    logger.error('Twilio phone number not configured');
    return { success: false, error: 'Twilio phone number not configured' };
  }

  try {
    // Validate phone number format (should include country code)
    const normalizedTo = to.startsWith('+') ? to : `+${to}`;

    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: from,
      to: normalizedTo,
    });

    logger.info(
      {
        messageSid: twilioMessage.sid,
        to: normalizedTo,
        status: twilioMessage.status,
      },
      'SMS sent successfully'
    );

    return {
      success: true,
      messageId: twilioMessage.sid,
    };
  } catch (error: any) {
    logger.error(
      {
        err: error,
        to,
        errorCode: error.code,
        errorMessage: error.message,
      },
      'Failed to send SMS'
    );

    // Handle specific Twilio errors
    if (error.code === 21211) {
      return { success: false, error: 'Invalid phone number format' };
    }
    if (error.code === 21608) {
      return { success: false, error: 'Unverified phone number (trial account)' };
    }
    if (error.code === 21614) {
      return { success: false, error: 'Unsubscribed recipient' };
    }

    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send verification code via SMS
 */
export async function sendVerificationCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Your Payvost verification code is: ${code}. This code will expire in 10 minutes.`;
  return sendSMS(phoneNumber, message);
}

/**
 * Send transaction notification via SMS
 */
export async function sendTransactionSMS(
  phoneNumber: string,
  details: {
    type: 'sent' | 'received';
    amount: string;
    currency: string;
    recipient?: string;
    sender?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let message: string;

  if (details.type === 'sent') {
    message = `You sent ${details.currency} ${details.amount} to ${details.recipient || 'recipient'}. Thank you for using Payvost!`;
  } else {
    message = `You received ${details.currency} ${details.amount} from ${details.sender || 'sender'}. Thank you for using Payvost!`;
  }

  return sendSMS(phoneNumber, message);
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return twilioConfigured;
}

