# Firebase MFA Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Firebase Multi-Factor Authentication (MFA) implementation in the Payvost Web application.

## Prerequisites

### 1. Firebase Console Configuration
- Go to [Firebase Console](https://console.firebase.google.com)
- Select your project
- Navigate to **Authentication > Sign-in method**
- Scroll to **Multi-factor authentication**
- Ensure MFA is enabled (Advanced tab)
- Click **Enroll** to enable TOTP and/or SMS

### 2. Email Template Configuration
Email notifications are automatically sent by Firebase when:
- User enrolls in MFA
- User unenrolls from MFA
- User signs in with MFA

To customize email templates:
1. Go to **Authentication > Templates**
2. Select email templates to customize:
   - **MFA enrollment notification**
   - **MFA unenrollment notification**
   - **MFA sign-in notification**

### 3. SMS Configuration (Optional)
For SMS-based MFA:
- Ensure Firebase Blaze (pay-as-you-go) plan is active
- Configure phone authentication in Firebase Console
- Add test phone numbers if needed

## Test Scenarios

### Scenario 1: TOTP (Authenticator App) Enrollment

#### Steps:
1. **Login to the application**
   - Navigate to login page
   - Enter valid credentials
   - Click "Sign In"

2. **Navigate to Profile**
   - Click on user menu
   - Select "Profile"

3. **Open 2FA Settings**
   - Scroll to "Two-Factor Authentication" section
   - Current status should show "Disabled"

4. **Enroll TOTP**
   - Click "Set Up Two-Factor Authentication"
   - Select "Authenticator App" tab
   - QR code should be displayed

5. **Scan QR Code**
   - Open authenticator app (Google Authenticator, Authy, etc.)
   - Scan the QR code
   - Enter the 6-digit code from the app
   - Click "Enable TOTP"

6. **Verify Enrollment**
   - Success toast should appear
   - 2FA status should show "Enabled"
   - Method should show "Authenticator App"

7. **Check Email**
   - Check inbox for MFA enrollment notification email from Firebase
   - Email should contain:
     - Notification that 2FA was enabled
     - Account security information
     - Date/time of enrollment

#### Expected Results:
✅ QR code generates correctly
✅ TOTP code verification succeeds
✅ UI updates to show "Enabled" status
✅ Firebase sends enrollment email notification
✅ Firestore `users` collection updates with MFA status

---

### Scenario 2: SMS (Phone Number) Enrollment

#### Steps:
1. **Open 2FA Setup Dialog**
   - Follow steps 1-4 from Scenario 1

2. **Select SMS Tab**
   - Click "Phone Number" tab
   - Enter phone number with country code (e.g., +1234567890)

3. **Complete reCAPTCHA**
   - reCAPTCHA widget should appear
   - Complete the verification

4. **Enter SMS Code**
   - SMS with 6-digit code should be sent to phone
   - Enter the code
   - Click "Enable SMS"

5. **Verify Enrollment**
   - Success toast should appear
   - 2FA status should show "Enabled"
   - Method should show "Phone Number"

6. **Check Email**
   - Email notification should arrive confirming SMS MFA enrollment

#### Expected Results:
✅ reCAPTCHA loads correctly
✅ SMS code is sent and received
✅ Code verification succeeds
✅ UI updates to show "Enabled" status
✅ Firebase sends enrollment email notification

---

### Scenario 3: Sign-In with MFA (TOTP)

#### Steps:
1. **Sign Out**
   - Click user menu
   - Select "Sign Out"

2. **Sign In Again**
   - Navigate to login page
   - Enter email and password
   - Click "Sign In"

3. **Handle MFA Challenge**
   - 2FA verification dialog should appear
   - Open authenticator app
   - Get current 6-digit code
   - Enter code in the dialog
   - Click "Verify"

4. **Verify Sign-In**
   - User should be redirected to dashboard
   - Success toast should appear
   - Session should be active

5. **Check Email**
   - Email notification should arrive confirming MFA sign-in

#### Expected Results:
✅ MFA challenge triggered automatically
✅ Dialog displays correctly
✅ Code verification succeeds
✅ User redirected to dashboard
✅ Firebase sends sign-in email notification

---

### Scenario 4: Sign-In with MFA (SMS)

#### Steps:
1. Follow same steps as Scenario 3
2. When MFA dialog appears, SMS code should be sent automatically
3. Enter SMS code
4. Complete verification

#### Expected Results:
✅ SMS sent automatically on sign-in
✅ Code verification succeeds
✅ User redirected to dashboard
✅ Email notification received

---

### Scenario 5: MFA Unenrollment

#### Steps:
1. **Navigate to Profile**
   - Login with MFA (follow Scenario 3)
   - Go to Profile page

2. **Open 2FA Settings**
   - Scroll to "Two-Factor Authentication" section
   - Status should show "Enabled"

3. **Disable 2FA**
   - Click "Disable Two-Factor Authentication"
   - Confirm the action

4. **Verify Unenrollment**
   - Success toast should appear
   - Status should show "Disabled"
   - "Set Up" button should reappear

5. **Check Email**
   - Email notification should arrive confirming MFA unenrollment

6. **Test Sign-In**
   - Sign out and sign in again
   - Should NOT trigger MFA challenge
   - Should proceed directly to dashboard

#### Expected Results:
✅ Unenrollment succeeds
✅ UI updates to show "Disabled" status
✅ Firebase sends unenrollment email notification
✅ Subsequent sign-ins do NOT trigger MFA

---

## Troubleshooting

### Issue: QR Code Not Displaying
**Solution:**
- Check browser console for errors
- Ensure `qrcode` library is installed: `npm install qrcode`
- Verify Firebase auth is initialized

### Issue: "Invalid Code" Error
**Solution:**
- Ensure authenticator app time is synced (Settings > Time correction)
- Try generating a new secret
- Verify code is entered within time window (30 seconds)

### Issue: SMS Not Received
**Solution:**
- Verify phone number format includes country code
- Check Firebase Console quota limits
- Ensure Blaze plan is active
- Add phone as test number in Firebase Console

### Issue: Email Notifications Not Received
**Solution:**
- Check Firebase Console email template configuration
- Verify sender email is not marked as spam
- Check Firebase email quota limits
- Ensure "Send email verification" is enabled in Firebase Console

### Issue: "auth/multi-factor-auth-required" Error Not Caught
**Solution:**
- Check login form error handling
- Verify `error.code === 'auth/multi-factor-auth-required'`
- Ensure `error.resolver` is stored correctly
- Check browser console for detailed error messages

### Issue: reCAPTCHA Not Loading
**Solution:**
- Ensure site is running on localhost or registered domain
- Check Firebase Console for allowed domains
- Verify reCAPTCHA v2 is enabled
- Clear browser cache

---

## Automated Testing

### Unit Tests
Create tests for:
- TOTP secret generation
- Code verification logic
- MFA status API endpoints
- UI component rendering

### Integration Tests
Test full flows:
- End-to-end enrollment
- End-to-end sign-in with MFA
- End-to-end unenrollment

### Example Test (Jest + Testing Library)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FirebaseMFASetupDialog } from '@/components/firebase-mfa-setup-dialog';

describe('FirebaseMFASetupDialog', () => {
  it('should generate QR code for TOTP', async () => {
    render(<FirebaseMFASetupDialog open={true} onOpenChange={() => {}} />);
    
    const totpTab = screen.getByRole('tab', { name: /authenticator app/i });
    fireEvent.click(totpTab);
    
    await waitFor(() => {
      const qrCode = screen.getByAltText('QR Code');
      expect(qrCode).toBeInTheDocument();
    });
  });
});
```

---

## Manual Testing Checklist

### Enrollment
- [ ] TOTP QR code displays correctly
- [ ] TOTP code verification works
- [ ] SMS reCAPTCHA loads
- [ ] SMS code verification works
- [ ] Enrollment email received
- [ ] Firestore updated correctly
- [ ] UI shows "Enabled" status

### Sign-In
- [ ] MFA challenge triggered for TOTP
- [ ] MFA challenge triggered for SMS
- [ ] Invalid code rejected
- [ ] Valid code accepted
- [ ] Sign-in email received
- [ ] User redirected to dashboard

### Unenrollment
- [ ] Disable button works
- [ ] Unenrollment email received
- [ ] UI shows "Disabled" status
- [ ] Subsequent sign-ins skip MFA

### Edge Cases
- [ ] Multiple failed code attempts
- [ ] Expired TOTP codes rejected
- [ ] Invalid phone number format rejected
- [ ] Email not verified scenario handled
- [ ] Network errors handled gracefully

---

## Security Considerations

### Best Practices Verified
- [ ] Secrets generated server-side (Firebase handles this)
- [ ] QR codes not logged or stored
- [ ] Backup codes not needed (Firebase manages recovery)
- [ ] Rate limiting on verification attempts
- [ ] TOTP time window is 30 seconds (Firebase default)
- [ ] Email notifications sent for all MFA events

### Compliance
- [ ] Users can opt-in/opt-out of MFA
- [ ] Clear instructions provided
- [ ] Email notifications sent for security events
- [ ] Recovery options available (email-based)

---

## Production Deployment Checklist

Before deploying to production:
- [ ] Firebase MFA enabled in production project
- [ ] Email templates customized with brand styling
- [ ] SMS quota limits configured appropriately
- [ ] reCAPTCHA domains whitelisted
- [ ] All test scenarios pass
- [ ] Email deliverability tested
- [ ] User documentation updated
- [ ] Support team trained on MFA troubleshooting

---

## Monitoring

### Metrics to Track
- MFA enrollment rate
- MFA verification success rate
- Email delivery rate
- SMS delivery rate (if enabled)
- Failed verification attempts

### Firebase Analytics Events
Consider logging:
- `mfa_enrollment_started`
- `mfa_enrollment_completed`
- `mfa_verification_attempted`
- `mfa_verification_succeeded`
- `mfa_verification_failed`
- `mfa_unenrollment_completed`

---

## Support Resources

### Documentation
- [Firebase MFA Documentation](https://firebase.google.com/docs/auth/web/multi-factor)
- [TOTP Standard (RFC 6238)](https://tools.ietf.org/html/rfc6238)
- Internal: `/docs/FIREBASE_MFA_INTEGRATION.md`

### Contact
For issues or questions:
- Open GitHub issue
- Contact Firebase support
- Check Firebase Console status page
