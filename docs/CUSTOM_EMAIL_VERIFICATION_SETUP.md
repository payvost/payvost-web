# Custom Email Verification Setup

This document explains the custom email verification implementation that allows you to customize Firebase authentication emails using your own domain and branding.

## Overview

Firebase doesn't allow editing default email templates in the console to prevent spam. This implementation creates a custom email action handler that:
1. Uses Firebase Admin SDK to generate secure action links
2. Sends custom-branded emails via Mailgun
3. Processes verification and password reset actions on your custom domain

## Implementation Details

### Files Created

1. **`src/app/auth/action/page.tsx`** - Action handler page that processes email verification and password reset links
2. **`src/lib/custom-email-verification.ts`** - Server-side function that generates verification links and sends custom emails
3. **`src/app/api/auth/send-verification-email/route.ts`** - API endpoint for sending custom verification emails

### Files Updated

1. **`src/components/registration-form.tsx`** - Updated to use custom email verification
2. **`src/app/verify-email/page.tsx`** - Updated to use custom email verification
3. **`src/app/dashboard/settings/page.tsx`** - Updated to use custom email verification
4. **`src/app/verify-login/page.tsx`** - Updated to use custom email verification

## Email Template

The custom email includes:
- **Sender Name**: noreply
- **From**: noreply@payvost.com
- **Reply To**: noreply@payvost.com
- **Subject**: Verify your email for Payvost
- **Message**: Custom HTML template with your branding

## Firebase Console Configuration

### Step 1: Configure Action URL

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`payvost-web`)
3. Navigate to **Authentication** → **Templates**
4. For **Email address verification**, set the **Action URL** to:
   ```
   https://payvost.com/auth/action
   ```
5. For **Password reset**, set the **Action URL** to the same:
   ```
   https://payvost.com/auth/action
   ```

### Step 2: Verify Email Settings

The email templates in Firebase Console cannot be edited, but the Action URL will redirect users to your custom handler which processes the action codes.

## Environment Variables

Ensure these environment variables are set:

```env
# Custom domain URL (used for action links)
NEXT_PUBLIC_APP_URL=https://payvost.com

# Mailgun configuration (for sending emails)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=payvost.com
MAILGUN_FROM_EMAIL=noreply@payvost.com

# Firebase Admin SDK (for generating action links)
FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_json
# OR
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=base64_encoded_service_account
```

## How It Works

1. **User Registration/Verification Request**:
   - User registers or requests email verification
   - Frontend calls `/api/auth/send-verification-email`
   - API uses Firebase Admin SDK to generate a secure action link
   - Custom email is sent via Mailgun with the action link

2. **User Clicks Email Link**:
   - Link points to `https://payvost.com/auth/action?mode=verifyEmail&oobCode=...`
   - Action handler page extracts the action code
   - Uses Firebase SDK to verify and apply the action code
   - Redirects user to dashboard on success

3. **Password Reset**:
   - Similar flow, but uses `mode=resetPassword`
   - Shows password reset form after verifying the code
   - Confirms password reset using Firebase SDK

## Testing

1. **Test Email Verification**:
   - Register a new user
   - Check email inbox for custom verification email
   - Click the verification link
   - Should redirect to dashboard after verification

2. **Test Password Reset**:
   - Go to forgot password page
   - Enter email address
   - Check email for reset link
   - Click link and set new password
   - Should redirect to login page

## Troubleshooting

### Email Not Sending
- Check Mailgun API key and domain configuration
- Verify `MAILGUN_FROM_EMAIL` is set correctly
- Check Mailgun logs in dashboard

### Action Link Not Working
- Verify `NEXT_PUBLIC_APP_URL` is set to `https://payvost.com`
- Check Firebase Console action URL is configured correctly
- Ensure `/auth/action` route is accessible

### Verification Fails
- Check Firebase Admin SDK is properly initialized
- Verify service account has correct permissions
- Check browser console for error messages

## Security Notes

- Action codes are single-use and expire after a set time
- All action codes are verified server-side using Firebase SDK
- Custom emails maintain the same security as Firebase default emails
- Action handler validates all parameters before processing

## Next Steps

1. Configure Firebase Console with custom action URL
2. Test email verification flow
3. Test password reset flow
4. Monitor email delivery rates
5. Customize email template further if needed (edit `src/lib/custom-email-verification.ts`)

