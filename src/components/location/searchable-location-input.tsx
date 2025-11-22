'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LocationOption = {
  name: string;
  code?: string;
};

interface SearchableLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  options: LocationOption[] | string[];
  isLoading?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  helperText?: string;
  id?: string;
  className?: string;
}

// Fuzzy search function
const fuzzyMatch = (query: string, text: string): boolean => {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase().trim();
  
  if (!normalizedQuery) return true;
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Simple fuzzy matching: check if all query characters appear in order
  let queryIndex = 0;
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === normalizedQuery.length;
};

export function SearchableLocationInput({
  value,
  onChange,
  options,
  isLoading = false,
  placeholder = 'Type to search or enter manually',
  emptyLabel = 'No options found',
  helperText,
  id,
  className,
}: SearchableLocationInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options to LocationOption format
  const normalizedOptions: LocationOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { name: opt };
      }
      return opt;
    });
  }, [options]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return normalizedOptions;
    }
    return normalizedOptions.filter((option) => fuzzyMatch(searchQuery, option.name));
  }, [normalizedOptions, searchQuery]);

  // Check if current value matches an option
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return normalizedOptions.find(
      (opt) => opt.name.toLowerCase() === value.toLowerCase()
    );
  }, [normalizedOptions, value]);

  // Handle option selection
  const handleSelect = (optionName: string) => {
    onChange(optionName);
    setOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchQuery(newValue);
    if (newValue && !open && normalizedOptions.length > 0) {
      setOpen(true);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (normalizedOptions.length > 0 && value) {
      setSearchQuery(value);
      setOpen(true);
    }
  };

  // Handle input blur - close popover after a delay to allow clicks
  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  // Show dropdown button only when options are available
  const showDropdown = normalizedOptions.length > 0 && !isLoading;
  const displayValue = value || '';

  return (
    <div className="relative">
      <Popover open={open && showDropdown} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isLoading ? 'Loading options…' : placeholder}
            disabled={isLoading}
            className={cn(showDropdown && 'pr-10', className)}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none" />
          )}
          {!isLoading && showDropdown && (
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(!open);
                  inputRef.current?.focus();
                }}
                tabIndex={-1}
              >
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
          )}
        </div>
        {showDropdown && (
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search options..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery ? (
                    <div className="py-4 text-center text-sm">
                      <p className="text-muted-foreground">{emptyLabel}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Continue typing to enter manually
                      </p>
                    </div>
                  ) : (
                    emptyLabel
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const isSelected = selectedOption?.name === option.name;
                    return (
                      <CommandItem
                        key={option.code || option.name}
                        value={option.name}
                        onSelect={() => handleSelect(option.name)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {option.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {searchQuery && filteredOptions.length === 0 && (
                  <CommandGroup>
                    <CommandItem
                      value={searchQuery}
                      onSelect={() => handleSelect(searchQuery)}
                      className="text-muted-foreground"
                    >
                      <span className="text-sm">Use "{searchQuery}"</span>
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      {helperText && (
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

