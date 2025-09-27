
'use client';

import { useState } from 'react';
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
import { CalendarIcon, Loader2, UploadCloud } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, storage } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  country: z.string().min(1, 'Country is required'),
   photo: z.any()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ).optional(),
});

const addressSchema = z.object({
  street: z.string().min(2, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zip: z.string().min(4, 'ZIP/Postal code is required'),
});

const verificationSchema = z.object({
  idType: z.string().min(1, 'Please select an ID type'),
  idNumber: z.string().min(5, 'A valid ID number is required'),
  idExpiry: z.date({ required_error: 'Expiry date is required' }),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});

// This can be simplified. Merging one by one is fine.
const registrationSchema = z.intersection(
    personalInfoSchema,
    z.intersection(addressSchema, verificationSchema)
);

type FormValues = z.infer<typeof registrationSchema>;

const steps = [
  { id: 1, name: 'Personal Information', fields: ['fullName', 'email', 'password', 'dateOfBirth', 'country', 'photo'] },
  { id: 2, name: 'Address Information', fields: ['street', 'city', 'state', 'zip'] },
  { id: 3, name: 'Identity Verification', fields: ['idType', 'idNumber', 'idExpiry', 'agreeTerms'] },
];

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
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
    defaultValues: {
        agreeTerms: false
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setPreviewImage(URL.createObjectURL(file));
      setValue('photo', e.target.files);
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };

  const fullName = watch('fullName');

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as (keyof FormValues)[], { shouldFocus: true });

    if (!output) return;

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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      let photoURL = '';
      const photoFile = data.photo?.[0];

      if (photoFile) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }


      // Prepare data for Firestore with correct date formats
       if (!data.dateOfBirth || !data.idExpiry) {
        throw new Error("Date fields are missing.");
       }
      
      const firestoreData = {
        id: user.uid,
        name: data.fullName,
        email: data.email,
        photoURL: photoURL,
        country: data.country,
        // Mock data for fields not in the form yet
        kycStatus: 'Pending' as const,
        userType: 'Normal User' as const,
        riskScore: Math.floor(Math.random() * 30), // Random low risk score
        totalSpend: 0,
        phone: '', // Not in form, add if needed
        wallets: [],
        transactions: [],
        joinedDate: serverTimestamp(),
      };

      // Set user's display name and photo in Auth
      await updateProfile(user, {
        displayName: data.fullName,
        photoURL: photoURL,
      });

      // Create the user document in Firestore
      await setDoc(doc(db, "users", user.uid), firestoreData);
      
      // Send verification email
      await sendEmailVerification(user);

      toast({
          title: "Registration Successful!",
          description: "A verification link has been sent to your email.",
      })
      router.push('/verify-email');

    } catch (error: any) {
      console.error("Registration process failed:", error);
      let errorMessage = "An unknown error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login or use a different email.';
      } else if (error.code === 'permission-denied' || error.code === 'storage/unauthorized') {
        errorMessage = 'There was a problem setting up your profile. Please check permissions.';
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
             <div className="flex justify-center">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={previewImage || undefined} alt="Profile picture preview" />
                    <AvatarFallback>{fullName ? getInitials(fullName) : 'PIC'}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-center sm:text-left">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                        <span><UploadCloud className="mr-2 h-4 w-4" /> Upload Photo</span>
                    </Button>
                    </Label>
                    <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isLoading} />
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB.</p>
                </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} disabled={isLoading} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
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
                                    fromYear={1950}
                                    toYear={new Date().getFullYear()}
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
                        <SelectItem value="USA">United States</SelectItem>
                        <SelectItem value="CAN">Canada</SelectItem>
                        <SelectItem value="GBR">United Kingdom</SelectItem>
                        <SelectItem value="NGA">Nigeria</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
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

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Controller
                        name="idExpiry"
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
                                    fromYear={new Date().getFullYear()}
                                    toYear={new Date().getFullYear() + 10}
                                />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                     {errors.idExpiry && <p className="text-sm text-destructive">{errors.idExpiry.message}</p>}
                </div>
            </div>
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
              <Label htmlFor="agreeTerms">I agree to the terms and conditions</Label>
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
    </div>
  );
}
