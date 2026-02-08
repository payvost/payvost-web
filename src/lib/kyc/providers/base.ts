/**
 * Base Verification Provider
 * Abstract base class for all verification providers
 */

import type {
  VerificationProvider,
  VerificationProviderName,
  IDVerificationResult,
  FaceMatchResult,
  AddressVerificationResult,
  TaxIDVerificationResult,
  EmailVerificationResult,
  PhoneVerificationResult,
  AMLScreeningResult,
} from '../types';

export abstract class BaseVerificationProvider implements VerificationProvider {
  abstract name: VerificationProviderName;

  abstract verifyID?(
    document: File,
    country: string,
    metadata?: Record<string, unknown>
  ): Promise<IDVerificationResult>;

  abstract verifyFaceMatch?(
    selfie: File,
    idDocument: File,
    metadata?: Record<string, unknown>
  ): Promise<FaceMatchResult>;

  abstract verifyAddress?(
    addressDoc: File,
    providedAddress: string,
    country: string,
    metadata?: Record<string, unknown>
  ): Promise<AddressVerificationResult>;

  abstract verifyTaxID?(
    taxId: string,
    country: string,
    name?: string,
    metadata?: Record<string, unknown>
  ): Promise<TaxIDVerificationResult>;

  abstract verifyEmail?(
    email: string,
    metadata?: Record<string, unknown>
  ): Promise<EmailVerificationResult>;

  abstract verifyPhone?(
    phone: string,
    country: string,
    metadata?: Record<string, unknown>
  ): Promise<PhoneVerificationResult>;

  abstract runAMLScreening?(
    name: string,
    dateOfBirth?: string,
    country?: string,
    metadata?: Record<string, unknown>
  ): Promise<AMLScreeningResult>;

  /**
   * Helper to create a successful result
   */
  protected createSuccessResult<T extends { provider: VerificationProviderName }>(
    data: Partial<T>
  ): T {
    const base = { success: true, provider: this.name, verifiedAt: new Date() } as const;
    return { ...(base as any), ...(data as any) } as unknown as T;
  }

  /**
   * Helper to create a failed result
   */
  protected createErrorResult<T extends { provider: VerificationProviderName }>(
    error: string,
    data?: Partial<T>
  ): T {
    const base = { success: false, provider: this.name, error } as const;
    return { ...(base as any), ...((data || {}) as any) } as unknown as T;
  }

  /**
   * Convert file to base64 for API uploads
   */
  protected async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert file to buffer (for Node.js/server-side)
   */
  protected async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

