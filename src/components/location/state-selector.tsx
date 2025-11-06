'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { memo } from 'react';

type StateOption = {
  name: string;
  code?: string;
};

interface StateSelectorProps {
  options: StateOption[];
  value?: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}

export const StateSelector = memo(function StateSelector({
  options,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  placeholder = 'Select a state / region',
  emptyLabel = 'No states found',
}: StateSelectorProps) {
  const resolvedValue = value && value.length > 0 ? value : undefined;
  const isDisabled = disabled || isLoading || options.length === 0;

  return (
    <Select value={resolvedValue} onValueChange={onChange} disabled={isDisabled}>
      <SelectTrigger className="w-full transition-opacity duration-200" data-disabled={isDisabled}>
        <SelectValue placeholder={isLoading ? 'Loading states…' : placeholder} />
        {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
      </SelectTrigger>
      <SelectContent>
        {isLoading && (
          <SelectItem value="loading" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching states…
          </SelectItem>
        )}
        {!isLoading && options.length === 0 && (
          <SelectItem value="empty" disabled>
            {emptyLabel}
          </SelectItem>
        )}
        {!isLoading &&
          options.map((option) => (
            <SelectItem key={`${option.code || option.name}`} value={option.name}>
              {option.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
});

export type { StateOption };
