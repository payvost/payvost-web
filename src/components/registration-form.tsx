'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, UploadCloud, Eye, EyeOff, Camera, ChevronsUpDown, Check, ShieldX, ArrowLeft, ArrowRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { signInWithCustomToken, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { TransactionPinSetupDialog } from './transaction-pin-setup-dialog';
import { collection as fsCollection, query as fsQuery, where as fsWhere, limit as fsLimit, getDocs as fsGetDocs } from 'firebase/firestore';
import { CountrySelector, CountryOption } from '@/components/location/country-selector';
import { StateSelector, StateOption } from '@/components/location/state-selector';
import { CitySelector } from '@/components/location/city-selector';
import { AddressAutocomplete, AddressSelection } from '@/components/location/address-autocomplete';
import { SearchableLocationInput } from '@/components/location/searchable-location-input';
import {
  SUPPORTED_COUNTRIES,
  DEFAULT_KYC_CONFIG,
  KYC_DYNAMIC_FIELD_NAMES,
  type CountryKycConfig,
  type KycTierConfig,
  type KycTierKey,
  type SupportedCountry,
} from '@/config/kyc-config';
import { Badge } from '@/components/ui/badge';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const checkPasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20; // Special characters
    return Math.min(100, score);
}

const dynamicFieldsShape: Record<(typeof KYC_DYNAMIC_FIELD_NAMES)[number], z.ZodOptional<z.ZodString>> =
  {} as Record<(typeof KYC_DYNAMIC_FIELD_NAMES)[number], z.ZodOptional<z.ZodString>>;

for (const field of KYC_DYNAMIC_FIELD_NAMES) {
  dynamicFieldsShape[field] = z.string().optional();
}

const dynamicFieldsSchema = z.object(dynamicFieldsShape);

interface RemoteStateResponse {
  name: string;
  state_code?: string;
  isoCode?: string;
}

const isRemoteState = (value: unknown): value is RemoteStateResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.name !== 'string' || record.name.trim().length === 0) {
    return false;
  }

  if (record.state_code !== undefined && typeof record.state_code !== 'string') {
    return false;
  }

  if (record.isoCode !== undefined && typeof record.isoCode !== 'string') {
    return false;
  }

  return true;
};

type ErrorWithCode = {
  code?: string;
  message?: string;
};

const isErrorWithCode = (value: unknown): value is ErrorWithCode => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const hasCode = typeof record.code === 'string';
  const hasMessage = typeof record.message === 'string';
  return hasCode || hasMessage;
};

const registrationSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    countryCode: z.string().min(1, 'Country code is required'),
    phone: z.string().min(5, 'A valid phone number is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => checkPasswordStrength(password) >= 80, {
        message: 'Password is not strong enough. Aim for at least 80% strength.',
      }),
    confirmPassword: z.string().min(8, 'Passwords must match'),
    dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
    country: z.string().min(1, 'Country is required'),
    photo: z
      .any()
      .refine((files) => files?.length > 0, 'A profile photo is required.')
      .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
      .refine(
        (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        'Only .jpg, .jpeg, .png and .webp formats are supported.',
      ),
    street: z.string().min(2, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    zip: z.string().min(4, 'ZIP/Postal code is required'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .merge(dynamicFieldsSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });


type FormValues = z.infer<typeof registrationSchema>;

const steps = [
  {
    id: 1,
    name: 'Personal & Address',
    fields: ['fullName', 'username', 'email', 'phone', 'password', 'confirmPassword', 'dateOfBirth', 'country', 'photo', 'street', 'city', 'state', 'zip'],
  },
  {
    id: 2,
    name: 'Identity Verification',
    fields: ['agreeTerms'],
  },
];

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [newlyCreatedUserId, setNewlyCreatedUserId] = useState<string | null>(null);
  const countryOptions = SUPPORTED_COUNTRIES;
  const countriesLoading = false;
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [selectedCountryOption, setSelectedCountryOption] = useState<SupportedCountry | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [autoDetectAttempted, setAutoDetectAttempted] = useState(false);
  const previousCountryRef = useRef<string | null>(null);
  const previousStateRef = useRef<string | null>(null);
  const pendingLocationRef = useRef<{ state?: string; city?: string } | null>(null);
  const statesAbortControllerRef = useRef<AbortController | null>(null);
  const citiesAbortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onTouched',
    defaultValues: {
        agreeTerms: false,
        countryCode: '',
        country: '',
        state: '',
        city: ''
    }
  });

  // Restore form data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('registration_progress');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Restore form values (excluding sensitive fields and files)
        if (parsed.fullName) setValue('fullName', parsed.fullName, { shouldDirty: false });
        if (parsed.username) setValue('username', parsed.username, { shouldDirty: false });
        if (parsed.email) setValue('email', parsed.email, { shouldDirty: false });
        if (parsed.countryCode) setValue('countryCode', parsed.countryCode, { shouldDirty: false });
        if (parsed.phone) setValue('phone', parsed.phone, { shouldDirty: false });
        if (parsed.country) setValue('country', parsed.country, { shouldDirty: false });
        if (parsed.state) setValue('state', parsed.state, { shouldDirty: false });
        if (parsed.city) setValue('city', parsed.city, { shouldDirty: false });
        if (parsed.street) setValue('street', parsed.street, { shouldDirty: false });
        if (parsed.zip) setValue('zip', parsed.zip, { shouldDirty: false });
        if (parsed.dateOfBirth) setValue('dateOfBirth', new Date(parsed.dateOfBirth), { shouldDirty: false });
        if (parsed.agreeTerms) setValue('agreeTerms', parsed.agreeTerms, { shouldDirty: false });
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      }
    } catch (e) {
      // Ignore localStorage errors
      console.error('Failed to restore registration progress:', e);
    }
  }, [setValue]);

  // Save form data to localStorage on field changes (debounced)
  useEffect(() => {
    const subscription = watch((value) => {
      // Don't save passwords or files to localStorage
      const dataToSave = {
        fullName: value.fullName,
        username: value.username,
        email: value.email,
        countryCode: value.countryCode,
        phone: value.phone,
        country: value.country,
        state: value.state,
        city: value.city,
        street: value.street,
        zip: value.zip,
        dateOfBirth: value.dateOfBirth?.toISOString(),
        agreeTerms: value.agreeTerms,
        currentStep,
      };
      
      try {
        localStorage.setItem('registration_progress', JSON.stringify(dataToSave));
      } catch (e) {
        // Ignore localStorage errors (quota exceeded, etc.)
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, currentStep]);
  // Reserved usernames (should match backend list)
  const RESERVED_USERNAMES = [
    'admin', 'administrator', 'root', 'system', 'api', 'support', 'help',
    'info', 'contact', 'sales', 'marketing', 'legal', 'privacy', 'terms',
    'about', 'team', 'careers', 'blog', 'news', 'status', 'security',
    'payvost', 'payvostadmin', 'official', 'verify', 'verification'
  ];

  // Real-time username availability (debounced)
  const usernameValue = watch('username');
  const countryValue = watch('country');
  const stateValue = watch('state');
  const cityValue = watch('city');
  const dialCodeOptions = useMemo(() => {
    return countryOptions
      .map((option) => ({
        iso2: option.iso2,
        country: option.name,
        dialCode: option.callingCodes[0] || '',
      }))
      .filter((option) => option.dialCode.length > 0)
      .sort((a, b) => a.country.localeCompare(b.country));
  }, [countryOptions]);

  const activeKycConfig = useMemo<CountryKycConfig>(() => selectedCountryOption?.kyc ?? DEFAULT_KYC_CONFIG, [selectedCountryOption]);
  const tier1Config = activeKycConfig.tiers.tier1;
  const tier2Config = activeKycConfig.tiers.tier2;
  const tier3Config = activeKycConfig.tiers.tier3;
  const tier1Fields = tier1Config.additionalFields ?? [];
  const upcomingTierConfigs = useMemo<Array<{ key: KycTierKey; config: KycTierConfig }>>(
    () => [
      { key: 'tier2', config: tier2Config },
      { key: 'tier3', config: tier3Config },
    ],
    [tier2Config, tier3Config],
  );
  useEffect(() => {
    let active = true;
    const check = async () => {
      const name = (usernameValue || '').trim().toLowerCase();
      if (!name || name.length < 3) { setUsernameAvailable(null); return; }
      
      // Check if username is reserved
      if (RESERVED_USERNAMES.includes(name)) {
        setUsernameAvailable(false);
        setCheckingUsername(false);
        return;
      }
      
      setCheckingUsername(true);
      try {
        const q = fsQuery(fsCollection(db, 'users'), fsWhere('username', '==', name), fsLimit(1));
        const snap = await fsGetDocs(q);
        if (!active) return;
        setUsernameAvailable(snap.empty);
      } catch {
        if (!active) return;
        setUsernameAvailable(null);
      } finally {
        if (active) setCheckingUsername(false);
      }
    };
    const t = setTimeout(check, 400);
    return () => { active = false; clearTimeout(t); };
  }, [usernameValue]);

  const applyDetectedCountry = useCallback((isoCode: string) => {
    if (!isoCode) return;
    const normalized = isoCode.toUpperCase();
    const match = countryOptions.find((option) => option.iso2 === normalized);
    if (!match) return;
    setValue('country', match.iso2, { shouldValidate: true, shouldDirty: false });
    if (match.callingCodes.length > 0) {
      setValue('countryCode', match.callingCodes[0], { shouldValidate: true, shouldDirty: false });
    }
    setSelectedCountryOption(match);
    pendingLocationRef.current = null;
    setSelectedCoordinates(null);
  }, [countryOptions, setValue]);

  useEffect(() => {
    if (autoDetectAttempted || countryValue) {
      return;
    }

    const detect = async () => {
      setAutoDetectAttempted(true);
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation unavailable'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
        });

        const { latitude, longitude } = position.coords;
        const reverseResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        if (reverseResponse.ok) {
          const reverseData = await reverseResponse.json();
          if (reverseData?.countryCode) {
            applyDetectedCountry(reverseData.countryCode);
            return;
          }
        }
      } catch {
        // Fall back to IP-based lookup below
      }

      try {
        const ipResponse = await fetch('https://ip-api.com/json/?fields=countryCode');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          if (ipData?.countryCode) {
            applyDetectedCountry(ipData.countryCode);
          }
        }
      } catch (error: unknown) {
        console.error('Could not detect user location', error);
      }
    };

    void detect();
  }, [applyDetectedCountry, autoDetectAttempted, countryValue]);

  const fetchStatesForCountry = useCallback(async (country: SupportedCountry | null) => {
    if (!country) {
      setStateOptions([]);
      setCityOptions([]);
      setStatesError(null);
      setCitiesError(null);
      return;
    }

    statesAbortControllerRef.current?.abort();
    const controller = new AbortController();
    statesAbortControllerRef.current = controller;
    setStatesLoading(true);
    setStateOptions([]);
    setCityOptions([]);
    setStatesError(null);
    setCitiesError(null);

    try {
      const response = await fetch('/api/location/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryIso: country.iso2,
          countryName: country.name,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch states: ${response.status}`);
      }
      const result = await response.json();
      if (result?.error) {
        setStateOptions([]);
        setStatesError('No states available for the selected country. Please enter details manually.');
        return;
      }
      const parsed: StateOption[] = Array.isArray(result?.data?.states)
        ? (result.data.states as unknown[])
            .filter(isRemoteState)
            .map((state) => {
              const stateCode = state.state_code?.trim();
              const isoCode = state.isoCode?.trim();
              return {
                name: state.name.trim(),
                code: stateCode && stateCode.length > 0 ? stateCode : isoCode && isoCode.length > 0 ? isoCode : undefined,
              };
            })
            .sort((a: StateOption, b: StateOption) => a.name.localeCompare(b.name))
        : [];
      setStateOptions(parsed);
      if (parsed.length === 0) {
        setStatesError('No states available for the selected country. Please enter details manually.');
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return;
      }
      console.error('Failed to load states', error);
      setStateOptions([]);
      setStatesError('We could not load regions for this country. Please enter the state manually.');
    } finally {
      setStatesLoading(false);
      statesAbortControllerRef.current = null;
    }
  }, []);

  const fetchCitiesForState = useCallback(async (country: CountryOption | null, stateName: string) => {
    if (!country || !stateName) {
      setCityOptions([]);
      setCitiesError(null);
      return;
    }

    citiesAbortControllerRef.current?.abort();
    const controller = new AbortController();
    citiesAbortControllerRef.current = controller;
    setCitiesLoading(true);
    setCityOptions([]);
    setCitiesError(null);

    try {
      const matchedState = stateOptions.find((option) => option.name === stateName);

      const response = await fetch('/api/location/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryIso: country.iso2,
          countryName: country.name,
          stateName,
          stateCode: matchedState?.code,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch cities: ${response.status}`);
      }
      const result = await response.json();
      if (result?.error) {
        setCityOptions([]);
        setCitiesError('No cities found for the selected state. You can type it manually.');
        return;
      }
      const parsed: string[] = Array.isArray(result?.data)
        ? (result.data as unknown[])
            .filter((city): city is string => typeof city === 'string' && city.trim().length > 0)
            .map((city) => city.trim())
            .sort((a: string, b: string) => a.localeCompare(b))
        : [];
      setCityOptions(parsed);
      if (parsed.length === 0) {
        setCitiesError('No cities found for the selected state. You can type it manually.');
      }
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') {
        return;
      }
      console.error('Failed to load cities', error);
      setCityOptions([]);
      setCitiesError('We could not load cities for this state. Please enter the city manually.');
    } finally {
      setCitiesLoading(false);
      citiesAbortControllerRef.current = null;
    }
  }, [stateOptions]);

  useEffect(() => {
    if (!countryValue) {
      setSelectedCountryOption(null);
      setStateOptions([]);
      setCityOptions([]);
      setStatesLoading(false);
      setCitiesLoading(false);
      setStatesError(null);
      setCitiesError(null);
      previousCountryRef.current = null;
      return;
    }

    const match = countryOptions.find((option) => option.iso2 === countryValue);
    setSelectedCountryOption(match ?? null);

    if (!match) {
      setStateOptions([]);
      setCityOptions([]);
      setStatesLoading(false);
      setCitiesLoading(false);
      setStatesError('This country is not supported for automatic region lookup. Please enter the details manually.');
      setCitiesError(null);
      previousCountryRef.current = countryValue;
      return;
    }

    const countryChanged = previousCountryRef.current !== countryValue;

    if (match.callingCodes.length > 0) {
      setValue('countryCode', match.callingCodes[0], { shouldDirty: false, shouldValidate: true });
    }

    if (countryChanged || stateOptions.length === 0) {
      void fetchStatesForCountry(match);
    }

    if (countryChanged) {
      setSelectedCoordinates(null);
      setValue('state', '', { shouldDirty: false, shouldValidate: true });
      setValue('city', '', { shouldDirty: false, shouldValidate: true });
      setStatesError(null);
      setCitiesError(null);
    }

    previousCountryRef.current = countryValue;
  }, [countryValue, countryOptions, fetchStatesForCountry, setValue, stateOptions.length]);

  useEffect(() => {
    if (!stateValue) {
      setCityOptions([]);
      setCitiesLoading(false);
      setCitiesError(null);
      previousStateRef.current = null;
      return;
    }

    if (!selectedCountryOption) {
      previousStateRef.current = stateValue;
      return;
    }

    const stateChanged = previousStateRef.current !== stateValue;

    if (stateChanged) {
      setSelectedCoordinates(null);
      setValue('city', '', { shouldDirty: false, shouldValidate: true });
      setCitiesError(null);
    }

    if (stateChanged || cityOptions.length === 0) {
      void fetchCitiesForState(selectedCountryOption, stateValue);
    }

    previousStateRef.current = stateValue;
  }, [stateValue, selectedCountryOption, fetchCitiesForState, setValue, cityOptions.length]);

  useEffect(() => {
    const pending = pendingLocationRef.current;
    if (!pending?.state) {
      return;
    }
    const match = stateOptions.find((option) => option.name.toLowerCase() === pending.state!.toLowerCase());
    if (match) {
      setValue('state', match.name, { shouldDirty: true, shouldValidate: true });
      pending.state = undefined;
      if (typeof pending.city === 'undefined') {
        pendingLocationRef.current = null;
      }
    }
  }, [stateOptions, setValue]);

  useEffect(() => {
    const pending = pendingLocationRef.current;
    if (!pending?.city) {
      return;
    }
    const match = cityOptions.find((city) => city.toLowerCase() === pending.city!.toLowerCase());
    if (match) {
      setValue('city', match, { shouldDirty: true, shouldValidate: true });
      pending.city = undefined;
      if (typeof pending.state === 'undefined') {
        pendingLocationRef.current = null;
      }
    }
  }, [cityOptions, setValue]);

  useEffect(() => {
    return () => {
      statesAbortControllerRef.current?.abort();
      citiesAbortControllerRef.current?.abort();
    };
  }, []);

  const handleAddressSelection = useCallback((selection: AddressSelection) => {
    if (!selection) return;

    const nextStreet = selection.street || selection.fullAddress;
    setValue('street', nextStreet, { shouldDirty: true, shouldValidate: true });

    if (selection.postalCode) {
      setValue('zip', selection.postalCode, { shouldDirty: true, shouldValidate: true });
    }

    setSelectedCoordinates(selection.coordinates ?? null);
    setStatesError(null);
    setCitiesError(null);

    const normalizedCountryName = selection.country?.toLowerCase();
    if (normalizedCountryName) {
      const matchCountry = countryOptions.find((option) => option.name.toLowerCase() === normalizedCountryName);
      if (matchCountry && matchCountry.iso2 !== countryValue) {
        pendingLocationRef.current = {
          state: selection.state,
          city: selection.city,
        };
        setValue('country', matchCountry.iso2, { shouldDirty: true, shouldValidate: true });
        return;
      }
    }

    if (selection.state) {
      const hasState = stateOptions.some((option) => option.name.toLowerCase() === selection.state?.toLowerCase());
      if (hasState) {
        setValue('state', selection.state, { shouldDirty: true, shouldValidate: true });
      } else {
        pendingLocationRef.current = {
          ...(pendingLocationRef.current ?? {}),
          state: selection.state,
        };
      }
    }

    if (selection.city) {
      const hasCity = cityOptions.some((city) => city.toLowerCase() === selection.city?.toLowerCase());
      if (hasCity) {
        setValue('city', selection.city, { shouldDirty: true, shouldValidate: true });
      } else {
        pendingLocationRef.current = {
          ...(pendingLocationRef.current ?? {}),
          city: selection.city,
        };
      }
    }
  }, [cityOptions, countryOptions, countryValue, setValue, stateOptions]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB.', variant: 'destructive' });
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Only image formats are supported for profile photos.', variant: 'destructive' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setValue('photo', event.target.files, { shouldDirty: true, shouldValidate: true });
  };


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };
  
    const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            setShowCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast({ title: "Camera Error", description: "Could not access your device's camera.", variant: "destructive" });
            setShowCamera(false);
        }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                setPreviewImage(canvas.toDataURL('image/jpeg'));
        setValue('photo', dataTransfer.files, { shouldDirty: true, shouldValidate: true });
                stopCamera();
                setShowCamera(false);
            }
        }, 'image/jpeg');
    }
  };

  const fullName = watch('fullName');
  const password = watch('password', '');
  const passwordStrength = checkPasswordStrength(password);
  
  const getStrengthColor = (strength: number) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getStrengthText = (strength: number) => {
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Medium';
    return 'Strong';
  };

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as (keyof FormValues)[], { shouldFocus: true });

    if (!output) return;

    // Ensure username still available before proceeding past step containing username
    if (steps[currentStep].fields.includes('username')) {
      const username = usernameValue?.trim().toLowerCase();
      if (username && RESERVED_USERNAMES.includes(username)) {
        toast({ title: 'Reserved username', description: 'This username is reserved and cannot be used. Please choose a different username.', variant: 'destructive' });
        return;
      }
      if (usernameAvailable === false) {
        toast({ title: 'Username unavailable', description: 'Please choose a different username.', variant: 'destructive' });
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };
  
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);

    const tier1AdditionalValues: Record<string, string> = {};
    let tier1ValidationFailed = false;

    for (const field of tier1Fields) {
      const fieldName = field.name as keyof FormValues;
      const rawValue = data[fieldName];
      const stringValue = typeof rawValue === 'string' ? rawValue.trim() : '';
      const normalizedValue = field.normalize ? field.normalize(stringValue) : stringValue;

      if (field.normalize && normalizedValue !== stringValue) {
        setValue(fieldName, normalizedValue, { shouldDirty: true, shouldValidate: true });
        (data as Record<string, unknown>)[field.name] = normalizedValue;
      }

      if (field.required && !normalizedValue) {
        setError(fieldName, { type: 'manual', message: `${field.label} is required` });
        tier1ValidationFailed = true;
        continue;
      }

      if (normalizedValue && field.pattern && !field.pattern.test(normalizedValue)) {
        setError(fieldName, {
          type: 'manual',
          message: field.patternMessage ?? `Enter a valid value for ${field.label}.`,
        });
        tier1ValidationFailed = true;
        continue;
      }

      clearErrors(fieldName);

      if (normalizedValue) {
        tier1AdditionalValues[field.name] = normalizedValue;
      }
    }

    if (tier1ValidationFailed) {
      toast({
        title: 'Check identity details',
        description: 'Please review the highlighted Tier 1 fields before continuing.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Re-validate username availability to prevent race conditions
      const q = fsQuery(fsCollection(db, 'users'), fsWhere('username', '==', data.username.trim()), fsLimit(1));
      const existing = await fsGetDocs(q);
      if (!existing.empty) {
        toast({ title: 'Username already taken', description: 'Please select a different username.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // 1. Call backend API to create user (bypasses client restrictions)
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
          displayName: data.fullName.trim(),
          username: data.username.trim(),
          phoneNumber: `+${data.countryCode}${data.phone}`,
          countryCode: data.country,
          userType: 'Pending',
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        const errorMessage = errorData.message || errorData.error || 'Registration failed. Please try again.';
        
        // Handle rate limiting
        if (registerResponse.status === 429) {
          const retryAfter = errorData.retryAfter || 3600;
          const minutes = Math.ceil(retryAfter / 60);
          throw new Error(`Too many registration attempts. Please try again after ${minutes} minute${minutes > 1 ? 's' : ''}.`);
        }
        
        throw new Error(errorMessage);
      }

  const { customToken } = await registerResponse.json();

      // 2. Sign in with custom token
      await signInWithCustomToken(auth, customToken);
      const user = auth.currentUser;
      if (!user) throw new Error('Failed to authenticate after registration');

      // 3. Upload profile photo if it exists
      let photoURL = '';
      const photoFile = data.photo?.[0];
      if (photoFile) {
        const photoStorageRef = ref(storage, `profile_pictures/${user.uid}/${photoFile.name}`);
        await uploadBytes(photoStorageRef, photoFile);
        photoURL = await getDownloadURL(photoStorageRef);
      }

      // 4. Update Auth profile
      await updateProfile(user, {
        displayName: data.fullName,
        photoURL: photoURL,
      });
      
      // 5. Calculate risk score based on user data
      const calculateRiskScore = (): number => {
        let score = 50; // Base score
        
        // Lower risk for older accounts (future consideration)
        // Higher risk for incomplete profiles
        if (!photoURL) score += 10;
        if (!data.phone) score += 10;
        if (!data.street || !data.city) score += 5;
        
        // Lower risk for verified email (if verified)
        // This will be updated later when email is verified
        
        // Country-based risk adjustment (simplified)
        // High-risk countries could increase score, but we'll keep neutral for now
        
        // Clamp score between 0 and 100
        return Math.max(0, Math.min(100, score));
      };
      
      // 6. Update the user document in Firestore with additional details
      // Use merge to prevent overwriting if API already created basic doc
      const userDocRef = doc(db, "users", user.uid);
      const resolvedCountry = selectedCountryOption ?? countryOptions.find((option) => option.iso2 === data.country) ?? null;
      const locationPayload: Record<string, unknown> = {
        addressLine1: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.zip,
        countryCode: data.country,
        countryName: resolvedCountry?.name ?? '',
      };
      if (selectedCoordinates) {
        locationPayload.coordinates = new GeoPoint(selectedCoordinates.lat, selectedCoordinates.lng);
      }
      const tier1Submission = {
        status: 'submitted' as const,
        submittedAt: serverTimestamp(),
        summary: tier1Config.summary,
        requirements: tier1Config.requirements,
        additionalFields: tier1AdditionalValues,
      };

      const firestoreData = {
        uid: user.uid,
        name: data.fullName,
        username: data.username,
        email: data.email,
        phone: `+${data.countryCode}${data.phone}`,
        photoURL: photoURL,
        dateOfBirth: Timestamp.fromDate(data.dateOfBirth),
        country: data.country,
        countryName: resolvedCountry?.name ?? '',
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        location: locationPayload,
        kycStatus: 'tier1_pending_review',
        kycTier: 'tier1' as const,
        kycProfile: {
          countryIso: data.country,
          countryName: resolvedCountry?.name ?? '',
          currentTier: 'tier1' as const,
          status: 'pending_review' as const,
          availableUpgrades: upcomingTierConfigs.map(({ key }) => key),
          tiers: {
            tier1: tier1Submission,
            tier2: {
              status: 'locked' as const,
              summary: tier2Config.summary,
              requirements: tier2Config.requirements,
              documents: tier2Config.documents ?? [],
            },
            tier3: {
              status: 'locked' as const,
              summary: tier3Config.summary,
              requirements: tier3Config.requirements,
              documents: tier3Config.documents ?? [],
            },
          },
        },
        userType: 'Pending' as const,
        riskScore: calculateRiskScore(),
        totalSpend: 0,
        wallets: [],
        transactions: [],
        beneficiaries: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        bvn: tier1AdditionalValues.bvn ?? '',
      };
      // Use setDoc with merge to avoid overwriting if API already created user doc
      await setDoc(userDocRef, firestoreData, { merge: true });

      // 7. Send email verification immediately (before PIN setup)
      try {
        await sendEmailVerification(user);
        toast({ 
          title: 'Verification email sent', 
          description: 'Please check your email to verify your account.',
          duration: 5000,
        });
      } catch (emailError: unknown) {
        // Don't block registration if email fails, but log it
        console.error('Failed to send verification email:', emailError);
        toast({ 
          title: 'Registration successful', 
          description: 'We\'ll send a verification email shortly. You can also request a new one from your profile.',
          variant: 'default',
        });
      }

      // 8. Send welcome notification
      try {
        const notificationsColRef = collection(db, "users", user.uid, "notifications");
        await addDoc(notificationsColRef, {
          icon: 'gift',
          title: 'Welcome to Payvost!',
          description: 'We are thrilled to have you with us. Explore the features and start transacting globally.',
          date: serverTimestamp(),
          read: false,
        });
      } catch (notifError) {
        // Don't block registration if notification fails
        console.error('Failed to create welcome notification:', notifError);
      }

      // 9. Open PIN setup dialog before redirecting
      setNewlyCreatedUserId(user.uid);
      setPinDialogOpen(true);

    } catch (error: unknown) {
      console.error("Registration process failed:", error);
      let errorMessage = "An unknown error occurred during registration.";
      let errorTitle = "Registration Failed";
      
      const errorDetails = isErrorWithCode(error) ? error : null;
      
      // Try to clean up if user was created but registration failed
      // This prevents orphaned accounts in Firebase Auth
      try {
        if (auth.currentUser) {
          // If we're here, user was created but something failed
          // We can't easily delete the user from client side, but we can sign out
          await auth.signOut();
        }
      } catch (cleanupError) {
        console.error("Failed to clean up on registration error:", cleanupError);
      }
      
      // Handle specific error codes
      if (errorDetails?.code === 'auth/email-already-in-use') {
        errorTitle = "Email Already Registered";
        errorMessage = 'This email is already registered. Please login or use a different email.';
      } else if (errorDetails?.code === 'auth/weak-password') {
        errorTitle = "Weak Password";
        errorMessage = 'Password does not meet security requirements. Please use a stronger password.';
      } else if (errorDetails?.code === 'storage/unauthorized') {
        errorTitle = "Upload Permission Error";
        errorMessage = 'There was a permission issue uploading your photo. Please try again or contact support.';
      } else if (errorDetails?.code === 'auth/too-many-requests') {
        errorTitle = "Too Many Requests";
        errorMessage = 'Too many registration attempts. Please wait a few minutes and try again.';
      } else if (error instanceof Error) {
        // Use the error message from the API or error object
        errorMessage = error.message;
        
        // Check if it's a rate limit error
        if (error.message.toLowerCase().includes('too many')) {
          errorTitle = "Rate Limit Exceeded";
        } else if (error.message.toLowerCase().includes('username')) {
          errorTitle = "Username Error";
        } else if (error.message.toLowerCase().includes('password')) {
          errorTitle = "Password Error";
        } else if (error.message.toLowerCase().includes('email')) {
          errorTitle = "Email Error";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-8">
      <Progress value={progress} className="w-full" />
      <form onSubmit={handleSubmit(onSubmit)}>
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Personal & Address Information</h3>
             <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={previewImage || undefined} alt="Profile picture preview" />
                    <AvatarFallback>{fullName ? getInitials(fullName) : 'PIC'}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="default">Set Profile Photo</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => document.getElementById('photo-upload')?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" /> Upload a file
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => {
                               startCamera();
                             }}>
                                <Camera className="mr-2 h-4 w-4" /> Take a selfie
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handlePhotoChange} disabled={isLoading} />
                    <p className="text-xs text-muted-foreground">Upload a clear photo of yourself. PNG, JPG up to 5MB.</p>
                     {errors.photo && <p className="text-sm text-destructive">{String(errors.photo.message)}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register('fullName')} disabled={isLoading} />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...register('email')} disabled={isLoading} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="space-y-1">
                      <Input id="username" {...register('username')} disabled={isLoading} />
                      <div className="text-xs text-muted-foreground h-4">
                        {checkingUsername && <span>Checking availability…</span>}
                        {!checkingUsername && usernameValue && RESERVED_USERNAMES.includes(usernameValue.trim().toLowerCase()) && (
                          <span className="text-destructive">Reserved username</span>
                        )}
                        {!checkingUsername && usernameValue && !RESERVED_USERNAMES.includes(usernameValue.trim().toLowerCase()) && usernameAvailable === true && (
                          <span className="text-green-600">Available</span>
                        )}
                        {!checkingUsername && usernameValue && !RESERVED_USERNAMES.includes(usernameValue.trim().toLowerCase()) && usernameAvailable === false && (
                          <span className="text-destructive">Not available</span>
                        )}
                      </div>
                    </div>
                    {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
                            <Controller
                              name="countryCode"
                              control={control}
                              render={({ field }) => (
                                <Popover open={countryDropdownOpen} onOpenChange={setCountryDropdownOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      role="combobox"
                                      className="w-[140px] justify-between h-9 rounded-r-none"
                                      disabled={isLoading || countriesLoading || dialCodeOptions.length === 0}
                                    >
                                      {field.value ? `+${field.value}` : countriesLoading ? 'Loading…' : 'Code'}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[280px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search dial code..." />
                                      <CommandList>
                                        <CommandEmpty>No matches.</CommandEmpty>
                                        <CommandGroup>
                                          {dialCodeOptions.map((option) => (
                                            <CommandItem
                                              key={`${option.iso2}-${option.dialCode}`}
                                              value={`${option.country} +${option.dialCode}`}
                                              onSelect={() => {
                                                field.onChange(option.dialCode);
                                                if (!countryValue) {
                                                  setValue('country', option.iso2, { shouldDirty: true, shouldValidate: true });
                                                }
                                                setCountryDropdownOpen(false);
                                              }}
                                            >
                                              <Check className={cn('mr-2 h-4 w-4', field.value === option.dialCode ? 'opacity-100' : 'opacity-0')} />
                                              {option.country} (+{option.dialCode})
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            />
                        <Input id="phone" {...register('phone')} disabled={isLoading} placeholder="Your number" className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"/>
                    </div>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} disabled={isLoading} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </Button>
                </div>
                 {password && (
                    <div className="space-y-1">
                        <Progress value={passwordStrength} className={cn("h-1", getStrengthColor(passwordStrength))} />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium" style={{ color: getStrengthColor(passwordStrength).replace('bg-', 'text-') }}>
                                {getStrengthText(passwordStrength)}
                            </span>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {password.length >= 8 ? <Check className="h-3 w-3 text-green-500" /> : <ShieldX className="h-3 w-3 text-red-500" />} Min 8 characters
                            </div>
                        </div>
                    </div>
                )}
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} disabled={isLoading} />
                   <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Controller
                        name="dateOfBirth"
                        control={control}
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                    disabled={isLoading}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    captionLayout="dropdown-buttons"
                                    fromDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))}
                                    toDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                                    defaultMonth={new Date(new Date().setFullYear(new Date().getFullYear() - 20))}
                                />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-2">
                <Label htmlFor="country">Country of Residence</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <CountrySelector
                      value={field.value ?? ''}
                      onChange={(value) => {
                        pendingLocationRef.current = null;
                        setSelectedCoordinates(null);
                        field.onChange(value);
                      }}
                      options={countryOptions}
                      isLoading={countriesLoading}
                      disabled={isLoading}
                      placeholder="Select country"
                    />
                  )}
                />
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => {
                    const placeholder = !countryValue
                      ? 'Select a country first, then type your state'
                      : statesLoading
                        ? 'Loading states…'
                        : stateOptions.length > 0
                          ? 'Type to search or enter manually'
                          : 'Type your state / province name';
                    
                    const helperText = !countryValue
                      ? 'Please select a country first'
                      : statesError
                        ? statesError
                        : stateOptions.length > 0
                          ? `${stateOptions.length} states available - select from list or type manually`
                          : 'Enter your state / province name manually';

                    return (
                      <SearchableLocationInput
                        id="state"
                        value={field.value ?? ''}
                        onChange={(value) => {
                          pendingLocationRef.current = null;
                          setSelectedCoordinates(null);
                          field.onChange(value);
                        }}
                        options={stateOptions}
                        isLoading={statesLoading}
                        placeholder={placeholder}
                        emptyLabel="No states found"
                        helperText={!errors.state ? helperText : undefined}
                      />
                    );
                  }}
                />
                {errors.state && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span>•</span>
                    <span>{errors.state.message || 'Please enter your state / province'}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => {
                    const placeholder = !stateValue
                      ? 'Select a state first, then type your city'
                      : citiesLoading
                        ? 'Loading cities…'
                        : cityOptions.length > 0
                          ? 'Type to search or enter manually'
                          : 'Type your city name';
                    
                    const helperText = !stateValue
                      ? 'Please select a state / province first'
                      : citiesError
                        ? citiesError
                        : cityOptions.length > 0
                          ? `${cityOptions.length} cities available - select from list or type manually`
                          : 'Enter your city name manually';

                    return (
                      <SearchableLocationInput
                        id="city"
                        value={field.value ?? ''}
                        onChange={(value) => {
                          pendingLocationRef.current = null;
                          setSelectedCoordinates(null);
                          field.onChange(value);
                        }}
                        options={cityOptions}
                        isLoading={citiesLoading}
                        placeholder={placeholder}
                        emptyLabel="No cities found"
                        helperText={!errors.city ? helperText : undefined}
                      />
                    );
                  }}
                />
                {errors.city && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span>•</span>
                    <span>{errors.city.message || 'Please enter your city'}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP / Postal Code</Label>
                <Input 
                  id="zip" 
                  {...register('zip')} 
                  disabled={isLoading}
                  placeholder="e.g., 12345 or SW1A 1AA"
                />
                {errors.zip && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span>•</span>
                    <span>{errors.zip.message || 'Please enter your ZIP / postal code'}</span>
                  </p>
                )}
                {!errors.zip && (
                  <p className="text-xs text-muted-foreground">Enter your postal or ZIP code</p>
                )}
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Controller
                name="street"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    value={field.value ?? ''}
                    onChange={(value) => {
                      field.onChange(value);
                      setSelectedCoordinates(null);
                      pendingLocationRef.current = null;
                    }}
                    onAddressSelected={handleAddressSelection}
                    countryCode={countryValue}
                    disabled={isLoading}
                    error={errors.street?.message}
                  />
                )}
              />
              {!errors.street && (
                <p className="text-xs text-muted-foreground">Start typing to see suggestions or enter manually</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Step 2: Identity Verification</h3>

            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{tier1Config.label}</p>
                  <p className="text-sm text-muted-foreground">{tier1Config.summary}</p>
                </div>
                <Badge variant="secondary">Tier 1</Badge>
              </div>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {tier1Config.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {tier1Fields.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Country-specific fields</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {tier1Fields.map((field) => {
                    const fieldName = field.name as keyof FormValues;
                    const fieldRegister = register(fieldName, {
                      required: field.required ? `${field.label} is required` : false,
                      pattern: field.pattern
                        ? { value: field.pattern, message: field.patternMessage ?? 'Invalid format.' }
                        : undefined,
                      setValueAs: field.normalize
                        ? (value) => field.normalize!(typeof value === 'string' ? value : '')
                        : undefined,
                    });
                    const { onBlur, onChange, ...fieldRest } = fieldRegister;
                    const fieldError = errors[fieldName];
                    const errorMessage =
                      fieldError && typeof fieldError === 'object' && 'message' in fieldError
                        ? (fieldError as { message?: string }).message
                        : undefined;

                    return (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {!field.required && (
                            <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>
                          )}
                        </Label>
                        <Input
                          id={field.name}
                          placeholder={field.placeholder}
                          inputMode={field.inputMode}
                          maxLength={field.maxLength}
                          disabled={isLoading}
                          {...fieldRest}
                          onBlur={(event) => {
                            onBlur?.(event);
                            if (field.normalize) {
                              const normalizedValue = field.normalize(event.target.value);
                              if (normalizedValue !== event.target.value) {
                                setValue(fieldName, normalizedValue, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }
                            }
                          }}
                          onChange={(event) => {
                            onChange?.(event);
                            clearErrors(fieldName);
                          }}
                        />
                        {field.helperText && (
                          <p className="text-xs text-muted-foreground">{field.helperText}</p>
                        )}
                        {fieldError && (
                          <p className="text-sm text-destructive">{errorMessage ?? 'Please check this value.'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Controller
                name="agreeTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreeTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />
              <Label htmlFor="agreeTerms">
                I agree to the{' '}
                <Link href="/terms" className="underline hover:text-primary" target="_blank">
                  terms and conditions
                </Link>
              </Label>
            </div>
            {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms.message}</p>}
          </div>
        )}

        <div className="mt-8 pt-4 flex justify-between border-t">
          <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0 || isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={isLoading}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Registration
            </Button>
          )}
        </div>
      </form>
      {/* Transaction PIN setup dialog after registration */}
      <TransactionPinSetupDialog
        userId={newlyCreatedUserId || ''}
        open={pinDialogOpen}
        onOpenChange={(open) => setPinDialogOpen(open)}
        onCompleted={async () => {
          // Clear registration progress from localStorage
          try {
            localStorage.removeItem('registration_progress');
          } catch (e) {
            // Ignore localStorage errors
          }
          
          toast({ 
            title: 'Registration Successful!', 
            description: 'Your account has been created. Please verify your email to continue.',
            duration: 5000,
          });
          router.push('/verify-email');
        }}
        force={true}
      />
       <Dialog open={showCamera} onOpenChange={(open) => {
           if (!open) stopCamera();
           setShowCamera(open);
       }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Take a Selfie</DialogTitle>
                </DialogHeader>
                <div className="relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md" ></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { stopCamera(); setShowCamera(false); }}>Cancel</Button>
                    <Button onClick={handleCapture}>Capture</Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>
    </div>
  );
}
