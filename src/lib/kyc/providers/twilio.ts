/**
 * Twilio Verification Provider
 * Free tier: $15.50 credit for new accounts
 * Sign up: https://twilio.com
 * Best for: Phone/SMS verification via OTP
 */

import { BaseVerificationProvider } from './base';
import type {
  VerificationProviderName,
  PhoneVerificationResult,
} from '../types';

export class TwilioProvider extends BaseVerificationProvider {
  name: VerificationProviderName = 'twilio';
  private accountSid: string;
  private authToken: string;
  private verifyServiceSid: string;

  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';
  }

  /**
   * Verify phone number format and validity
   * Note: Actual OTP verification is done through Twilio Verify service
   */
  async verifyPhone(
    phone: string,
    country: string,
    metadata?: Record<string, unknown>
  ): Promise<PhoneVerificationResult> {
    try {
      // Basic phone number format validation
      // Remove common formatting characters
      const cleanedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
      
      // Basic validation based on country
      const countryPhonePatterns: Record<string, RegExp> = {
        NG: /^234\d{10}$/, // Nigeria: +234 followed by 10 digits
        GH: /^233\d{9}$/,  // Ghana: +233 followed by 9 digits
        KE: /^254\d{9}$/,  // Kenya: +254 followed by 9 digits
        ZA: /^27\d{9}$/,   // South Africa: +27 followed by 9 digits
        US: /^1\d{10}$/,   // US: +1 followed by 10 digits
        GB: /^44\d{10,11}$/, // UK: +44 followed by 10-11 digits
        CA: /^1\d{10}$/,   // Canada: +1 followed by 10 digits
        AU: /^61\d{9}$/,   // Australia: +61 followed by 9 digits
        DE: /^49\d{10,11}$/, // Germany: +49 followed by 10-11 digits
      };

      const pattern = countryPhonePatterns[country];
      const isValid = pattern ? pattern.test(cleanedPhone) : cleanedPhone.length >= 10;

      if (!isValid) {
        return this.createErrorResult<PhoneVerificationResult>(
          `Invalid phone number format for country: ${country}`,
          {
            isValid: false,
            country,
            confidence: 0,
          }
        );
      }

      // If Twilio credentials are available, you could use their Lookup API
      // to get more details about the phone number
      if (this.accountSid && this.authToken && !this.verifyServiceSid) {
        // Note: Twilio Lookup API is not in free tier
        // This is just a placeholder for format validation
      }

      return this.createSuccessResult<PhoneVerificationResult>({
        isValid: true,
        country,
        isMobile: true, // Assume mobile
        confidence: 85,
      });
    } catch (error) {
      return this.createErrorResult<PhoneVerificationResult>(
        error instanceof Error ? error.message : 'Phone verification failed',
        { isValid: false, confidence: 0 }
      );
    }
  }

  /**
   * Send OTP via Twilio Verify service
   */
  async sendOTP(phone: string, country: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      if (!this.accountSid || !this.authToken || !this.verifyServiceSid) {
        throw new Error('Twilio credentials not configured');
      }

      // Format phone number with country code
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            To: formattedPhone,
            Channel: 'sms',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send OTP');
      }

      const data = await response.json();
      return { success: true, sid: data.sid };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phone: string, code: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      if (!this.accountSid || !this.authToken || !this.verifyServiceSid) {
        throw new Error('Twilio credentials not configured');
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            To: formattedPhone,
            Code: code,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify OTP');
      }

      const data = await response.json();
      return { success: data.status === 'approved', status: data.status };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      };
    }
  }

  // Other methods not supported by Twilio
  async verifyEmail(): Promise<EmailVerificationResult> {
    return this.createErrorResult<EmailVerificationResult>('Email verification not supported by Twilio');
  }

  async verifyID(): Promise<IDVerificationResult> {
    return this.createErrorResult<IDVerificationResult>('ID verification not supported by Twilio');
  }

  async verifyFaceMatch(): Promise<FaceMatchResult> {
    return this.createErrorResult<FaceMatchResult>('Face match verification not supported by Twilio');
  }

  async verifyAddress(): Promise<AddressVerificationResult> {
    return this.createErrorResult<AddressVerificationResult>('Address verification not supported by Twilio');
  }

  async verifyTaxID(): Promise<TaxIDVerificationResult> {
    return this.createErrorResult<TaxIDVerificationResult>('Tax ID verification not supported by Twilio');
  }

  async runAMLScreening(): Promise<AMLScreeningResult> {
    return this.createErrorResult<AMLScreeningResult>('AML screening not supported by Twilio');
  }
}

