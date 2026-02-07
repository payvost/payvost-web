'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, Briefcase, Building, CheckCircle2, ExternalLink, Globe, Sparkles, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPreferences } from '@/hooks/use-user-preferences';

type BusinessProfile = {
  status?: string;
  logoUrl?: string;
  legalName?: string;
  name?: string;
  industry?: string;
  businessType?: string;
  website?: string;
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  'sole-prop': 'Sole Proprietorship',
  llc: 'LLC',
  corporation: 'Corporation',
  'non-profit': 'Non-Profit',
};

function getInitials(name?: string) {
  if (!name) return 'B';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BusinessSettingsPage() {
  const { userData, loading } = useUserPreferences();

  const businessProfile = (userData?.businessProfile as BusinessProfile | undefined) || null;
  const approved =
    businessProfile && (businessProfile.status === 'approved' || businessProfile.status === 'Approved');

  const websiteHref = useMemo(() => {
    if (!businessProfile?.website) return null;
    const raw = businessProfile.website.trim();
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }, [businessProfile?.website]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Business</h2>
        <p className="text-sm text-muted-foreground">Team, company details, and corporate tools.</p>
      </div>

      <Card className={approved ? '' : 'border-dashed'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Business & Corporate Settings
          </CardTitle>
          <CardDescription>
            {approved ? 'Manage your team, roles, and company details.' : 'Manage your team, roles, and company details. (Pro feature)'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : approved ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={businessProfile.logoUrl} alt={businessProfile.legalName || businessProfile.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(businessProfile.legalName || businessProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{businessProfile.legalName || businessProfile.name}</h3>
                      {businessProfile.industry && <p className="text-sm text-muted-foreground">{businessProfile.industry}</p>}
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Approved
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {businessProfile.businessType && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-3.5 w-3.5" />
                        <span>{BUSINESS_TYPE_LABELS[businessProfile.businessType] || businessProfile.businessType}</span>
                      </div>
                    )}

                    {websiteHref && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {businessProfile.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href="/business/settings">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Manage team members
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href="/business/settings">
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company details and documents
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Explore business features</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Unlock tools for managing business finances, team members, and corporate transactions.
                  </p>
                </div>
                <ul className="w-full max-w-sm space-y-1 text-left text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Team member management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Advanced financial controls
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Corporate invoicing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Enhanced security features
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          {approved ? (
            <Button asChild className="w-full">
              <Link href="/business">
                Switch to business dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/get-started">
                Explore business features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

