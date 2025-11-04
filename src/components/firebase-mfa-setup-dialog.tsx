'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Smartphone, Shield, Loader2, AlertTriangle, CheckCircle2, QrCode, Fingerprint } from 'lucide-react';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth';
import Image from 'next/image';

interface FirebaseMFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetupComplete: () => void;
}

export function FirebaseMFASetupDialog({
  open,
  onOpenChange,
  onSetupComplete,
}: FirebaseMFASetupDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | null>(null);
  const [step, setStep] = useState<'select' | 'setup' | 'verify' | 'complete'>('select');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [totpNotEnabled, setTotpNotEnabled] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const reset = () => {
    setStep('select');
    setSelectedMethod(null);
    setQrCodeUrl('');
    setTotpSecret(null);
    setVerificationCode('');
    setPhoneNumber('');
    setVerificationId('');
  };

  const setupTOTP = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Step 1: Get multi-factor session
      const multiFactorSession = await multiFactor(user).getSession();
      
      // Step 2: Generate TOTP secret
      const secret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
      setTotpSecret(secret);
      
      // Step 3: Generate QR code URL
      const qrUrl = secret.generateQrCodeUrl(user.email || 'user@payvost.com', 'Payvost');
      setQrCodeUrl(qrUrl);
      
      setStep('verify');
    } catch (error: any) {
      console.error('TOTP setup error:', error);
      if (error?.code === 'auth/operation-not-allowed') {
        // TOTP factor not enabled in Firebase Console
        setTotpNotEnabled(true);
        setStep('select');
        setSelectedMethod(null);
        toast({
          title: 'Authenticator not enabled',
          description: 'TOTP-based MFA is not enabled for this Firebase project. An admin must enable it in Firebase Console > Authentication > Sign-in method > Multi-factor authentication (TOTP).',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Setup Failed',
          description: error.message || 'Failed to setup authenticator',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!user || !totpSecret || verificationCode.length !== 6) return;
    
    setLoading(true);
    try {
      // Generate assertion with the verification code
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );
      
      // Enroll the factor
      await multiFactor(user).enroll(multiFactorAssertion, 'Authenticator App');
      
      // Record enrollment in Firestore
      const idToken = await user.getIdToken();
      await fetch('/api/2fa/enable/authenticator', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: 'Authenticator App' }),
      });

      toast({
        title: 'Success!',
        description: 'Authenticator 2FA has been enabled. Check your email for confirmation.',
      });
      
      setStep('complete');
    } catch (error: any) {
      console.error('TOTP verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupSMS = async () => {
    if (!user || !phoneNumber) return;
    
    setLoading(true);
    try {
      const { auth } = await import('@/lib/firebase');
      
      // Setup reCAPTCHA (required for phone auth)
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      
      // Get multi-factor session
      const multiFactorSession = await multiFactor(user).getSession();
      
      // Send verification code to phone
      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession,
      };
      
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );
      
      setVerificationId(verificationId);
      setStep('verify');
    } catch (error: any) {
      console.error('SMS setup error:', error);
      if (error?.code === 'auth/operation-not-allowed') {
        toast({
          title: 'SMS not enabled',
          description: 'SMS-based MFA is not enabled for this Firebase project. An admin must enable Phone sign-in and MFA (SMS) in Firebase Console.',
          variant: 'destructive',
        });
        setStep('select');
        setSelectedMethod(null);
      } else {
        toast({
          title: 'Setup Failed',
          description: error.message || 'Failed to send SMS code',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifySMS = async () => {
    if (!user || !verificationId || verificationCode.length !== 6) return;
    
    setLoading(true);
    try {
      // Create phone credential
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      // Enroll the factor
      await multiFactor(user).enroll(multiFactorAssertion, phoneNumber);
      
      // Record enrollment in Firestore
      const idToken = await user.getIdToken();
      await fetch('/api/2fa/enable/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      toast({
        title: 'Success!',
        description: 'SMS 2FA has been enabled. Check your email for confirmation.',
      });
      
      setStep('complete');
    } catch (error: any) {
      console.error('SMS verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onSetupComplete();
    reset();
    onOpenChange(false);
  };

  return (
    <>
      <div id="recaptcha-container"></div>
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication Setup</DialogTitle>
            <DialogDescription>
              Add an extra layer of security using Firebase Authentication
            </DialogDescription>
          </DialogHeader>

          {step === 'select' && (
            <div className="space-y-4 py-4">
              {totpNotEnabled && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Authenticator (TOTP) is not enabled for this Firebase project. Please ask an admin to enable it in
                    Authentication → Sign-in method → Multi-factor authentication → TOTP.
                  </AlertDescription>
                </Alert>
              )}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Firebase will send you an email confirmation when 2FA is enabled.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                Choose your preferred two-factor authentication method:
              </p>
              
              <div className="grid gap-4">
                {/* Authenticator App */}
                <button
                  onClick={() => {
                    setSelectedMethod('totp');
                    setStep('setup');
                    setupTOTP();
                  }}
                  disabled={totpNotEnabled}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Authenticator App</h3>
                    <p className="text-sm text-muted-foreground">
                      Use apps like Google Authenticator or Authy (Recommended)
                    </p>
                    {totpNotEnabled && (
                      <p className="text-xs text-destructive mt-1">
                        Disabled by admin. Enable TOTP in Firebase Console to use this option.
                      </p>
                    )}
                  </div>
                </button>

                {/* SMS */}
                <button
                  onClick={() => {
                    setSelectedMethod('sms');
                    setStep('setup');
                  }}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
                >
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">SMS / Text Message</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive verification codes via text message
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'setup' && selectedMethod === 'totp' && (
            <div className="space-y-4 py-4 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          )}

          {step === 'setup' && selectedMethod === 'sms' && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertDescription>
                  Enter your phone number to receive a verification code.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must include country code (e.g., +1 for US)
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('select')}>
                  Back
                </Button>
                <Button onClick={setupSMS} disabled={loading || !phoneNumber}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Code
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'verify' && selectedMethod === 'totp' && (
            <div className="space-y-4 py-4">
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  Scan this QR code with your authenticator app, then enter the 6-digit code.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center py-4">
                {qrCodeUrl && (
                  <div className="p-4 bg-white rounded-lg border">
                    <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-center block">Enter 6-digit code from your app</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setStep('select'); reset(); }}>
                  Cancel
                </Button>
                <Button onClick={verifyTOTP} disabled={loading || verificationCode.length !== 6}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'verify' && selectedMethod === 'sms' && (
            <div className="space-y-4 py-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Enter the 6-digit code sent to {phoneNumber}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-center block">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setStep('select'); reset(); }}>
                  Cancel
                </Button>
                <Button onClick={verifySMS} disabled={loading || verificationCode.length !== 6}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4 py-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Two-factor authentication has been successfully enabled! 
                  <br />
                  <strong>Check your email</strong> for a confirmation from Firebase.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  What happens next?
                </h4>
                <ul className="text-sm space-y-1 ml-6 list-disc">
                  <li>You'll need your {selectedMethod === 'totp' ? 'authenticator app' : 'phone'} to sign in</li>
                  <li>Firebase sent a confirmation email to your registered address</li>
                  <li>You can disable 2FA anytime from your profile settings</li>
                </ul>
              </div>

              <DialogFooter>
                <Button onClick={handleComplete} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
