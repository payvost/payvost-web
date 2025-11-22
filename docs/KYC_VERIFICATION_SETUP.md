# KYC Verification Setup Guide

This guide explains how to set up the automated KYC verification system with free/low-cost providers.

## Overview

The KYC verification system uses multiple providers to verify user identity, documents, and compliance checks:

- **Sumsub** - Global ID verification, face matching (Free: 100 verifications/month)
- **Dojah** - African country-specific verification (Free tier available)
- **ComplyAdvantage** - AML screening, sanctions checks (Free tier available)
- **Twilio** - Phone/SMS OTP verification (Free: $15.50 credit)
- **Firebase Auth** - Email verification (Built-in, no extra cost)

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# ========================================
# KYC Verification Providers
# ========================================

# Sumsub - Free tier: 100 verifications/month
# Sign up: https://sumsub.com
# Best for: Global ID verification, face matching, document OCR
SUMSUB_SECRET_KEY=your_sumsub_secret_key
SUMSUB_APP_TOKEN=your_sumsub_app_token
# Optional: Custom API URL (default: https://api.sumsub.com)
# SUMSUB_API_URL=https://api.sumsub.com

# Dojah - Free tier available for African countries
# Sign up: https://dojah.io
# Best for: BVN, NIN (Nigeria), Ghana Card, KRA PIN (Kenya)
DOJAH_API_KEY=your_dojah_api_key
DOJAH_APP_ID=your_dojah_app_id
# Optional: Custom API URL (default: https://api.dojah.io)
# DOJAH_API_URL=https://api.dojah.io

# ComplyAdvantage - Free tier for AML screening
# Sign up: https://complyadvantage.com
# Best for: Sanctions screening, PEP checks, Adverse Media
COMPLYADVANTAGE_API_KEY=your_complyadvantage_api_key
# Optional: Custom API URL (default: https://api.complyadvantage.com)
# COMPLYADVANTAGE_API_URL=https://api.complyadvantage.com

# Twilio - Free tier: $15.50 credit for new accounts
# Sign up: https://twilio.com
# Best for: SMS/Phone OTP verification
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number
# Twilio Verify Service (for OTP)
# Create at: https://console.twilio.com/us1/develop/verify/services
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```

## Provider Setup Instructions

### 1. Sumsub Setup

1. Sign up at [https://sumsub.com](https://sumsub.com)
2. Go to Dashboard > Settings > API
3. Create a new application
4. Copy your **App Token** and **Secret Key**
5. Add to `.env.local`:
   ```bash
   SUMSUB_APP_TOKEN=your_app_token
   SUMSUB_SECRET_KEY=your_secret_key
   ```

**Free Tier:** 100 verifications/month  
**Best For:** US, UK, Canada, Australia, Germany - ID document verification, face matching

### 2. Dojah Setup

1. Sign up at [https://dojah.io](https://dojah.io)
2. Go to Dashboard > API Keys
3. Copy your **App ID** and **API Key**
4. Add to `.env.local`:
   ```bash
   DOJAH_APP_ID=your_app_id
   DOJAH_API_KEY=your_api_key
   ```

**Free Tier:** Available for African countries  
**Best For:** Nigeria (BVN, NIN), Ghana (Ghana Card), Kenya (KRA PIN)

### 3. ComplyAdvantage Setup

1. Sign up at [https://complyadvantage.com](https://complyadvantage.com)
2. Go to Dashboard > API Keys
3. Create a new API key
4. Add to `.env.local`:
   ```bash
   COMPLYADVANTAGE_API_KEY=your_api_key
   ```

**Free Tier:** Basic AML screening available  
**Best For:** Sanctions screening, PEP checks, Adverse Media monitoring

### 4. Twilio Setup

1. Sign up at [https://twilio.com](https://twilio.com) (get $15.50 free credit)
2. Go to Console > Account > API Keys
3. Copy your **Account SID** and **Auth Token**
4. Create a Verify Service:
   - Go to [Verify Services](https://console.twilio.com/us1/develop/verify/services)
   - Click "Create new Verify Service"
   - Copy the **Service SID**
5. Add to `.env.local`:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_VERIFY_SERVICE_SID=your_service_sid
   ```

**Free Tier:** $15.50 credit for new accounts  
**Best For:** Phone/SMS OTP verification

## Verification Flow

### Tier 1 (Basic)
- ✅ Email verification (Firebase)
- ✅ Phone verification (Twilio)
- ✅ Country-specific ID number check (optional)

### Tier 2 (Verified)
- ✅ All Tier 1 checks
- ✅ ID document verification (Sumsub/Dojah)
- ✅ Address verification (OCR + matching)
- ✅ Face match verification (selfie vs ID)

### Tier 3 (Enhanced Due Diligence)
- ✅ All Tier 2 checks
- ✅ Tax ID verification (country-specific)
- ✅ AML screening (ComplyAdvantage)
- ✅ Sanctions/PEP checks
- ⚠️ Manual review required

## Auto-Approval Thresholds

| Tier | Min Confidence | Required Checks | Auto-Approval |
|------|---------------|-----------------|---------------|
| Tier 1 | 80% | Email, Phone | ✅ Yes |
| Tier 2 | 90% | All Tier 1 + ID, Address, Face Match | ✅ Yes |
| Tier 3 | 95% | All Tier 2 + Tax ID, AML | ⚠️ Manual Review |

## Country-Specific Verification

### Nigeria (NG)
- **Tier 1:** BVN verification via Dojah
- **Tier 2:** NIN or Passport verification
- **Tier 3:** TIN verification

### Ghana (GH)
- **Tier 1:** Ghana Card number validation
- **Tier 2:** Ghana Card document verification
- **Tier 3:** GRA TIN verification

### Kenya (KE)
- **Tier 1:** National ID number validation
- **Tier 2:** National ID document verification
- **Tier 3:** KRA PIN verification

### United States (US)
- **Tier 1:** SSN last 4 digits
- **Tier 2:** Full SSN, Driver's License verification
- **Tier 3:** OFAC screening

### Other Countries
Similar patterns apply for UK, Canada, Australia, Germany, South Africa.

## Testing

To test the verification system:

1. Start with Tier 1 - verify email and phone
2. Upgrade to Tier 2 - submit ID documents
3. Upgrade to Tier 3 - complete enhanced due diligence

Check the verification results in Firestore:
- Collection: `kyc_verifications`
- Each verification includes confidence scores and provider details

## Troubleshooting

### Provider Not Working
- Check API keys in `.env.local`
- Verify API keys are correct in provider dashboard
- Check provider status page for outages

### Low Confidence Scores
- Ensure documents are clear and well-lit
- Verify document types match requirements
- Check that all required fields are filled

### Auto-Approval Not Working
- Check confidence score meets threshold (80% for Tier 1, 90% for Tier 2)
- Verify all required checks passed
- Tier 3 always requires manual review

## Cost Optimization

For startups with limited budget:

1. **Start with free tiers:**
   - Sumsub: 100/month free
   - Dojah: Free for African countries
   - ComplyAdvantage: Free basic tier
   - Twilio: $15.50 free credit

2. **Monitor usage:**
   - Track verification counts
   - Upgrade only when needed

3. **Prioritize providers:**
   - Use Dojah for African countries (free)
   - Use Sumsub for global (free tier)
   - Use ComplyAdvantage for AML (free tier)

## Next Steps

1. Set up provider accounts
2. Add API keys to `.env.local`
3. Test verification flow
4. Monitor verification results
5. Upgrade to paid tiers when needed

