'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

interface CitySelectorProps {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}

export const CitySelector = memo(function CitySelector({
  options,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  placeholder = 'Select a city',
  emptyLabel = 'No cities found',
}: CitySelectorProps) {
  const resolvedValue = value && value.length > 0 ? value : undefined;
  const isDisabled = disabled || isLoading || options.length === 0;

  return (
    <Select value={resolvedValue} onValueChange={onChange} disabled={isDisabled}>
      <SelectTrigger className="w-full transition-opacity duration-200" data-disabled={isDisabled}>
        <SelectValue placeholder={isLoading ? 'Loading cities…' : placeholder} />
        {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
      </SelectTrigger>
      <SelectContent>
        {isLoading && (
          <SelectItem value="loading" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching cities…
          </SelectItem>
        )}
        {!isLoading && options.length === 0 && (
          <SelectItem value="empty" disabled>
            {emptyLabel}
          </SelectItem>
        )}
        {!isLoading &&
          options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
});
