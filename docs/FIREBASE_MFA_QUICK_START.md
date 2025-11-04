# Firebase MFA Quick Start Guide

## For Developers

### Prerequisites
1. Firebase project with Authentication enabled
2. Firebase MFA enabled in console
3. Environment variables configured

### Setup Steps

#### 1. Enable MFA in Firebase Console
```
1. Go to https://console.firebase.google.com
2. Select your project
3. Authentication > Sign-in method
4. Scroll to "Multi-factor authentication"
5. Click "Enable" for TOTP and/or SMS
```

#### 2. Configure Email Templates (Optional)
```
1. Authentication > Templates
2. Customize:
   - MFA enrollment notification
   - MFA unenrollment notification
   - MFA sign-in notification
```

#### 3. Test TOTP Enrollment
```typescript
// User flow:
1. Login to app
2. Go to Profile
3. Click "Set Up Two-Factor Authentication"
4. Select "Authenticator App"
5. Scan QR code with Google Authenticator
6. Enter 6-digit code
7. Click "Enable TOTP"
8. Check email for enrollment notification
```

#### 4. Test Sign-In with MFA
```typescript
// User flow:
1. Sign out
2. Sign in with email/password
3. MFA dialog appears automatically
4. Open authenticator app
5. Enter current 6-digit code
6. Click "Verify"
7. Redirected to dashboard
8. Check email for sign-in notification
```

### Code Examples

#### Client-Side: Enroll TOTP
```typescript
import { getAuth, multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

// Generate secret
const totpSession = await multiFactor(user).getSession();
const totpSecret = await TotpMultiFactorGenerator.generateSecret(totpSession);

// Display QR code
const qrCodeUrl = totpSecret.generateQrCodeUrl(user.email!, 'Payvost');

// After user scans and enters code
const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code);
await multiFactor(user).enroll(assertion, 'TOTP');

// Record in Firestore (optional)
await fetch('/api/2fa/enable/authenticator', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${await user.getIdToken()}` }
});
```

#### Client-Side: Sign-In with MFA
```typescript
import { signInWithEmailAndPassword, multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  if (error.code === 'auth/multi-factor-auth-required') {
    const resolver = error.resolver;
    const selectedHint = resolver.hints[0];
    
    // Get code from user
    const code = prompt('Enter 2FA code');
    
    // Create assertion
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(
      selectedHint.uid,
      code
    );
    
    // Resolve sign-in
    const credential = await resolver.resolveSignIn(assertion);
    console.log('Signed in:', credential.user);
  }
}
```

#### Server-Side: Check MFA Status
```typescript
import { getAuth } from 'firebase-admin/auth';

const auth = getAuth();
const user = await auth.getUser(userId);

// Check enrolled factors
const enrolledFactors = user.multiFactor?.enrolledFactors || [];

if (enrolledFactors.length > 0) {
  console.log('MFA enabled');
  console.log('Factors:', enrolledFactors.map(f => f.factorId));
} else {
  console.log('MFA disabled');
}
```

### File Structure

```
src/
├── components/
│   ├── firebase-mfa-setup-dialog.tsx  # Enrollment UI
│   ├── two-factor-settings.tsx        # Profile settings
│   └── login-form.tsx                 # Sign-in with MFA
├── server/
│   └── twoFactorService.ts            # Backend service
└── app/
    └── api/
        └── 2fa/
            ├── status/route.ts        # GET MFA status
            ├── enable/
            │   ├── authenticator/route.ts
            │   └── sms/route.ts
            └── disable/route.ts
```

### API Endpoints

#### GET /api/2fa/status
```typescript
// Returns current MFA status
{
  enabled: boolean,
  method: 'totp' | 'phone' | null,
  enrolledAt: string | null
}
```

#### POST /api/2fa/enable/authenticator
```typescript
// Records TOTP enrollment
Headers: Authorization: Bearer <idToken>
Response: { success: true }
```

#### POST /api/2fa/disable
```typescript
// Records MFA unenrollment
Headers: Authorization: Bearer <idToken>
Response: { success: true }
```

### Testing

#### Local Testing
```bash
# Start development server
npm run dev

# Test TOTP
1. Visit http://localhost:3000
2. Login with test account
3. Go to Profile
4. Enable 2FA with authenticator app
5. Sign out and sign in again
```

#### Authenticator Apps
- Google Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- Microsoft Authenticator
- 1Password

### Common Issues

#### Issue: QR code not displaying
```typescript
// Solution: Install qrcode library
npm install qrcode
```

#### Issue: "Invalid code" error
```typescript
// Solution: Sync time on device
// iOS: Settings > General > Date & Time > Set Automatically
// Android: Settings > Date & Time > Automatic date & time
```

#### Issue: Email notifications not received
```typescript
// Solution: Check Firebase Console
1. Authentication > Templates
2. Verify email settings
3. Check spam folder
4. Test with different email provider
```

#### Issue: SMS not working
```typescript
// Solution: 
1. Ensure Firebase Blaze plan active
2. Check SMS quota in console
3. Verify phone number format: +1234567890
4. Add test phone numbers in console for testing
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend (for API routes)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Security Best Practices

✅ **DO:**
- Use Firebase Admin SDK on server-side
- Validate ID tokens in API routes
- Store MFA metadata in Firestore (optional)
- Send email notifications for all MFA events
- Use HTTPS in production
- Implement rate limiting

❌ **DON'T:**
- Log TOTP secrets
- Store secrets in localStorage
- Bypass email verification
- Allow MFA without email verification
- Share QR codes
- Use test phone numbers in production

### Debugging

#### Enable Firebase Debug Logging
```typescript
// src/lib/firebase.ts
import { setLogLevel } from 'firebase/auth';

if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}
```

#### Check Firebase Console Logs
```
1. Firebase Console > Authentication > Users
2. Click on user
3. View "Sign-in activity"
4. Check for MFA events
```

#### Browser DevTools
```javascript
// Check current user's MFA status
const user = firebase.auth().currentUser;
console.log('Enrolled factors:', user?.multiFactor?.enrolledFactors);
```

### Resources

**Documentation:**
- [Firebase MFA Docs](https://firebase.google.com/docs/auth/web/multi-factor)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- Internal: `/docs/FIREBASE_MFA_INTEGRATION.md`
- Testing Guide: `/docs/FIREBASE_MFA_TESTING.md`

**Code Examples:**
- Setup Dialog: `/src/components/firebase-mfa-setup-dialog.tsx`
- Login Form: `/src/components/login-form.tsx`
- Settings: `/src/components/two-factor-settings.tsx`

### Support

**For Issues:**
1. Check `/docs/FIREBASE_MFA_TESTING.md` troubleshooting section
2. Review Firebase Console error logs
3. Check browser console for detailed errors
4. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Browser/device info

**For Questions:**
- Slack: #payvost-dev
- Email: dev@payvost.com
- GitHub Discussions

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build
```

## Next Steps

1. ✅ Complete this guide
2. ✅ Test TOTP enrollment
3. ✅ Test sign-in with MFA
4. ✅ Verify email notifications
5. ⏳ Deploy to staging
6. ⏳ User acceptance testing
7. ⏳ Deploy to production

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Implementation Complete
