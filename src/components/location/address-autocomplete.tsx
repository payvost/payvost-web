'use client';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// OpenStreetMap Nominatim API response structure
interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
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

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_DELAY = 400; // Slightly longer for Nominatim rate limits
const MAX_RESULTS = 7;

// Extract address components from Nominatim response
const extractAddressFromPlace = (place: NominatimPlace): AddressSelection => {
  const addr = place.address || {};
  
  // Build street address
  const streetParts: string[] = [];
  if (addr.house_number) streetParts.push(addr.house_number);
  if (addr.road) streetParts.push(addr.road);
  const street = streetParts.length > 0 ? streetParts.join(' ') : undefined;
  
  // Get city (can be city, town, village, or municipality)
  const city = addr.city || addr.town || addr.village || addr.municipality;
  
  // Get state/region
  const state = addr.state || addr.region || addr.county;
  
  // Get country
  const country = addr.country;
  
  // Get postal code
  const postalCode = addr.postcode;
  
  return {
    fullAddress: place.display_name,
    street: street || place.display_name.split(',')[0],
    city,
    state,
    country,
    postalCode,
    coordinates: {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    },
  };
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
  const [suggestions, setSuggestions] = useState<NominatimPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = useCallback(
    async (search: string) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        
        // Build Nominatim API URL
        const params = new URLSearchParams({
          q: search,
          format: 'json',
          addressdetails: '1',
          limit: String(MAX_RESULTS),
          dedupe: '1', // Remove duplicates
          extratags: '0',
          namedetails: '0',
        });
        
        // Add country filter if provided
        if (countryCode) {
          params.append('countrycodes', countryCode.toLowerCase());
        }
        
        // Nominatim requires a User-Agent header (their usage policy)
        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Payvost/1.0 (Contact: support@payvost.com)', // Required by Nominatim
          },
        });
        
        if (!response.ok) {
          throw new Error(`Nominatim request failed: ${response.status}`);
        }
        
        const data: NominatimPlace[] = await response.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, MAX_RESULTS) : []);
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
    (place: NominatimPlace) => {
      const selection = extractAddressFromPlace(place);

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
    return suggestions.map((place) => {
      const addr = place.address || {};
      const primaryText = addr.road 
        ? `${addr.house_number || ''} ${addr.road}`.trim() 
        : place.display_name.split(',')[0];
      
      return (
        <button
          type="button"
          key={place.place_id}
          className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-muted focus:bg-muted"
          onMouseDown={(event) => {
            event.preventDefault();
            handleSelect(place);
          }}
        >
          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{primaryText}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{place.display_name}</p>
          </div>
        </button>
      );
    });
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
        placeholder="Enter your street address (e.g., 123 Main St)"
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
