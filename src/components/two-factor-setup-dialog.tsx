'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Smartphone, Mail, Shield, Copy, CheckCircle2, Loader2, Download, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMethod: string | null;
  onSetupComplete: () => void;
}

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  currentMethod,
  onSetupComplete,
}: TwoFactorSetupDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms' | 'authenticator'>('authenticator');
  const [step, setStep] = useState<'select' | 'setup' | 'verify' | 'backup'>('select');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const reset = () => {
    setStep('select');
    setSelectedMethod('authenticator');
    setQrCodeUrl('');
    setSecret('');
    setBackupCodes([]);
    setVerificationCode('');
    setPhoneNumber('');
  };

  const handleMethodSelect = async (method: 'email' | 'sms' | 'authenticator') => {
    setSelectedMethod(method);
    
    if (method === 'authenticator') {
      setStep('setup');
      await setupAuthenticator();
    } else if (method === 'email') {
      setStep('verify');
      await enableEmail();
    } else if (method === 'sms') {
      setStep('setup');
    }
  };

  const setupAuthenticator = async () => {
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/2fa/setup/authenticator', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to setup authenticator');
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup authenticator',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAuthenticator = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/2fa/enable/authenticator', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret,
          verificationCode,
          backupCodes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify code');
      }

      toast({
        title: 'Success!',
        description: 'Authenticator 2FA has been enabled',
      });
      
      setStep('backup');
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const enableEmail = async () => {
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/2fa/enable/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to enable email 2FA');
      }

      const data = await response.json();
      if (Array.isArray(data.backupCodes)) {
        setBackupCodes(data.backupCodes);
      }

      toast({
        title: 'Success!',
        description: 'Email 2FA has been enabled',
      });
      
      setStep('backup');
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to enable email 2FA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const enableSMS = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone Required',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/2fa/enable/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to enable SMS 2FA');
      }
      const data = await response.json();
      if (Array.isArray(data.backupCodes)) {
        setBackupCodes(data.backupCodes);
      }
      toast({
        title: 'Success!',
        description: 'SMS 2FA has been enabled',
      });
      
      setStep('backup');
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to enable SMS 2FA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({
      title: 'Copied!',
      description: 'Backup codes copied to clipboard',
    });
  };

  const downloadBackupCodes = () => {
    const content = `Payvost Two-Factor Authentication Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payvost-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded!',
      description: 'Backup codes saved to file',
    });
  };

  const handleComplete = () => {
    onSetupComplete();
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) reset();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication Setup</DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Choose your preferred two-factor authentication method:
            </p>
            
            <div className="grid gap-4">
              {/* Authenticator App */}
              <button
                onClick={() => handleMethodSelect('authenticator')}
                className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Authenticator App</h3>
                  <p className="text-sm text-muted-foreground">
                    Use apps like Google Authenticator or Authy to generate codes
                  </p>
                  <Badge variant="secondary" className="mt-2">Recommended</Badge>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={() => handleMethodSelect('email')}
                className="flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
              >
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive verification codes via email at {user?.email}
                  </p>
                </div>
              </button>

              {/* SMS */}
              <button
                onClick={() => handleMethodSelect('sms')}
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

        {step === 'setup' && selectedMethod === 'authenticator' && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Scan the QR code below with your authenticator app, or manually enter the secret key.
              </AlertDescription>
            </Alert>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex justify-center py-4">
                  {qrCodeUrl && (
                    <div className="p-4 bg-white rounded-lg border">
                      <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Secret Key (Manual Entry)</Label>
                  <div className="flex gap-2">
                    <Input value={secret} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast({ title: 'Copied!', description: 'Secret key copied to clipboard' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Enter 6-digit code from your app</Label>
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
                  <Button variant="outline" onClick={() => setStep('select')}>
                    Back
                  </Button>
                  <Button onClick={verifyAuthenticator} disabled={loading || verificationCode.length !== 6}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Enable
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}

        {step === 'setup' && selectedMethod === 'sms' && (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Enter your phone number to receive verification codes via SMS.
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
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button onClick={enableSMS} disabled={loading || !phoneNumber}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enable SMS 2FA
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4 py-4">
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Save these backup codes in a secure place. You can use them to access your account if you lose access to your 2FA method.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Backup Codes</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Two-factor authentication has been successfully enabled on your account!
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleComplete} className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                I've Saved My Backup Codes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
