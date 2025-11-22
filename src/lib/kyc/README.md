# KYC Verification System

Automated KYC verification system with free/low-cost provider integrations.

## Quick Start

1. **Add API keys to `.env.local`:**
   ```bash
   SUMSUB_SECRET_KEY=your_key
   SUMSUB_APP_TOKEN=your_token
   DOJAH_API_KEY=your_key
   DOJAH_APP_ID=your_id
   COMPLYADVANTAGE_API_KEY=your_key
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_VERIFY_SERVICE_SID=your_service_sid
   ```

2. **Use the verification workflow:**
   ```typescript
   import { processKYCVerification } from '@/lib/kyc/verification-workflow';
   
   const result = await processKYCVerification({
     userId: 'user123',
     submissionId: 'sub123',
     tier: 'tier2',
     country: 'NG',
     email: 'user@example.com',
     phone: '+2348123456789',
     // ... other fields
   });
   ```

## Structure

- **`types.ts`** - Core types and interfaces
- **`config.ts`** - Provider mapping and country configs
- **`verification-workflow.ts`** - Main workflow orchestrator
- **`providers/`** - Provider implementations

## Providers

### Sumsub
- **Free tier:** 100 verifications/month
- **Best for:** Global ID verification, face matching
- **Countries:** US, UK, CA, AU, DE, etc.

### Dojah
- **Free tier:** Available for African countries
- **Best for:** BVN, NIN, Ghana Card, KRA PIN
- **Countries:** NG, GH, KE, ZA

### ComplyAdvantage
- **Free tier:** Basic AML screening
- **Best for:** Sanctions, PEP, Adverse Media
- **Countries:** All

### Twilio
- **Free tier:** $15.50 credit
- **Best for:** Phone/SMS OTP verification
- **Countries:** All

### Firebase
- **Free tier:** Built-in (no extra cost)
- **Best for:** Email verification
- **Countries:** All

## Verification Flow

1. **Tier 1:** Email + Phone verification
2. **Tier 2:** Tier 1 + ID + Address + Face Match
3. **Tier 3:** Tier 2 + Tax ID + AML Screening

## Auto-Approval

- **Tier 1:** Auto-approved if email & phone verified (≥80% confidence)
- **Tier 2:** Auto-approved if all checks pass (≥90% confidence)
- **Tier 3:** Always requires manual review

## Documentation

- **Setup Guide:** `docs/KYC_VERIFICATION_SETUP.md`
- **Summary:** `docs/KYC_VERIFICATION_SUMMARY.md`
- **Env Guide:** `ENV_SETUP_GUIDE.md`

