
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, UploadCloud, Eye, EyeOff, FileUp, AtSign, Twitter, Camera, ChevronsUpDown, Check, ShieldCheckIcon, ShieldX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { signInWithCustomToken, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { Textarea } from './ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Icons } from './icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import Image from 'next/image';
import { TransactionPinSetupDialog } from './transaction-pin-setup-dialog';
import { collection as fsCollection, query as fsQuery, where as fsWhere, limit as fsLimit, getDocs as fsGetDocs } from 'firebase/firestore';

const allCountries = [
    { name: "United States", code: "US", phone: "1", flag: "US" },
    { name: "United Kingdom", code: "GB", phone: "44", flag: "GB" },
    { name: "Nigeria", code: "NG", phone: "234", flag: "NG" },
    { name: "Canada", code: "CA", phone: "1", flag: "CA" },
    // Add more countries as needed
];


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

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().min(1, 'Country code is required'),
  phone: z.string().min(5, 'A valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').refine(
      (password) => checkPasswordStrength(password) >= 80,
      { message: "Password is not strong enough. Aim for at least 80% strength." }
  ),
  confirmPassword: z.string().min(8, 'Passwords must match'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  country: z.string().min(1, 'Country is required'),
   photo: z.any()
    .refine((files) => files?.length > 0, "A profile photo is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
  street: z.string().min(2, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zip: z.string().min(4, 'ZIP/Postal code is required'),
  idType: z.string().min(1, 'Please select an ID type'),
  idNumber: z.string().min(5, 'A valid ID number is required'),
  idDocument: z.any()
    .refine((files) => files?.length > 0, "ID document is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type) || files?.[0]?.type === 'application/pdf',
      "Only images and PDFs are supported."
    ),
  bvn: z.string().optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


type FormValues = z.infer<typeof registrationSchema>;

const steps = [
  { id: 1, name: 'Personal & Address', fields: ['fullName', 'username', 'email', 'phone', 'password', 'confirmPassword', 'dateOfBirth', 'country', 'photo', 'street', 'city', 'state', 'zip'] },
  { id: 2, name: 'Identity Verification', fields: ['idType', 'idNumber', 'idDocument', 'bvn', 'agreeTerms'] },
];

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
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

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    mode: 'onTouched',
    defaultValues: {
        agreeTerms: false
    }
  });
  // Real-time username availability (debounced)
  const usernameValue = watch('username');
  useEffect(() => {
    let active = true;
    const check = async () => {
      const name = (usernameValue || '').trim();
      if (!name || name.length < 3) { setUsernameAvailable(null); return; }
      setCheckingUsername(true);
      try {
        const q = fsQuery(fsCollection(db, 'users'), fsWhere('username', '==', name), fsLimit(1));
        const snap = await fsGetDocs(q);
        if (!active) return;
        setUsernameAvailable(snap.empty);
      } catch (e) {
        if (!active) return;
        setUsernameAvailable(null);
      } finally {
        if (active) setCheckingUsername(false);
      }
    };
    const t = setTimeout(check, 400);
    return () => { active = false; clearTimeout(t); };
  }, [usernameValue]);


  useEffect(() => {
    fetch('https://ip-api.com/json/?fields=countryCode,country')
        .then(res => res.json())
        .then(data => {
            const detectedCountry = allCountries.find(c => c.code === data.countryCode);
            if (detectedCountry) {
                setValue('countryCode', detectedCountry.phone);
                setValue('country', detectedCountry.code);
            }
        })
        .catch(err => console.error("Could not fetch user location", err));
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'idDocument') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isPdf = file.type === 'application/pdf';

      if (type === 'idDocument' && !isImage && !isPdf) {
          toast({ title: "Invalid File Type", description: "Please upload an image or PDF file.", variant: "destructive" });
          return;
      } else if (type === 'photo' && !isImage) {
          toast({ title: "Invalid File Type", description: "Only image formats are supported for profile photos.", variant: "destructive" });
          return;
      }

      if (type === 'photo') {
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setValue('photo', e.target.files);
      } else {
        setIdDocumentPreview(file.name);
        setValue('idDocument', e.target.files);
      }
    }
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
                setValue('photo', dataTransfer.files);
                stopCamera();
                setShowCamera(false);
            }
        }, 'image/jpeg');
    }
  };

  const fullName = watch('fullName');
  const selectedCountry = watch('country');
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
          email: data.email,
          password: data.password,
          displayName: data.fullName,
          phoneNumber: `+${data.countryCode}${data.phone}`,
          countryCode: data.country,
          userType: 'Pending',
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || 'Registration failed');
      }

      const { uid, customToken } = await registerResponse.json();

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
      
      // 5. Update the user document in Firestore with additional details
      const userDocRef = doc(db, "users", user.uid);
      const firestoreData = {
        uid: user.uid,
        name: data.fullName,
        username: data.username,
        email: data.email,
        phone: `+${data.countryCode}${data.phone}`,
        photoURL: photoURL,
        dateOfBirth: Timestamp.fromDate(data.dateOfBirth),
        country: data.country,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
  kycStatus: 'pending',
        userType: 'Pending' as const,
        riskScore: Math.floor(Math.random() * 30),
        totalSpend: 0,
        wallets: [],
        transactions: [],
        beneficiaries: [],
        createdAt: serverTimestamp(),
        bvn: data.bvn || '',
        idType: data.idType,
        idNumber: data.idNumber,
      };
      await setDoc(userDocRef, firestoreData);

  // Open PIN setup dialog before redirecting
  setNewlyCreatedUserId(user.uid);
  setPinDialogOpen(true);
      
      // 5. Upload ID document and create KYC subcollection document
      const idFile = data.idDocument?.[0];
      if (idFile) {
         const idStorageRef = ref(storage, `id_documents/${user.uid}/${idFile.name}`);
         await uploadBytes(idStorageRef, idFile);
         const idDocumentURL = await getDownloadURL(idStorageRef);

         const kycDocRef = collection(db, "users", user.uid, "kycDocuments");
         await addDoc(kycDocRef, {
             idType: data.idType,
             idNumber: data.idNumber,
             filePath: idDocumentURL,
             status: 'pending',
             submittedAt: serverTimestamp()
         });
      }

      // 6. Send welcome notification
      const notificationsColRef = collection(db, "users", user.uid, "notifications");
      await addDoc(notificationsColRef, {
        icon: 'gift',
        title: 'Welcome to Payvost!',
        description: 'We are thrilled to have you with us. Explore the features and start transacting globally.',
        date: serverTimestamp(),
        read: false,
      });
      
      // We will send verification email after PIN is set (in onPinCompleted)

    } catch (error: any) {
      console.error("Registration process failed:", error);
      let errorMessage = "An unknown error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login or use a different email.';
      } else if (error.code === 'storage/unauthorized') {
        errorMessage = 'There was a permission issue uploading your documents. Please check storage rules.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
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
                    <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'photo')} disabled={isLoading} />
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
                        {!checkingUsername && usernameAvailable === true && <span className="text-green-600">Available</span>}
                        {!checkingUsername && usernameAvailable === false && <span className="text-destructive">Not available</span>}
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
                                        <Button variant="ghost" role="combobox" className="w-[120px] justify-between h-9 rounded-r-none">
                                            {field.value ? `+${field.value}` : "Select..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[250px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search country..." />
                                            <CommandList>
                                                <CommandEmpty>No country found.</CommandEmpty>
                                                <CommandGroup>
                                                    {allCountries.map((country) => (
                                                        <CommandItem
                                                            key={country.code}
                                                            value={country.name}
                                                            onSelect={() => {
                                                                setValue("countryCode", country.phone);
                                                                setCountryDropdownOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", field.value === country.phone ? "opacity-100" : "opacity-0")} />
                                                            {country.name} (+{country.phone})
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="NG">Nigeria</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" {...register('street')} disabled={isLoading} />
              {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} disabled={isLoading} />
                {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" {...register('state')} disabled={isLoading} />
                {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP / Postal Code</Label>
                <Input id="zip" {...register('zip')} disabled={isLoading} />
                {errors.zip && <p className="text-sm text-destructive">{errors.zip.message}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
             <h3 className="text-lg font-semibold">Step 2: Identity Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="idType">ID Type</Label>
                    <Controller
                    name="idType"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Select ID Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="passport">Passport</SelectItem>
                                <SelectItem value="license">Driver's License</SelectItem>
                                <SelectItem value="national-id">National ID</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.idType && <p className="text-sm text-destructive">{errors.idType.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input id="idNumber" {...register('idNumber')} disabled={isLoading} />
                    {errors.idNumber && <p className="text-sm text-destructive">{errors.idNumber.message}</p>}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="id-document-upload">Upload ID Document</Label>
                <Label htmlFor="id-document-upload" className="cursor-pointer">
                    <div className="p-4 border-2 border-dashed rounded-lg text-center hover:bg-muted/50">
                        <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            {idDocumentPreview ? `Selected: ${idDocumentPreview}` : 'Click to upload a clear image of your ID'}
                        </p>
                    </div>
                </Label>
                 <Input id="id-document-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'idDocument')} disabled={isLoading} />
                 {errors.idDocument && <p className="text-sm text-destructive">{String(errors.idDocument.message)}</p>}
            </div>

            {selectedCountry === 'NG' && (
                 <div className="space-y-2">
                    <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                    <Input id="bvn" {...register('bvn')} disabled={isLoading} />
                    {errors.bvn && <p className="text-sm text-destructive">{errors.bvn.message}</p>}
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
                I agree to the{" "}
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
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={isLoading}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
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
          if (!auth.currentUser) return;
          try {
            await sendEmailVerification(auth.currentUser);
            toast({ title: 'Registration Successful!', description: 'A verification link has been sent to your email.' });
          } catch (e: any) {
            toast({ title: 'Could not send verification email', description: e?.message || 'Please check your email later.' });
          }
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
