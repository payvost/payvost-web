'use client';

import { useMemo, useState } from 'react';
import { Globe, Contrast, Type, Sun, Clock } from 'lucide-react';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { LanguagePreference } from '@/types/language';

const TIMEZONES = [
  { value: 'system', label: 'System default' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Chicago', label: 'America/Chicago' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi' },
];

export default function AppearanceSettingsPage() {
  const { toast } = useToast();
  const { preferences, updatePreferences, loading } = useUserPreferences();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const timezoneValue = preferences.timezone ?? 'system';

  const setPref = async (key: string, partial: any) => {
    setBusyKey(key);
    try {
      const ok = await updatePreferences(partial);
      if (!ok) throw new Error('Update failed');
    } catch (err) {
      console.error('Appearance preference update failed:', err);
      toast({
        title: 'Update failed',
        description: 'Could not save your preference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const languageOptions = useMemo(
    () =>
      [
        { value: 'en', label: 'English' },
        { value: 'fr', label: 'Francais' },
        { value: 'es', label: 'Espanol' },
      ] as Array<{ value: LanguagePreference; label: string }>,
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">Adjust the look and accessibility of the app.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance & Accessibility</CardTitle>
          <CardDescription>These preferences apply across your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Label className="flex items-center">
              <Sun className="mr-2 h-4 w-4" />
              Theme
            </Label>
            <ThemeSwitcher />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center">
              <Type className="mr-2 h-4 w-4" />
              Font size
            </Label>
            <RadioGroup
              value={String(preferences.fontScale)}
              onValueChange={(v) => setPref('fontScale', { fontScale: Number(v) as any })}
              disabled={loading || busyKey === 'fontScale'}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <Label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                <RadioGroupItem value="0.9" />
                Small
              </Label>
              <Label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                <RadioGroupItem value="1" />
                Default
              </Label>
              <Label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
                <RadioGroupItem value="1.1" />
                Large
              </Label>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label className="flex items-center">
              <Contrast className="mr-2 h-4 w-4" />
              High contrast
            </Label>
            <Switch
              checked={preferences.highContrast}
              disabled={loading || busyKey === 'highContrast'}
              onCheckedChange={(checked) => setPref('highContrast', { highContrast: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Language
            </Label>
            <Select
              value={preferences.language}
              onValueChange={(v) => setPref('language', { language: v as LanguagePreference })}
              disabled={loading || busyKey === 'language'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Time zone
            </Label>
            <Select
              value={timezoneValue}
              onValueChange={(v) => setPref('timezone', { timezone: v === 'system' ? null : v })}
              disabled={loading || busyKey === 'timezone'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={() => toast({ title: 'Saved', description: 'Your preferences are stored automatically.' })}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

