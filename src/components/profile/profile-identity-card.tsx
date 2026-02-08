'use client';

import { BadgeInfo, Fingerprint, Ticket } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { KycStatus } from '@/types/kyc';
import { normalizeKycStatus } from '@/types/kyc';

interface Props {
  idType?: string | null;
  idNumber?: string | null;
  bvn?: string | null;
  kycStatus?: unknown;
}

export function ProfileIdentityCard({ idType, idNumber, bvn, kycStatus }: Props) {
  const currentKycStatus: KycStatus = normalizeKycStatus(typeof kycStatus === 'string' ? kycStatus : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity verification</CardTitle>
        <CardDescription>View your identity verification details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              ID type
            </Label>
            <p className="font-medium">{idType || 'Not provided'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              ID number
            </Label>
            <p className="font-medium">{idNumber || 'Not provided'}</p>
          </div>
        </div>

        {bvn ? (
          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              BVN
            </Label>
            <p className="font-medium">{bvn}</p>
          </div>
        ) : null}

        {currentKycStatus !== 'verified' ? (
          <div className="border bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-300 rounded-lg p-4 flex items-start gap-4 mt-4">
            <BadgeInfo className="h-5 w-5 mt-0.5 text-yellow-600" />
            <div>
              <h4 className="font-semibold">Verification pending</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Your identity documents are under review. You can track the status here.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
