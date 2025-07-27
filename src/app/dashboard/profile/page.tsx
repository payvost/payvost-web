
'use client';

import { useState, useEffect, useRef } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, Bell, User, Shield, CreditCard, Trash2, Edit, UploadCloud, Loader2, Save, FileUp, Video, Wallet, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


interface UserProfileData {
    fullName: string;
    email: string;
    dateOfBirth: string | Date | Timestamp;
    country: string;
    photoURL?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    createdAt: string;
    kycLevel: 'Standard' | 'Advanced';
}

const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  country: z.string().min(2, 'Country is required'),
  street: z.string().min(2, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  zip: z.string().min(4, 'ZIP/Postal code is required'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function ProfilePage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema)
  });


  const fetchProfile = async () => {
    if (user) {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfileData;
          setProfile(data);
          reset({
            ...data,
            street: data.address.street,
            city: data.address.city,
            state: data.address.state,
            zip: data.address.zip,
            dateOfBirth: data.dateOfBirth instanceof Timestamp ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
          });
        } else {
           const basicProfile = {
             fullName: user.displayName || 'New User',
             email: user.email || '',
             photoURL: user.photoURL || '',
             dateOfBirth: new Date(),
             country: '',
             address: { street: '', city: '', state: '', zip: ''},
             createdAt: user.metadata.creationTime || new Date().toISOString(),
             kycLevel: 'Standard' as const,
           };
           setProfile(basicProfile);
           reset({
            ...basicProfile,
            street: '', city: '', state: '', zip: '',
           });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
         toast({ title: 'Error', description: 'Could not fetch your profile.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [user, reset]);

  const handleUpdateProfile: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedProfileData = {
        ...profile, // keep existing data like email, photoURL, createdAt
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
        },
      };

      await setDoc(userDocRef, updatedProfileData, { merge: true });
      await updateProfile(user, { displayName: data.fullName });

      setProfile(updatedProfileData as UserProfileData);
      setIsEditing(false);
      toast({ title: 'Success!', description: 'Your profile has been updated.' });
    } catch (error) {
       console.error("Error updating profile:", error);
       toast({ title: 'Update Failed', description: 'Could not update your profile.', variant: 'destructive' });
    }
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    const file = event.target.files[0];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    if (file.size > MAX_FILE_SIZE) {
        toast({
            title: 'File Too Large',
            description: 'Please select a file smaller than 10MB.',
            variant: 'destructive',
        });
        return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await updateProfile(user, { photoURL: downloadURL });
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

      await fetchProfile(); // Refetch profile to get the latest data including photoURL
      
      toast({ title: 'Success!', description: 'Your profile photo has been updated.' });
    } catch (error) {
       toast({ title: 'Upload Failed', description: 'Could not upload your photo.', variant: 'destructive' });
       console.error("Upload error:", error);
    } finally {
        setUploading(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return names[0].substring(0, 2).toUpperCase();
  };
  
  const formatDate = (dateValue: string | Date | Timestamp | undefined) => {
    if (!dateValue) return 'N/A';
    try {
        const date = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return 'N/A';
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-8">
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </CardContent>
        </Card>
    </div>
  );

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Profile Settings</h1>
        </div>

        {loading ? renderSkeleton() : (
            <div className="space-y-8">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profile?.photoURL || user?.photoURL || ""} alt={profile?.fullName || 'User'} />
                            <AvatarFallback>{getInitials(profile?.fullName || user?.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold">{profile?.fullName || user?.displayName}</h2>
                            <p className="text-muted-foreground">{profile?.email || user?.email}</p>
                            <p className="text-sm text-muted-foreground mt-1">Member since {formatDate(profile?.createdAt || user?.metadata.creationTime)}</p>
                        </div>
                        <div className="text-center">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" style={{ display: 'none' }} />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                {uploading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">Maximum of 10MB.</p>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <form onSubmit={handleSubmit(handleUpdateProfile)}>
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>Manage your personal and address details.</CardDescription>
                                    </div>
                                    {!isEditing && (
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit className="mr-2 h-4 w-4" />Edit
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isEditing ? (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="fullName">Full Name</Label>
                                                    <Input id="fullName" {...register('fullName')} />
                                                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Date of Birth</Label>
                                                    <Controller
                                                        name="dateOfBirth"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} /></PopoverContent>
                                                            </Popover>
                                                        )}
                                                    />
                                                    {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                                                </div>
                                            </div>
                                            <Separator />
                                            <div className="space-y-2">
                                                <Label htmlFor="street">Street Address</Label>
                                                <Input id="street" {...register('street')} />
                                                {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
                                            </div>
                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" {...register('city')} />{errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}</div>
                                                <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" {...register('state')} />{errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}</div>
                                                <div className="space-y-2"><Label htmlFor="zip">ZIP Code</Label><Input id="zip" {...register('zip')} />{errors.zip && <p className="text-sm text-destructive">{errors.zip.message}</p>}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Input id="country" {...register('country')} />
                                                {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Full Name</Label><p className="text-sm">{profile?.fullName}</p></div>
                                                <div><Label>Email</Label><p className="text-sm">{profile?.email}</p></div>
                                                <div><Label>Date of Birth</Label><p className="text-sm">{formatDate(profile?.dateOfBirth)}</p></div>
                                                <div><Label>Country</Label><p className="text-sm">{profile?.country}</p></div>
                                            </div>
                                            <Separator/>
                                             <div><Label>Primary Address</Label><p className="text-sm">{profile?.address ? `${profile.address.street}, ${profile.address.city}, ${profile.address.state} ${profile.address.zip}`: 'N/A'}</p></div>
                                        </>
                                    )}
                                </CardContent>
                                {isEditing && (
                                    <CardFooter className="justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); reset(); }}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        </form>
                         <Card>
                            <CardHeader>
                                <CardTitle>Advanced Verification (KYC Level 2)</CardTitle>
                                <CardDescription>Unlock higher limits and features like Escrow by providing additional documentation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profile?.kycLevel === 'Advanced' ? (
                                    <div className="flex items-center justify-center text-center p-8 bg-green-500/10 rounded-lg">
                                        <div className="space-y-2">
                                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto"/>
                                            <h3 className="text-lg font-semibold">Advanced Verification Complete</h3>
                                            <p className="text-sm text-muted-foreground">You have full access to all platform features.</p>
                                        </div>
                                    </div>
                                ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-semibold">Utility Bill</p>
                                            <p className="text-xs text-muted-foreground">Proof of address (e.g., electricity, water bill).</p>
                                        </div>
                                        <Button variant="outline" size="sm"><FileUp className="mr-2 h-4 w-4" />Upload</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-semibold">Facial Verification</p>
                                            <p className="text-xs text-muted-foreground">A quick video selfie to verify your identity.</p>
                                        </div>
                                        <Button variant="outline" size="sm"><Video className="mr-2 h-4 w-4" />Start</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-semibold">Income Declaration</p>
                                            <p className="text-xs text-muted-foreground">Statement of income source.</p>
                                        </div>
                                        <Button variant="outline" size="sm"><Wallet className="mr-2 h-4 w-4" />Upload</Button>
                                    </div>
                                </div>
                                )}
                            </CardContent>
                            {profile?.kycLevel !== 'Advanced' &&
                                <CardFooter>
                                    <p className="text-xs text-muted-foreground">Verification is typically completed within 24 hours.</p>
                                </CardFooter>
                            }
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* Security */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Manage your account security.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="w-full justify-start">
                                    <KeyRound className="mr-2 h-4 w-4"/> Change Password
                                </Button>
                                <div className="flex items-center justify-between p-2 rounded-md border">
                                    <Label htmlFor="2fa-switch" className="flex items-center gap-2">
                                        <Shield className="h-4 w-4"/> Two-Factor Auth
                                    </Label>
                                    <Switch id="2fa-switch" />
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Verification Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge variant={profile?.kycLevel === 'Advanced' ? 'default' : 'secondary'}>
                                    {profile?.kycLevel || 'Standard'}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Your current verification level determines your transaction limits.
                                </p>
                            </CardContent>
                        </Card>
                        {/* Account Actions */}
                        <Card>
                             <CardHeader>
                                <CardTitle>Account Actions</CardTitle>
                             </CardHeader>
                             <CardContent>
                                <Button variant="destructive" className="w-full justify-start">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                </Button>
                             </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        )}
      </main>
    </DashboardLayout>
  );
}
