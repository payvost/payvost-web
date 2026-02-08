'use client';

import { Building2, Globe, Mail, Phone, User as UserIcon, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export type PersonalInfoValues = {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

interface Props {
  editing: boolean;
  locked: boolean;
  disabled?: boolean;
  email: string;
  country?: string | null;
  values: PersonalInfoValues;
  onChange: (next: Partial<PersonalInfoValues>) => void;
}

export function ProfilePersonalInfoCard({
  editing,
  locked,
  disabled = false,
  email,
  country,
  values,
  onChange,
}: Props) {
  const canEdit = editing && !locked;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal information</CardTitle>
        <CardDescription>
          Manage your personal and contact details.
          {locked && (
            <span className="block mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Your personal information is locked after KYC verification.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Full name
            </Label>
            {canEdit ? (
              <Input
                value={values.name}
                onChange={(e) => onChange({ name: e.target.value })}
                disabled={disabled}
              />
            ) : (
              <p className="font-medium">{values.name || 'N/A'}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email address
            </Label>
            <p className="font-medium">{email || 'N/A'}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone number
            </Label>
            {canEdit ? (
              <Input
                value={values.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="Add phone number"
                disabled={disabled}
              />
            ) : (
              <p className="font-medium">{values.phone || 'Not provided'}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Country
            </Label>
            <p className="font-medium">{country || 'Not set'}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Address
          </Label>
          {canEdit ? (
            <div className="space-y-2">
              <Input
                placeholder="Street address"
                value={values.street}
                onChange={(e) => onChange({ street: e.target.value })}
                disabled={disabled}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={values.city}
                  onChange={(e) => onChange({ city: e.target.value })}
                  disabled={disabled}
                />
                <Input
                  placeholder="State"
                  value={values.state}
                  onChange={(e) => onChange({ state: e.target.value })}
                  disabled={disabled}
                />
                <Input
                  placeholder="ZIP"
                  value={values.zip}
                  onChange={(e) => onChange({ zip: e.target.value })}
                  disabled={disabled}
                />
              </div>
            </div>
          ) : (
            <p className="font-medium">
              {values.street ? `${values.street}, ${values.city}, ${values.state} ${values.zip}` : 'No address provided'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

