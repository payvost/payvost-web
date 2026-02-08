'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Loader2, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DEFAULT_KYC_CONFIG } from '@/config/kyc-config';

interface Props {
  userData: any;
}

export function ProfileKycTiersCard({ userData }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC verification tiers</CardTitle>
        <CardDescription>Increase your limits by providing more verification.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={cn(
            'bg-primary/5',
            userData?.kycProfile?.tiers?.tier2?.status === 'approved' && 'bg-green-50 dark:bg-green-950/20'
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tier 2: Verified
              {userData?.kycProfile?.tiers?.tier2?.status === 'approved' && <Badge className="bg-green-500">Approved</Badge>}
              {userData?.kycProfile?.tiers?.tier2?.status === 'submitted' && <Badge variant="secondary">Under review</Badge>}
            </CardTitle>

            {userData?.kycProfile?.tiers?.tier2?.autoApproved && userData?.kycProfile?.tiers?.tier2?.status === 'approved' && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> Auto-approved
                </Badge>
              </div>
            )}

            {userData?.kycProfile?.tiers?.tier2?.confidenceScore && userData?.kycProfile?.tiers?.tier2?.status === 'approved' && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence score</span>
                  <span className="font-semibold">{userData.kycProfile.tiers.tier2.confidenceScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${userData.kycProfile.tiers.tier2.confidenceScore}%` }}
                  />
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <ul className="space-y-2 text-sm">
              {DEFAULT_KYC_CONFIG.tiers.tier2.services?.map((service: string, idx: number) => (
                <li key={idx} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {service}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            {userData?.kycProfile?.tiers?.tier2?.status === 'approved' ? (
              <Button className="w-full" disabled>
                <CheckCircle className="mr-2 h-4 w-4" />
                Tier 2 approved
              </Button>
            ) : userData?.kycProfile?.tiers?.tier2?.status === 'submitted' ||
              userData?.kycProfile?.tiers?.tier2?.status === 'pending_review' ? (
              <Button className="w-full" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Under review
              </Button>
            ) : (
              <Button
                className="w-full"
                asChild
                disabled={
                  userData?.kycTier !== 'tier1' ||
                  (userData?.kycStatus !== 'verified' && userData?.kycStatus !== 'tier1_verified') ||
                  userData?.kycProfile?.tiers?.tier1?.status !== 'approved'
                }
              >
                <Link href="/dashboard/kyc/upgrade-tier2">
                  Upgrade to Tier 2 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card
          className={cn(
            'bg-muted/50',
            userData?.kycProfile?.tiers?.tier3?.status === 'approved' && 'bg-green-50 dark:bg-green-950/20',
            userData?.kycProfile?.tiers?.tier2?.status === 'approved' && userData?.kycProfile?.tiers?.tier3?.status !== 'approved' && 'bg-primary/5'
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tier 3: Verified Pro
              {userData?.kycProfile?.tiers?.tier3?.status === 'approved' && <Badge className="bg-green-500">Approved</Badge>}
              {userData?.kycProfile?.tiers?.tier3?.status === 'submitted' && <Badge variant="secondary">Under review</Badge>}
            </CardTitle>

            {userData?.kycProfile?.tiers?.tier3?.autoApproved && userData?.kycProfile?.tiers?.tier3?.status === 'approved' && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> Auto-approved
                </Badge>
              </div>
            )}

            {userData?.kycProfile?.tiers?.tier3?.confidenceScore && userData?.kycProfile?.tiers?.tier3?.status === 'approved' && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Confidence score</span>
                  <span className="font-semibold">{userData.kycProfile.tiers.tier3.confidenceScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${userData.kycProfile.tiers.tier3.confidenceScore}%` }}
                  />
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <ul
              className={cn(
                'space-y-2 text-sm',
                userData?.kycProfile?.tiers?.tier3?.status === 'locked' && 'text-muted-foreground'
              )}
            >
              {DEFAULT_KYC_CONFIG.tiers.tier3.services?.map((service: string, idx: number) => (
                <li key={idx} className="flex items-center">
                  <CheckCircle
                    className={cn(
                      'h-4 w-4 mr-2',
                      userData?.kycProfile?.tiers?.tier3?.status === 'locked' ? '' : 'text-green-500'
                    )}
                  />
                  {service}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter>
            {userData?.kycProfile?.tiers?.tier3?.status === 'approved' ? (
              <Button className="w-full" disabled>
                <CheckCircle className="mr-2 h-4 w-4" />
                Tier 3 approved
              </Button>
            ) : userData?.kycProfile?.tiers?.tier3?.status === 'submitted' ||
              userData?.kycProfile?.tiers?.tier3?.status === 'pending_review' ? (
              <Button className="w-full" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Under review
              </Button>
            ) : userData?.kycProfile?.tiers?.tier2?.status === 'approved' ? (
              <Button className="w-full" asChild>
                <Link href="/dashboard/kyc/upgrade-tier3">
                  Upgrade to Tier 3 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button className="w-full" disabled>
                Requires Tier 2
              </Button>
            )}
          </CardFooter>
        </Card>
      </CardContent>
    </Card>
  );
}

