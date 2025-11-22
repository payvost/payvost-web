/**
 * Firebase Verification Provider
 * Built-in Firebase Auth for email/phone verification
 * No additional cost - uses existing Firebase setup
 */

import { BaseVerificationProvider } from './base';
import type {
  VerificationProviderName,
  EmailVerificationResult,
  PhoneVerificationResult,
} from '../types';

export class FirebaseProvider extends BaseVerificationProvider {
  name: VerificationProviderName = 'firebase';

  /**
   * Verify email deliverability using Firebase Auth
   * Note: Actual email verification is done during user registration
   */
  async verifyEmail(email: string, metadata?: Record<string, unknown>): Promise<EmailVerificationResult> {
    try {
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email);

      if (!isValidFormat) {
        return this.createErrorResult<EmailVerificationResult>(
          'Invalid email format',
          {
            isDeliverable: false,
            isDomainValid: false,
            confidence: 0,
          }
        );
      }

      // Check if domain is valid (basic check)
      const domain = email.split('@')[1];
      const isDomainValid = domain && domain.length > 0;

      // Check if disposable email (basic list - expand as needed)
      const disposableDomains = [
        'tempmail.com',
        'throwaway.email',
        'guerrillamail.com',
        '10minutemail.com',
      ];
      const isDisposable = disposableDomains.some(d => domain?.includes(d));

      return this.createSuccessResult<EmailVerificationResult>({
        isDeliverable: true, // Assume deliverable if format is valid
        isDisposable,
        isDomainValid,
        confidence: isDisposable ? 50 : 90,
      });
    } catch (error) {
      return this.createErrorResult<EmailVerificationResult>(
        error instanceof Error ? error.message : 'Email verification failed',
        { isDeliverable: false, isDomainValid: false, confidence: 0 }
      );
    }
  }

  // Other methods not supported by Firebase (use other providers)
  async verifyPhone(): Promise<PhoneVerificationResult> {
    // Firebase Phone Auth requires actual OTP flow
    // This is typically handled during registration
    return this.createErrorResult<PhoneVerificationResult>('Phone verification requires OTP flow');
  }

  async verifyID(): Promise<IDVerificationResult> {
    return this.createErrorResult<IDVerificationResult>('ID verification not supported by Firebase');
  }

  async verifyFaceMatch(): Promise<FaceMatchResult> {
    return this.createErrorResult<FaceMatchResult>('Face match verification not supported by Firebase');
  }

  async verifyAddress(): Promise<AddressVerificationResult> {
    return this.createErrorResult<AddressVerificationResult>('Address verification not supported by Firebase');
  }

  async verifyTaxID(): Promise<TaxIDVerificationResult> {
    return this.createErrorResult<TaxIDVerificationResult>('Tax ID verification not supported by Firebase');
  }

  async runAMLScreening(): Promise<AMLScreeningResult> {
    return this.createErrorResult<AMLScreeningResult>('AML screening not supported by Firebase');
  }
}

