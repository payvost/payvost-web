/**
 * KYC Verification Workflow
 * Orchestrates the verification process based on tier and country
 */

import type {
  KycTier,
  KycVerificationDetails,
  KycVerificationResult,
  VerificationStatus,
} from './types';
import { TIER_VERIFICATION_REQUIREMENTS, AUTO_APPROVAL_THRESHOLDS } from './config';
import {
  getProviderForCountry,
  getEmailProvider,
  getPhoneProvider,
  getAMLProvider,
  getProviderByName,
} from './providers';
import { COUNTRY_VERIFICATION_CONFIG } from './config';

export interface VerificationInput {
  userId: string;
  submissionId: string;
  tier: KycTier;
  country: string;
  email?: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: string;
  idDocument?: File;
  proofOfAddress?: File;
  selfie?: File;
  residentialAddress?: string;
  taxID?: string;
  sourceOfFunds?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Process KYC verification based on tier and country
 */
export async function processKYCVerification(
  input: VerificationInput
): Promise<KycVerificationResult> {
  const {
    userId,
    submissionId,
    tier,
    country,
    email,
    phone,
    fullName,
    dateOfBirth,
    idDocument,
    proofOfAddress,
    selfie,
    residentialAddress,
    taxID,
    sourceOfFunds,
    metadata = {},
  } = input;

  const requirements = TIER_VERIFICATION_REQUIREMENTS[tier];
  const details: KycVerificationDetails = {};
  const checks: Array<{ name: string; passed: boolean; confidence: number }> = [];

  // Tier 1: Basic checks (Email & Phone)
  if (tier === 'tier1' || tier === 'tier2' || tier === 'tier3') {
    // Email verification
    if (requirements.email && email) {
      try {
        const emailProvider = getEmailProvider();
        if (emailProvider.verifyEmail) {
          const result = await emailProvider.verifyEmail(email, metadata);
          details.email = {
            verified: result.success && result.isDeliverable !== false,
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            result,
          };
          checks.push({
            name: 'email',
            passed: details.email.verified,
            confidence: result.confidence || 0,
          });
        }
      } catch (error) {
        details.email = {
          verified: false,
          result: {
            success: false,
            provider: 'firebase',
            error: error instanceof Error ? error.message : 'Email verification failed',
          },
        };
      }
    }

    // Phone verification
    if (requirements.phone && phone) {
      try {
        const phoneProvider = getPhoneProvider();
        if (phoneProvider.verifyPhone) {
          const result = await phoneProvider.verifyPhone(phone, country, metadata);
          details.phone = {
            verified: result.success && result.isValid !== false,
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            method: 'SMS',
            result,
          };
          checks.push({
            name: 'phone',
            passed: details.phone.verified,
            confidence: result.confidence || 0,
          });
        }
      } catch (error) {
        details.phone = {
          verified: false,
          result: {
            success: false,
            provider: 'twilio',
            error: error instanceof Error ? error.message : 'Phone verification failed',
          },
        };
      }
    }

    // Country-specific Tier 1 checks
    if (country === 'NG' && taxID && /^\d{11}$/.test(taxID)) {
      // BVN verification for Nigeria
      try {
        const dojahProvider = getProviderByName('dojah');
        if (dojahProvider instanceof (await import('./providers/dojah')).DojahProvider) {
          const result = await dojahProvider.verifyBVN(taxID);
          details.taxID = {
            verified: result.success && result.isValid !== false,
            country: 'NG',
            taxIdType: 'BVN',
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            result,
          };
          checks.push({
            name: 'taxID',
            passed: details.taxID.verified,
            confidence: result.confidence || 0,
          });
        }
      } catch (error) {
        // Silent fail for optional Tier 1 checks
      }
    }
  }

  // Tier 2 & 3: Document verification
  if (tier === 'tier2' || tier === 'tier3') {
    // ID Document verification
    if (requirements.idDocument && idDocument) {
      try {
        const provider = getProviderForCountry(country);
        if (provider?.verifyID) {
          const result = await provider.verifyID(idDocument, country, {
            fullName,
            dateOfBirth,
            ...metadata,
          });
          details.idDocument = {
            verified: result.success && result.confidence !== undefined && result.confidence >= 70,
            confidence: result.confidence,
            extractedData: result.extractedData,
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            result,
          };
          checks.push({
            name: 'idDocument',
            passed: details.idDocument.verified || false,
            confidence: result.confidence || 0,
          });
        }
      } catch (error) {
        details.idDocument = {
          verified: false,
          result: {
            success: false,
            provider: 'sumsub',
            error: error instanceof Error ? error.message : 'ID verification failed',
            confidence: 0,
          },
        };
      }
    }

    // Address verification
    if (requirements.address && proofOfAddress && residentialAddress) {
      try {
        const provider = getProviderForCountry(country);
        if (provider?.verifyAddress) {
          const result = await provider.verifyAddress(
            proofOfAddress,
            residentialAddress,
            country,
            metadata
          );
          details.address = {
            verified: result.success && result.matchesProvidedAddress !== false,
            confidence: result.confidence,
            extractedAddress: result.extractedAddress,
            matchesProvidedAddress: result.matchesProvidedAddress,
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            result,
          };
          checks.push({
            name: 'address',
            passed: details.address.verified || false,
            confidence: result.confidence || 0,
          });
        }
      } catch (error) {
        details.address = {
          verified: false,
          result: {
            success: false,
            provider: 'sumsub',
            error: error instanceof Error ? error.message : 'Address verification failed',
            confidence: 0,
          },
        };
      }
    }

    // Face match verification
    if (requirements.faceMatch && selfie && idDocument) {
      try {
        const provider = getProviderForCountry(country);
        if (provider?.verifyFaceMatch) {
          const result = await provider.verifyFaceMatch(selfie, idDocument, metadata);
          details.faceMatch = {
            verified: result.success && result.isMatch !== false,
            confidence: result.confidence,
            matchScore: result.matchScore,
            livenessCheck: result.livenessCheck,
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            result,
          };
          checks.push({
            name: 'faceMatch',
            passed: details.faceMatch.verified || false,
            confidence: result.confidence || 0,
          });
        }
      } catch (error) {
        details.faceMatch = {
          verified: false,
          result: {
            success: false,
            provider: 'sumsub',
            error: error instanceof Error ? error.message : 'Face match verification failed',
            confidence: 0,
          },
        };
      }
    }
  }

  // Tier 3: Enhanced Due Diligence
  if (tier === 'tier3') {
    // Tax ID verification (country-specific)
    if (requirements.taxID && taxID) {
      try {
        const countryConfig = COUNTRY_VERIFICATION_CONFIG[country];
        const provider = getProviderForCountry(country);
        
        if (provider?.verifyTaxID) {
          const result = await provider.verifyTaxID(taxID, country, fullName, metadata);
          details.taxID = {
            verified: result.success && result.isValid !== false,
            country,
            taxIdType: result.taxIdType,
            verifiedAt: result.verifiedAt,
            provider: result.provider,
            result,
          };
          checks.push({
            name: 'taxID',
            passed: details.taxID.verified || false,
            confidence: result.confidence || 0,
          });
        } else if (country === 'NG' && /^\d{11}$/.test(taxID)) {
          // BVN verification for Nigeria
          const dojahProvider = getProviderByName('dojah');
          if (dojahProvider instanceof (await import('./providers/dojah')).DojahProvider) {
            const result = await dojahProvider.verifyBVN(taxID);
            details.taxID = {
              verified: result.success && result.isValid !== false,
              country: 'NG',
              taxIdType: 'BVN',
              verifiedAt: result.verifiedAt,
              provider: result.provider,
              result,
            };
            checks.push({
              name: 'taxID',
              passed: details.taxID.verified || false,
              confidence: result.confidence || 0,
            });
          }
        }
      } catch (error) {
        details.taxID = {
          verified: false,
          result: {
            success: false,
            provider: 'dojah',
            error: error instanceof Error ? error.message : 'Tax ID verification failed',
            confidence: 0,
          },
        };
      }
    }

    // AML screening
    if (requirements.amlScreening && fullName) {
      try {
        const amlProvider = getAMLProvider();
        if (amlProvider.runAMLScreening) {
          const result = await amlProvider.runAMLScreening(fullName, dateOfBirth, country, metadata);
          
          const isSanctioned = result.isSanctioned === true;
          const isHighRisk = (result.riskScore || 0) >= 70;
          
          details.amlScreening = {
            status: isSanctioned ? 'failed' : isHighRisk ? 'flagged' : result.success ? 'passed' : 'pending',
            riskScore: result.riskScore,
            isSanctioned,
            isPEP: result.isPEP,
            isAdverseMedia: result.isAdverseMedia,
            flags: result.matches?.map(m => `${m.type}: ${m.details}`) || [],
            provider: result.provider,
            screenedAt: result.verifiedAt,
            result,
          };
          
          checks.push({
            name: 'amlScreening',
            passed: !isSanctioned && !isHighRisk,
            confidence: 100 - (result.riskScore || 0),
          });
          
          // If sanctioned, reject immediately
          if (isSanctioned) {
            return createVerificationResult(
              userId,
              submissionId,
              tier,
              country,
              details,
              'rejected',
              false,
              0,
              true,
              'User is on sanctions list'
            );
          }
        }
      } catch (error) {
        details.amlScreening = {
          status: 'pending',
          result: {
            success: false,
            provider: 'complyadvantage',
            error: error instanceof Error ? error.message : 'AML screening failed',
            riskScore: 0,
          },
        };
      }
    }
  }

  // Calculate overall confidence score
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const averageConfidence = totalChecks > 0
    ? checks.reduce((sum, c) => sum + c.confidence, 0) / totalChecks
    : 0;

  // Determine status based on tier and thresholds
  const threshold = AUTO_APPROVAL_THRESHOLDS[tier];
  const requiredChecksPassed = threshold.requiredChecks.every(
    checkName => checks.find(c => c.name === checkName)?.passed
  );
  const meetsConfidenceThreshold = averageConfidence >= threshold.minConfidence;

  let status: VerificationStatus = 'pending_review';
  let autoApproved = false;

  if (tier === 'tier1') {
    // Tier 1: Auto-approve if email and phone are verified
    if (requiredChecksPassed && meetsConfidenceThreshold) {
      status = 'approved';
      autoApproved = true;
    } else if (details.email?.verified && details.phone?.verified) {
      status = 'approved';
      autoApproved = true;
    }
  } else if (tier === 'tier2') {
    // Tier 2: Auto-approve if all checks pass and confidence >= 90%
    if (requiredChecksPassed && meetsConfidenceThreshold) {
      status = 'approved';
      autoApproved = true;
    }
  } else {
    // Tier 3: Always requires manual review
    status = 'pending_review';
    autoApproved = false;
  }

  return createVerificationResult(
    userId,
    submissionId,
    tier,
    country,
    details,
    status,
    autoApproved,
    averageConfidence,
    false
  );
}

/**
 * Helper to create verification result
 */
function createVerificationResult(
  userId: string,
  submissionId: string,
  tier: KycTier,
  country: string,
  details: KycVerificationDetails,
  status: VerificationStatus,
  autoApproved: boolean,
  confidenceScore: number,
  requiresManualReview: boolean,
  rejectionReason?: string
): KycVerificationResult {
  return {
    userId,
    submissionId,
    tier,
    country,
    status,
    verificationDetails: details,
    autoApproved,
    confidenceScore,
    requiresManualReview: requiresManualReview || (tier === 'tier3') || !autoApproved,
    rejectionReason,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

