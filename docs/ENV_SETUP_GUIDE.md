# Environment Variables Setup Guide

## Quick Start

1. Copy this template to `.env.local`:
2. Fill in the API keys from provider dashboards
3. Never commit `.env.local` to version control!

## KYC Verification Providers

### Required for KYC Verification

Add these to your `.env.local` file:

```bash
# ========================================
# KYC Verification Providers
# ========================================

# Sumsub - Free tier: 100 verifications/month
# Sign up: https://sumsub.com
SUMSUB_SECRET_KEY=your_sumsub_secret_key_here
SUMSUB_APP_TOKEN=your_sumsub_app_token_here

# Dojah - Free tier available for African countries
# Sign up: https://dojah.io
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here

# ComplyAdvantage - Free tier for AML screening
# Sign up: https://complyadvantage.com
COMPLYADVANTAGE_API_KEY=your_complyadvantage_api_key_here

# Twilio - Free tier: $15.50 credit for new accounts
# Sign up: https://twilio.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid_here
```

## Getting Your API Keys

### Sumsub (https://sumsub.com)
1. Sign up for free account
2. Go to Dashboard > Settings > API
3. Create new application
4. Copy **App Token** and **Secret Key**

### Dojah (https://dojah.io)
1. Sign up for free account
2. Go to Dashboard > API Keys
3. Copy **App ID** and **API Key**

### ComplyAdvantage (https://complyadvantage.com)
1. Sign up for free account
2. Go to Dashboard > API Keys
3. Create new API key
4. Copy the **API Key**

### Twilio (https://twilio.com)
1. Sign up for account (get $15.50 free credit)
2. Go to Console > Account > API Keys
3. Copy **Account SID** and **Auth Token**
4. Go to [Verify Services](https://console.twilio.com/us1/develop/verify/services)
5. Create new Verify Service
6. Copy **Service SID**

## Priority Setup Order

1. **Firebase** (already configured)
2. **Sumsub or Dojah** (for ID verification)
   - Use Dojah if focusing on African countries (Nigeria, Ghana, Kenya)
   - Use Sumsub for global coverage
3. **ComplyAdvantage** (for AML screening)
4. **Twilio** (for phone verification)

## Testing

After adding API keys:

1. Restart your development server
2. Test Tier 1 verification (email/phone)
3. Test Tier 2 verification (documents)
4. Check verification results in Firestore

## Notes

- All providers offer free/low-cost tiers suitable for startups
- Free tiers are sufficient for development and initial production
- Upgrade to paid tiers when you need higher limits

## Complete .env.local Template

See the complete template with all environment variables in the project documentation or create `.env.local` with at minimum:

```bash
# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# KYC Providers (Required for verification)
SUMSUB_SECRET_KEY=your_key
SUMSUB_APP_TOKEN=your_token
DOJAH_API_KEY=your_key
DOJAH_APP_ID=your_id
COMPLYADVANTAGE_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_VERIFY_SERVICE_SID=your_service_sid
```

