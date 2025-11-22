/**
 * ComplyAdvantage Verification Provider
 * Free tier available for AML screening
 * Sign up: https://complyadvantage.com
 * Best for: Sanctions, PEP, Adverse Media checks
 */

import { BaseVerificationProvider } from './base';
import type {
  VerificationProviderName,
  AMLScreeningResult,
} from '../types';

export class ComplyAdvantageProvider extends BaseVerificationProvider {
  name: VerificationProviderName = 'complyadvantage';
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = process.env.COMPLYADVANTAGE_API_KEY || '';
    this.baseUrl = process.env.COMPLYADVANTAGE_API_URL || 'https://api.complyadvantage.com';
  }

  /**
   * Run AML screening (Sanctions, PEP, Adverse Media)
   */
  async runAMLScreening(
    name: string,
    dateOfBirth?: string,
    country?: string,
    metadata?: Record<string, unknown>
  ): Promise<AMLScreeningResult> {
    try {
      if (!this.apiKey) {
        throw new Error('ComplyAdvantage API key not configured');
      }

      // ComplyAdvantage search API
      const searchParams = new URLSearchParams({
        q: name,
        ...(dateOfBirth && { dob: dateOfBirth }),
        ...(country && { country }),
      });

      const response = await fetch(`${this.baseUrl}/searches?${searchParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiKey}`,
        },
        body: JSON.stringify({
          search_term: name,
          ...(dateOfBirth && { dob: dateOfBirth }),
          ...(country && { country }),
          ...metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'AML screening failed');
      }

      const data = await response.json();

      // Parse results
      const matches: AMLScreeningResult['matches'] = [];
      let riskScore = 0;
      let isSanctioned = false;
      let isPEP = false;
      let isAdverseMedia = false;

      if (data.content?.data?.hits) {
        for (const hit of data.content.data.hits) {
          const matchType = hit._source?.match_types?.[0] || 'watchlist';
          const score = hit._score || 0;
          
          matches.push({
            type: matchType as 'sanctions' | 'pep' | 'adverse_media' | 'watchlist',
            score,
            details: hit._source?.name || name,
          });

          if (matchType === 'sanctions') isSanctioned = true;
          if (matchType === 'pep') isPEP = true;
          if (matchType === 'adverse_media') isAdverseMedia = true;
          
          riskScore = Math.max(riskScore, score);
        }
      }

      // Calculate overall risk (0-100)
      const calculatedRiskScore = Math.min(100, Math.round(riskScore * 20));

      return this.createSuccessResult<AMLScreeningResult>({
        riskScore: calculatedRiskScore,
        isSanctioned,
        isPEP,
        isAdverseMedia,
        matches,
        confidence: matches.length > 0 ? 95 : 90,
        data: data.content?.data,
      });
    } catch (error) {
      return this.createErrorResult<AMLScreeningResult>(
        error instanceof Error ? error.message : 'AML screening failed',
        {
          riskScore: 0,
          isSanctioned: false,
          isPEP: false,
          isAdverseMedia: false,
          matches: [],
        }
      );
    }
  }

  // Other methods not supported by ComplyAdvantage
  async verifyID(): Promise<IDVerificationResult> {
    return this.createErrorResult<IDVerificationResult>('ID verification not supported by ComplyAdvantage');
  }

  async verifyFaceMatch(): Promise<FaceMatchResult> {
    return this.createErrorResult<FaceMatchResult>('Face match verification not supported by ComplyAdvantage');
  }

  async verifyAddress(): Promise<AddressVerificationResult> {
    return this.createErrorResult<AddressVerificationResult>('Address verification not supported by ComplyAdvantage');
  }

  async verifyTaxID(): Promise<TaxIDVerificationResult> {
    return this.createErrorResult<TaxIDVerificationResult>('Tax ID verification not supported by ComplyAdvantage');
  }

  async verifyEmail(): Promise<EmailVerificationResult> {
    return this.createErrorResult<EmailVerificationResult>('Email verification not supported by ComplyAdvantage');
  }

  async verifyPhone(): Promise<PhoneVerificationResult> {
    return this.createErrorResult<PhoneVerificationResult>('Phone verification not supported by ComplyAdvantage');
  }
}

