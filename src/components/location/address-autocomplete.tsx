'use client';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  address?: string;
  properties?: {
    address?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface AddressSelection {
  fullAddress: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onAddressSelected?: (address: AddressSelection) => void;
  countryCode?: string;
  disabled?: boolean;
  error?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

if (typeof window !== 'undefined' && !MAPBOX_TOKEN) {
  console.warn('NEXT_PUBLIC_MAPBOX_TOKEN is not configured; address autocomplete will be disabled.');
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_DELAY = 350;

const extractFromContext = (feature: MapboxFeature, typePrefix: string) => {
  return feature.context?.find((item) => item.id.startsWith(`${typePrefix}.`))?.text;
};

export function AddressAutocomplete({
  value = '',
  onChange,
  onAddressSelected,
  countryCode,
  disabled = false,
  error,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = useCallback(
    async (search: string) => {
      if (!MAPBOX_TOKEN) {
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          autocomplete: 'true',
          limit: '7',
          types: 'address,place,locality',
          language: 'en',
        });
        if (countryCode) {
          params.append('country', countryCode.toLowerCase());
        }
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(search)}.json?${params.toString()}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Mapbox request failed: ${response.status}`);
        }
        const data = await response.json();
        setSuggestions(Array.isArray(data.features) ? data.features.slice(0, 7) : []);
        setIsOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [countryCode]
  );

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const handler = setTimeout(() => {
      fetchSuggestions(query.trim());
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [query, fetchSuggestions, disabled]);

  const handleSelect = useCallback(
    (feature: MapboxFeature) => {
      const streetFallback = feature.properties?.address || feature.address;
      const street = streetFallback ? `${streetFallback} ${feature.text}`.trim() : feature.text;
      const city = extractFromContext(feature, 'place') || extractFromContext(feature, 'locality');
      const state = extractFromContext(feature, 'region');
      const country = extractFromContext(feature, 'country');
      const postalCode = extractFromContext(feature, 'postcode');

      const selection: AddressSelection = {
        fullAddress: feature.place_name,
        street,
        city,
        state,
        country,
        postalCode,
        coordinates: feature.center
          ? { lat: feature.center[1], lng: feature.center[0] }
          : undefined,
      };

      onChange(selection.fullAddress);
      onAddressSelected?.(selection);
      setQuery(selection.fullAddress);
      setSuggestions([]);
      setIsOpen(false);
    },
    [onAddressSelected, onChange]
  );

  const suggestionItems = useMemo(() => {
    if (suggestions.length === 0) {
      return null;
    }
    return suggestions.map((feature) => (
      <button
        type="button"
        key={feature.id}
        className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-muted focus:bg-muted"
        onMouseDown={(event) => {
          event.preventDefault();
          handleSelect(feature);
        }}
      >
        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{feature.text}</p>
          <p className="text-xs text-muted-foreground">{feature.place_name}</p>
        </div>
      </button>
    ));
  }, [suggestions, handleSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!container.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={query}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onChange(next);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder="Start typing your address"
        className={cn(error && 'border-destructive focus-visible:ring-destructive')}
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {isOpen && suggestionItems && (
        <div className="absolute right-0 z-20 mt-2 w-full rounded-md border bg-popover shadow-md">
          <ScrollArea className="max-h-60">
            <div className="p-1">{suggestionItems}</div>
          </ScrollArea>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
