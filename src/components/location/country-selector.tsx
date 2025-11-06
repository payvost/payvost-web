'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

type CountryOption = {
  iso2: string;
  name: string;
  callingCodes: string[];
  flagCode?: string;
};

interface CountrySelectorProps {
  options: CountryOption[];
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const CountrySelector = memo(function CountrySelector({
  options,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  placeholder = 'Select a country',
}: CountrySelectorProps) {
  const resolvedValue = value && value.length > 0 ? value : undefined;

  const getFlagEmoji = (iso?: string) => {
    if (!iso || iso.length !== 2) return '';
    const base = 127397;
    const chars = iso.toUpperCase().split('');
    return String.fromCodePoint(...chars.map((char) => base + char.charCodeAt(0)));
  };

  const getOptionFlag = (option: CountryOption) => {
    return getFlagEmoji(option.flagCode || option.iso2);
  };

  return (
    <Select value={resolvedValue} onValueChange={onChange} disabled={disabled || isLoading || options.length === 0}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading countries…' : placeholder} />
        {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.iso2} value={option.iso2}>
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-lg" role="img">
                {getOptionFlag(option)}
              </span>
              <span>{option.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export type { CountryOption };
