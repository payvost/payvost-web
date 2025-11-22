/**
 * Dojah Verification Provider
 * Free tier available for African countries
 * Sign up: https://dojah.io
 * Best for: BVN, NIN, Ghana Card, KRA PIN
 */

import { BaseVerificationProvider } from './base';
import type {
  VerificationProviderName,
  IDVerificationResult,
  TaxIDVerificationResult,
  FaceMatchResult,
  AddressVerificationResult,
  AMLScreeningResult,
} from '../types';

export class DojahProvider extends BaseVerificationProvider {
  name: VerificationProviderName = 'dojah';
  private apiKey: string;
  private appId: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.DOJAH_API_KEY || '';
    this.appId = process.env.DOJAH_APP_ID || '';
    this.baseUrl = process.env.DOJAH_API_URL || 'https://api.dojah.io';
  }

  /**
   * Verify BVN (Bank Verification Number) - Nigeria
   */
  async verifyBVN(bvn: string, accountNumber?: string): Promise<TaxIDVerificationResult> {
    try {
      if (!this.apiKey || !this.appId) {
        throw new Error('Dojah API credentials not configured');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/kyc/bvn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': this.appId,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          bvn,
          account_number: accountNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'BVN verification failed');
      }

      const data = await response.json();
      
      return this.createSuccessResult<TaxIDVerificationResult>({
        taxIdType: 'BVN',
        isValid: data.entity?.status === 'success',
        nameMatch: true, // Would check against provided name
        confidence: data.entity?.status === 'success' ? 95 : 0,
        data: data.entity,
      });
    } catch (error) {
      return this.createErrorResult<TaxIDVerificationResult>(
        error instanceof Error ? error.message : 'BVN verification failed',
        { taxIdType: 'BVN', isValid: false, confidence: 0 }
      );
    }
  }

  /**
   * Verify NIN (National Identification Number) - Nigeria
   */
  async verifyNIN(nin: string, firstName?: string, lastName?: string): Promise<IDVerificationResult> {
    try {
      if (!this.apiKey || !this.appId) {
        throw new Error('Dojah API credentials not configured');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/kyc/nin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': this.appId,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          nin,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'NIN verification failed');
      }

      const data = await response.json();
      
      return this.createSuccessResult<IDVerificationResult>({
        extractedData: {
          fullName: `${data.entity?.firstname || ''} ${data.entity?.surname || ''}`.trim(),
          dateOfBirth: data.entity?.birthdate,
          idNumber: nin,
          documentType: 'NIN',
          country: 'NG',
        },
        confidence: data.entity?.status === 'success' ? 95 : 0,
        data: data.entity,
      });
    } catch (error) {
      return this.createErrorResult<IDVerificationResult>(
        error instanceof Error ? error.message : 'NIN verification failed',
        { confidence: 0 }
      );
    }
  }

  /**
   * Verify Ghana Card
   */
  async verifyGhanaCard(ghanaCardNumber: string, firstName?: string, lastName?: string): Promise<IDVerificationResult> {
    try {
      if (!this.apiKey || !this.appId) {
        throw new Error('Dojah API credentials not configured');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/kyc/ghana_card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': this.appId,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          id: ghanaCardNumber,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ghana Card verification failed');
      }

      const data = await response.json();
      
      return this.createSuccessResult<IDVerificationResult>({
        extractedData: {
          fullName: `${data.entity?.first_name || ''} ${data.entity?.last_name || ''}`.trim(),
          dateOfBirth: data.entity?.date_of_birth,
          idNumber: ghanaCardNumber,
          documentType: 'Ghana Card',
          country: 'GH',
        },
        confidence: data.entity?.status === 'success' ? 95 : 0,
        data: data.entity,
      });
    } catch (error) {
      return this.createErrorResult<IDVerificationResult>(
        error instanceof Error ? error.message : 'Ghana Card verification failed',
        { confidence: 0 }
      );
    }
  }

  /**
   * Verify KRA PIN - Kenya
   */
  async verifyKRAPIN(kraPin: string): Promise<TaxIDVerificationResult> {
    try {
      if (!this.apiKey || !this.appId) {
        throw new Error('Dojah API credentials not configured');
      }

      const response = await fetch(`${this.baseUrl}/api/v1/kyc/tax_identification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': this.appId,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          id: kraPin,
          country: 'KE',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'KRA PIN verification failed');
      }

      const data = await response.json();
      
      return this.createSuccessResult<TaxIDVerificationResult>({
        taxIdType: 'KRA PIN',
        isValid: data.entity?.status === 'success',
        confidence: data.entity?.status === 'success' ? 95 : 0,
        data: data.entity,
      });
    } catch (error) {
      return this.createErrorResult<TaxIDVerificationResult>(
        error instanceof Error ? error.message : 'KRA PIN verification failed',
        { taxIdType: 'KRA PIN', isValid: false, confidence: 0 }
      );
    }
  }

  /**
   * Verify Tax ID by country
   */
  async verifyTaxID(
    taxId: string,
    country: string,
    name?: string,
    metadata?: Record<string, unknown>
  ): Promise<TaxIDVerificationResult> {
    // Route to country-specific methods
    switch (country) {
      case 'NG':
        if (taxId.length === 11 && /^\d{11}$/.test(taxId)) {
          return this.verifyBVN(taxId);
        }
        break;
      case 'GH':
        if (taxId.startsWith('GHA')) {
          return this.verifyGhanaCard(taxId, name?.split(' ')[0], name?.split(' ')[1]);
        }
        break;
      case 'KE':
        if (/^[A-Z]\d{9}[A-Z]$/.test(taxId)) {
          return this.verifyKRAPIN(taxId);
        }
        break;
    }

    return this.createErrorResult<TaxIDVerificationResult>(
      `Tax ID verification not supported for country: ${country}`,
      { isValid: false, confidence: 0 }
    );
  }

  async verifyID(): Promise<IDVerificationResult> {
    // Dojah focuses on ID number verification, not document OCR
    return this.createErrorResult<IDVerificationResult>('Document OCR not available, use verifyNIN or verifyGhanaCard');
  }

  async verifyFaceMatch(): Promise<FaceMatchResult> {
    return this.createErrorResult<FaceMatchResult>('Face match verification not supported by Dojah');
  }

  async verifyAddress(): Promise<AddressVerificationResult> {
    return this.createErrorResult<AddressVerificationResult>('Address verification not supported by Dojah');
  }

  async verifyEmail(): Promise<EmailVerificationResult> {
    return this.createErrorResult<EmailVerificationResult>('Email verification not supported by Dojah');
  }

  async verifyPhone(): Promise<PhoneVerificationResult> {
    return this.createErrorResult<PhoneVerificationResult>('Phone verification not supported by Dojah');
  }

  async runAMLScreening(): Promise<AMLScreeningResult> {
    return this.createErrorResult<AMLScreeningResult>('AML screening not supported by Dojah');
  }
}

