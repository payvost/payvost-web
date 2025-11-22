'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
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
  disabled?: boolean;
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
  disabled = false,
}: SearchableLocationInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    // Open dropdown when user starts typing and options are available
    if (newValue && normalizedOptions.length > 0) {
      setOpen(true);
    } else if (!newValue) {
      setOpen(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (normalizedOptions.length > 0) {
      setSearchQuery(value);
      setOpen(true);
    }
  };

  // Handle input blur - close popover after a delay to allow clicks
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't close if focus is moving to the dropdown
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('[cmdk-list]') || relatedTarget?.closest('[cmdk-item]')) {
      return;
    }
    setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Show dropdown button only when options are available
  const showDropdown = normalizedOptions.length > 0 && !isLoading;
  const displayValue = value || '';

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isLoading ? 'Loading options…' : placeholder}
          disabled={disabled || isLoading}
          className={cn(showDropdown && 'pr-10', className)}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground pointer-events-none z-10" />
        )}
        {!isLoading && showDropdown && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
              if (!open) {
                inputRef.current?.focus();
              }
            }}
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        )}
      </div>
      {showDropdown && open && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg">
          <Command shouldFilter={false}>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {searchQuery ? (
                  <div className="py-4 text-center text-sm">
                    <p className="text-muted-foreground">{emptyLabel}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Continue typing to enter manually
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    {emptyLabel}
                  </div>
                )}
              </CommandEmpty>
              {filteredOptions.length > 0 && (
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
                            'mr-2 h-4 w-4 shrink-0',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{option.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {searchQuery && filteredOptions.length === 0 && normalizedOptions.length > 0 && (
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
        </div>
      )}
      {helperText && (
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

