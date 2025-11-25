
'use client';

import { useState, useEffect, useRef } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Mail, User as UserIcon, Phone, Globe, Edit, ShieldCheck, KeyRound, UploadCloud, Loader2, Home, CheckCircle, ArrowRight, Eye, EyeOff, Building2, Ticket, Fingerprint, BadgeInfo, Camera, Copy, Landmark, Banknote, Sparkles, Clock, Briefcase, Users, Building, CheckCircle2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { KycStatus } from '@/types/kyc';
import { normalizeKycStatus } from '@/types/kyc';
import { DEFAULT_KYC_CONFIG } from '@/config/kyc-config';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTabs } from '@/components/enhanced-tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFlagCode } from '@/utils/currency-meta';
import Image from 'next/image';
// 2FA card is intentionally not shown on Profile page. It's available in Settings.


const kycStatusConfig: Record<KycStatus | 'default', { color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    verified: { color: 'text-green-700', variant: 'default' },
    pending: { color: 'text-yellow-700', variant: 'secondary' },
    unverified: { color: 'text-gray-700', variant: 'outline' },
    restricted: { color: 'text-orange-700', variant: 'destructive' },
    rejected: { color: 'text-red-700', variant: 'destructive' },
    default: { color: 'text-gray-700', variant: 'outline' },
};


const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const setPinSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits."),
  confirmPin: z.string().length(4, "PIN must be 4 digits."),
}).refine(data => data.pin === data.confirmPin, {
    message: "PINs do not match.",
    path: ["confirmPin"],
});

const changePinSchema = z.object({
  currentPin: z.string().length(4, 'Current PIN is required.'),
  newPin: z.string().length(4, "New PIN must be 4 digits."),
  confirmNewPin: z.string().length(4, "PIN must be 4 digits."),
}).refine(data => data.newPin === data.confirmNewPin, {
    message: "New PINs do not match.",
    path: ["confirmNewPin"],
});


type PasswordFormValues = z.infer<typeof passwordSchema>;
type SetPinFormValues = z.infer<typeof setPinSchema>;
type ChangePinFormValues = z.infer<typeof changePinSchema>;


export default function ProfilePage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPasswordForm } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const { control: setPinControl, handleSubmit: handleSetPinSubmit, formState: { errors: setPinErrors }, reset: resetSetPinForm } = useForm<SetPinFormValues>({
    resolver: zodResolver(setPinSchema),
  });
  
  const { control: changePinControl, handleSubmit: handleChangePinSubmit, formState: { errors: changePinErrors }, reset: resetChangePinForm } = useForm<ChangePinFormValues>({
    resolver: zodResolver(changePinSchema),
  });

  const [displayName, setDisplayName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoading(false);
        setLoadingBusiness(false);
        return;
    };

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setUserData(data);
            setDisplayName(data.name || user.displayName || '');
            setStreet(data.street || '');
            setCity(data.city || '');
            setState(data.state || '');
            setZip(data.zip || '');
            setPhone(data.phone || '');
            
            // Automatically exit edit mode if KYC becomes verified
            const kycStatus = normalizeKycStatus(data?.kycStatus);
            if (kycStatus === 'verified') {
                setIsEditing((prevIsEditing) => {
                    if (prevIsEditing) {
                        toast({
                            title: "Edit Mode Disabled",
                            description: "Personal information editing is disabled after KYC verification.",
                            variant: "default"
                        });
                    }
                    return false;
                });
            }
            
            // Check for business profile
            const profile = data.businessProfile;
            if (profile && (profile.status === 'approved' || profile.status === 'Approved')) {
                setBusinessProfile(profile);
            } else {
                setBusinessProfile(null);
            }
        }
        setLoading(false);
        setLoadingBusiness(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getBusinessInitials = (name?: string) => {
    if (!name) return 'B';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const businessTypeMap: { [key: string]: string } = {
    'sole-prop': 'Sole Proprietorship',
    'llc': 'LLC',
    'corporation': 'Corporation',
    'non-profit': 'Non-Profit',
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setPreviewImage(URL.createObjectURL(file));
      setImageFile(file);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!user) return;
    
    // Prevent saving personal information if KYC is verified
    const kycStatus = normalizeKycStatus(userData?.kycStatus);
    if (kycStatus === 'verified') {
      toast({
        title: "Cannot Update",
        description: "Personal information cannot be edited after KYC verification.",
        variant: "destructive"
      });
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    try {
        let photoURL = userData?.photoURL;

        if (imageFile) {
            const folderRef = ref(storage, `profile_pictures/${user.uid}/`);
            
            const existingFiles = await listAll(folderRef);
            for (const item of existingFiles.items) {
                await deleteObject(item);
            }
            
            const fileRef = ref(storage, `profile_pictures/${user.uid}/${imageFile.name}`);
            await uploadBytes(fileRef, imageFile);
            photoURL = await getDownloadURL(fileRef);
        }

        await updateProfile(user, { displayName, photoURL });

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            name: displayName,
            photoURL: photoURL,
            phone: phone,
            street,
            city,
            state,
            zip,
        });

        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });
        setIsEditing(false);
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            title: "Update Failed",
            description: "Could not save your profile changes. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const onPasswordSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
    if (!user || !user.email) {
        toast({ title: 'Error', description: 'Not authenticated.', variant: 'destructive' });
        return;
    }
    setIsSaving(true);
    try {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.newPassword);
        toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
        resetPasswordForm();
        setIsPasswordDialogOpen(false);
    } catch (error) {
        console.error("Password update error:", error);
        toast({ title: 'Error updating password', description: 'Your current password may be incorrect.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

    const onSetPinSubmit: SubmitHandler<SetPinFormValues> = async (data) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { transactionPin: data.pin });
            toast({ title: 'Transaction PIN Set', description: 'Your PIN has been set successfully.' });
            resetSetPinForm();
            setIsPinDialogOpen(false);
        } catch (error) {
            console.error("PIN set error:", error);
            toast({ title: 'Error Setting PIN', description: 'Could not set your PIN. Please try again.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const onChangePinSubmit: SubmitHandler<ChangePinFormValues> = async (data) => {
        if (!user || userData?.transactionPin !== data.currentPin) {
            toast({ title: 'Invalid Current PIN', description: 'The current PIN you entered is incorrect.', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { transactionPin: data.newPin });
            toast({ title: 'Transaction PIN Changed', description: 'Your PIN has been updated successfully.' });
            resetChangePinForm();
            setIsPinDialogOpen(false);
        } catch (error) {
            console.error("PIN change error:", error);
            toast({ title: 'Error Changing PIN', description: 'Could not change your PIN. Please try again.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
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
                    
                    setPreviewImage(canvas.toDataURL('image/jpeg'));
                    setImageFile(file);
                    stopCamera();
                    setShowCamera(false);
                }
            }, 'image/jpeg');
        }
    };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(userData?.name || user?.displayName || '');
    setStreet(userData?.street || '');
    setCity(userData?.city || '');
    setState(userData?.state || '');
    setZip(userData?.zip || '');
    setPhone(userData?.phone || '');
    setPreviewImage(null);
    setImageFile(null);
  }
  
    const currentKycStatus: KycStatus = normalizeKycStatus(userData?.kycStatus);
    const kycStatusBadge = kycStatusConfig[currentKycStatus] || kycStatusConfig.default;
    const formattedKycStatus = currentKycStatus.charAt(0).toUpperCase() + currentKycStatus.slice(1);
  const userTier = userData?.userType || 'Pending';
  const hasPin = !!userData?.transactionPin;
  
  const accountDetails = userData?.accountDetails || {};
  const activeWallets = userData?.wallets?.map((w: any) => w.currency) || [];
  const walletBalances = userData?.wallets?.reduce((acc: Record<string, number>, w: any) => {
    acc[w.currency] = w.balance || 0;
    return acc;
  }, {}) || {};
  const hasVirtualAccounts = Object.keys(accountDetails).length > 0 && Object.values(accountDetails).some((details: any) => details && Object.keys(details).length > 0);
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };


  const copyAccountDetails = (details: object) => {
    const detailsText = Object.entries(details)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}: ${value}`)
        .join('\n');
    navigator.clipboard.writeText(detailsText);
    toast({
        title: "Account Details Copied!",
    });
  }


  if (loading) {
    return (
        <DashboardLayout language={language} setLanguage={() => {}}>
            <main className="flex-1 p-4 lg:p-6">
                <Skeleton className="h-8 w-1/4 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                     <div className="lg:col-span-2">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </main>
        </DashboardLayout>
    )
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex-1 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          {!isEditing ? (
            currentKycStatus !== 'verified' ? (
              <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            ) : null
          ) : (
             <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="relative">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={previewImage || userData?.photoURL || ''} alt={displayName || 'User'} />
                                <AvatarFallback>{getInitials(displayName || user?.displayName)}</AvatarFallback>
                            </Avatar>
                             {isEditing && currentKycStatus !== 'verified' && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full">
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => document.getElementById('photo-upload')?.click()}>
                                            <UploadCloud className="mr-2 h-4 w-4"/> Upload
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={startCamera}>
                                            <Camera className="mr-2 h-4 w-4"/> Take Selfie
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             )}
                            <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isSaving} />
                        </div>

                        {isEditing && currentKycStatus !== 'verified' ? (
                            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="text-xl font-semibold text-center h-auto border-0 focus-visible:ring-1"/>
                        ) : (
                            <h2 className="text-xl font-semibold">{displayName}</h2>
                        )}

                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant={kycStatusBadge.variant} className={cn('capitalize', kycStatusBadge.color, kycStatusBadge.color.replace('text-','bg-').replace('-700','-500/20'))}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {formattedKycStatus}
                            </Badge>
                             <Badge variant="secondary">
                                {userTier}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start"><KeyRound className="mr-2 h-4 w-4"/>Change Password</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                                    <DialogHeader>
                                        <DialogTitle>Change Password</DialogTitle>
                                        <DialogDescription>Enter your current password and a new password.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword">Current Password</Label>
                                            <Input id="currentPassword" type="password" {...registerPassword('currentPassword')} />
                                            {passwordErrors.currentPassword && <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <div className="relative">
                                                <Input id="newPassword" type={showPassword ? 'text' : 'password'} {...registerPassword('newPassword')} />
                                                 <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(p => !p)}>
                                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                </Button>
                                            </div>
                                            {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                            <div className="relative">
                                                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} {...registerPassword('confirmPassword')} />
                                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(p => !p)}>
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                </Button>
                                            </div>
                                            {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" type="button" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Update Password
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                         <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start"><Fingerprint className="mr-2 h-4 w-4"/>Set/Change Transaction PIN</Button>
                            </DialogTrigger>
                            <DialogContent>
                                {hasPin ? (
                                    <form onSubmit={handleChangePinSubmit(onChangePinSubmit)}>
                                        <DialogHeader>
                                            <DialogTitle>Change Transaction PIN</DialogTitle>
                                            <DialogDescription>Enter your current PIN and a new one.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-6">
                                            <div className="space-y-2 text-center"><Label>Current PIN</Label><Controller name="currentPin" control={changePinControl} render={({ field }) => (<InputOTP maxLength={4} {...field}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /></InputOTPGroup></InputOTP>)} />{changePinErrors.currentPin && <p className="text-sm text-destructive">{changePinErrors.currentPin.message}</p>}</div>
                                            <div className="space-y-2 text-center"><Label>New PIN</Label><Controller name="newPin" control={changePinControl} render={({ field }) => (<InputOTP maxLength={4} {...field}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /></InputOTPGroup></InputOTP>)} />{changePinErrors.newPin && <p className="text-sm text-destructive">{changePinErrors.newPin.message}</p>}</div>
                                            <div className="space-y-2 text-center"><Label>Confirm New PIN</Label><Controller name="confirmNewPin" control={changePinControl} render={({ field }) => (<InputOTP maxLength={4} {...field}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /></InputOTPGroup></InputOTP>)} />{changePinErrors.confirmNewPin && <p className="text-sm text-destructive">{changePinErrors.confirmNewPin.message}</p>}</div>
                                        </div>
                                         <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsPinDialogOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Change PIN</Button>
                                        </DialogFooter>
                                    </form>
                                ) : (
                                    <form onSubmit={handleSetPinSubmit(onSetPinSubmit)}>
                                        <DialogHeader>
                                            <DialogTitle>Set Transaction PIN</DialogTitle>
                                            <DialogDescription>Your 4-digit PIN is used to authorize all transactions.</DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <div className="space-y-2 text-center"><Label>Enter New 4-Digit PIN</Label><Controller name="pin" control={setPinControl} render={({ field }) => (<InputOTP maxLength={4} {...field}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /></InputOTPGroup></InputOTP>)} />{setPinErrors.pin && <p className="text-sm text-destructive">{setPinErrors.pin.message}</p>}</div>
                                            <div className="space-y-2 text-center"><Label>Confirm New PIN</Label><Controller name="confirmPin" control={setPinControl} render={({ field }) => (<InputOTP maxLength={4} {...field}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /></InputOTPGroup></InputOTP>)} />{setPinErrors.confirmPin && <p className="text-sm text-destructive">{setPinErrors.confirmPin.message}</p>}</div>
                                        </div>
                                         <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsPinDialogOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Set PIN</Button>
                                        </DialogFooter>
                                    </form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
                
                {/* Business & Corporate Settings */}
                <Card className={businessProfile ? "" : "border-dashed"}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5"/> 
                      Business & Corporate Settings
                    </CardTitle>
                    <CardDescription>
                      {businessProfile 
                        ? "Manage your team, roles, and company details."
                        : "Manage your team, roles, and company details. (Pro feature)"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingBusiness ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : businessProfile ? (
                      <div className="space-y-4">
                        {/* Business Summary */}
                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                          <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarImage src={businessProfile.logoUrl} alt={businessProfile.legalName || businessProfile.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                              {getBusinessInitials(businessProfile.legalName || businessProfile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-lg">{businessProfile.legalName || businessProfile.name}</h3>
                                {businessProfile.industry && (
                                  <p className="text-sm text-muted-foreground">{businessProfile.industry}</p>
                                )}
                              </div>
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              {businessProfile.businessType && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Building className="h-3.5 w-3.5" />
                                  <span>{businessTypeMap[businessProfile.businessType] || businessProfile.businessType}</span>
                                </div>
                              )}
                              {businessProfile.website && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-3.5 w-3.5" />
                                  <a 
                                    href={businessProfile.website.startsWith('http') ? businessProfile.website : `https://${businessProfile.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                  >
                                    {businessProfile.website}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button asChild variant="outline" className="w-full justify-between">
                            <Link href="/business/settings">
                              <span>Manage Team Members</span>
                              <Users className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full justify-between">
                            <Link href="/business/settings">
                              <span>Company Details & Documents</span>
                              <Building className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!hasVirtualAccounts && (
                          <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center space-y-2">
                            <p className="text-sm font-medium text-primary">New to Payvost?</p>
                            <p className="text-xs text-muted-foreground">Create your first virtual account to get started with business features.</p>
                            <Button asChild size="sm" variant="default" className="mt-2">
                              <Link href="/dashboard/wallets">
                                Create Virtual Account
                                <ArrowRight className="ml-2 h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                          <div className="rounded-full bg-primary/10 p-4">
                            <Sparkles className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Explore Business Features</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              Unlock powerful tools for managing your business finances, team members, and corporate transactions.
                            </p>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-2 flex flex-col items-center w-full max-w-sm">
                            <li className="flex items-center justify-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Team member management
                            </li>
                            <li className="flex items-center justify-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Advanced financial controls
                            </li>
                            <li className="flex items-center justify-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Corporate invoicing
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {businessProfile ? (
                      <Button asChild className="w-full">
                        <Link href="/business">
                          Switch to Business Dashboard
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="secondary" className="w-full">
                        <Link href="/dashboard/get-started">
                          Explore Business Features
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Manage your personal and contact details.
                            {currentKycStatus === 'verified' && (
                                <span className="block mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Your personal information is locked after KYC verification.
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><UserIcon className="h-4 w-4"/>Full Name</Label>
                                {isEditing && currentKycStatus !== 'verified' ? <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSaving}/> : <p className="font-medium">{displayName || 'N/A'}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4"/>Email Address</Label>
                                <p className="font-medium">{user?.email || 'N/A'}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4"/>Phone Number</Label>
                                {isEditing && currentKycStatus !== 'verified' ? <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" disabled={isSaving}/> : <p className="font-medium">{phone || 'Not provided'}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4"/>Country</Label>
                                <p className="font-medium">{userData?.country || 'Not set'}</p>
                            </div>
                        </div>
                         <Separator />
                         <div className="space-y-2">
                             <Label className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4"/>Address</Label>
                            {isEditing && currentKycStatus !== 'verified' ? (
                                <div className="space-y-2">
                                    <Input placeholder="Street Address" value={street} onChange={(e) => setStreet(e.target.value)} disabled={isSaving}/>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} disabled={isSaving}/>
                                        <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} disabled={isSaving}/>
                                        <Input placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} disabled={isSaving}/>
                                    </div>
                                </div>
                            ) : (
                                <p className="font-medium">
                                    {userData?.street ? `${userData.street}, ${userData.city}, ${userData.state} ${userData.zip}` : 'No address provided'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5"/>Account Details</CardTitle>
                        <CardDescription>Your details for receiving local payments into your wallets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={activeWallets[0] || ''} className="w-full">
                            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.max(1, activeWallets.length)}, minmax(0, 1fr))` }}>
                              {activeWallets.map((currency: string) => (
                                <TooltipProvider key={currency}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <TabsTrigger value={currency} className="flex flex-col items-center gap-1 h-auto py-3">
                                        <Image 
                                          src={`/flag/${getFlagCode(currency)}.png`} 
                                          alt={currency}
                                          width={20}
                                          height={20}
                                          className="rounded-full"
                                        />
                                        <span className="text-xs font-medium">{currency}</span>
                                        {walletBalances[currency] !== undefined && (
                                          <span className="text-[10px] text-muted-foreground">
                                            {formatCurrency(walletBalances[currency], currency)}
                                          </span>
                                        )}
                                      </TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View {currency} account details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </TabsList>
                            {activeWallets.map((currency: string) => (
                                <TabsContent key={currency} value={currency} className="animate-in fade-in-50">
                                <div className="mt-4 space-y-3 rounded-md border p-4">
                                    {accountDetails[currency] ? (
                                    <>
                                        {Object.entries(accountDetails[currency]).map(([key, value]) => (
                                            <div key={key} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span>
                                                <span className="font-semibold">{String(value)}</span>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => copyAccountDetails(accountDetails[currency])}>
                                            <Copy className="mr-2 h-4 w-4" /> Copy {currency} Details
                                        </Button>
                                    </>
                                    ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/30">
                                        <div className="relative mb-4">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="h-16 w-16 rounded-full bg-primary/10 animate-pulse"></div>
                                            </div>
                                            <div className="relative flex items-center justify-center">
                                                <Sparkles className="h-8 w-8 text-primary/60" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Account Details Pending</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-sm mb-2">
                                            Your {currency} account details are being generated by our partners.
                                        </p>
                                        <p className="text-xs text-muted-foreground text-center max-w-sm flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            They will appear here once ready
                                        </p>
                                    </div>
                                    )}
                                </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Identity Verification</CardTitle>
                        <CardDescription>Manage your identity verification documents.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-muted-foreground flex items-center gap-2"><Ticket className="h-4 w-4"/>ID Type</Label><p className="font-medium">{userData?.idType || 'Not provided'}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground flex items-center gap-2"><Fingerprint className="h-4 w-4"/>ID Number</Label><p className="font-medium">{userData?.idNumber || 'Not provided'}</p></div>
                        </div>
                         {userData?.bvn && (
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><Fingerprint className="h-4 w-4"/>BVN</Label>
                                <p className="font-medium">{userData.bvn}</p>
                            </div>
                        )}
                         {currentKycStatus !== 'verified' && (
                             <div className="border bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-300 rounded-lg p-4 flex items-start gap-4 mt-4">
                                <BadgeInfo className="h-5 w-5 mt-0.5 text-yellow-600"/>
                                <div>
                                    <h4 className="font-semibold">Verification Pending</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                        Your identity documents are currently under review. This usually takes a few hours. You can track the status here.
                                    </p>
                                </div>
                             </div>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>KYC Verification Tiers</CardTitle>
                        <CardDescription>Increase your limits by providing more verification.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Card className={cn(
                            "bg-primary/5",
                            userData?.kycProfile?.tiers?.tier2?.status === 'approved' && "bg-green-50 dark:bg-green-950/20"
                         )}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Tier 2: Verified
                                    {userData?.kycProfile?.tiers?.tier2?.status === 'approved' && (
                                        <Badge className="bg-green-500">Approved</Badge>
                                    )}
                                    {userData?.kycProfile?.tiers?.tier2?.status === 'submitted' && (
                                        <Badge variant="secondary">Under Review</Badge>
                                    )}
                                </CardTitle>
                                {userData?.kycProfile?.tiers?.tier2?.autoApproved && userData?.kycProfile?.tiers?.tier2?.status === 'approved' && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" /> Auto-Approved
                                    </Badge>
                                  </div>
                                )}
                                {userData?.kycProfile?.tiers?.tier2?.confidenceScore && userData?.kycProfile?.tiers?.tier2?.status === 'approved' && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>Confidence Score</span>
                                      <span className="font-semibold">{userData.kycProfile.tiers.tier2.confidenceScore}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full transition-all"
                                        style={{ width: `${userData.kycProfile.tiers.tier2.confidenceScore}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    {DEFAULT_KYC_CONFIG.tiers.tier2.services?.map((service, idx) => (
                                        <li key={idx} className="flex items-center">
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2"/>
                                            {service}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                             <CardFooter>
                                {userData?.kycProfile?.tiers?.tier2?.status === 'approved' ? (
                                    <Button className="w-full" disabled>
                                        <CheckCircle className="mr-2 h-4 w-4"/>Tier 2 Approved
                                    </Button>
                                ) : userData?.kycProfile?.tiers?.tier2?.status === 'submitted' || userData?.kycProfile?.tiers?.tier2?.status === 'pending_review' ? (
                                    <Button className="w-full" disabled>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>Under Review
                                    </Button>
                                ) : (
                                    <Button 
                                        className="w-full" 
                                        asChild
                                        disabled={
                                            userData?.kycTier !== 'tier1' || 
                                            (userData?.kycStatus !== 'verified' && userData?.kycStatus !== 'tier1_verified') ||
                                            userData?.kycProfile?.tiers?.tier1?.status !== 'approved'
                                        }
                                    >
                                        <Link href="/dashboard/kyc/upgrade-tier2">
                                            Upgrade to Tier 2 <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                         <Card className={cn(
                            "bg-muted/50",
                            userData?.kycProfile?.tiers?.tier3?.status === 'approved' && "bg-green-50 dark:bg-green-950/20",
                            (userData?.kycProfile?.tiers?.tier2?.status === 'approved' && userData?.kycProfile?.tiers?.tier3?.status !== 'approved') && "bg-primary/5"
                         )}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Tier 3: Verified Pro
                                    {userData?.kycProfile?.tiers?.tier3?.status === 'approved' && (
                                        <Badge className="bg-green-500">Approved</Badge>
                                    )}
                                    {userData?.kycProfile?.tiers?.tier3?.status === 'submitted' && (
                                        <Badge variant="secondary">Under Review</Badge>
                                    )}
                                </CardTitle>
                                {userData?.kycProfile?.tiers?.tier3?.autoApproved && userData?.kycProfile?.tiers?.tier3?.status === 'approved' && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      <Sparkles className="h-3 w-3 mr-1" /> Auto-Approved
                                    </Badge>
                                  </div>
                                )}
                                {userData?.kycProfile?.tiers?.tier3?.confidenceScore && userData?.kycProfile?.tiers?.tier3?.status === 'approved' && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>Confidence Score</span>
                                      <span className="font-semibold">{userData.kycProfile.tiers.tier3.confidenceScore}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full transition-all"
                                        style={{ width: `${userData.kycProfile.tiers.tier3.confidenceScore}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <ul className={cn(
                                    "space-y-2 text-sm",
                                    userData?.kycProfile?.tiers?.tier3?.status === 'locked' && "text-muted-foreground"
                                )}>
                                    {DEFAULT_KYC_CONFIG.tiers.tier3.services?.map((service, idx) => (
                                        <li key={idx} className="flex items-center">
                                            <CheckCircle className={cn(
                                                "h-4 w-4 mr-2",
                                                userData?.kycProfile?.tiers?.tier3?.status === 'locked' ? "" : "text-green-500"
                                            )}/>
                                            {service}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {userData?.kycProfile?.tiers?.tier3?.status === 'approved' ? (
                                    <Button className="w-full" disabled>
                                        <CheckCircle className="mr-2 h-4 w-4"/>Tier 3 Approved
                                    </Button>
                                ) : userData?.kycProfile?.tiers?.tier3?.status === 'submitted' || userData?.kycProfile?.tiers?.tier3?.status === 'pending_review' ? (
                                    <Button className="w-full" disabled>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>Under Review
                                    </Button>
                                ) : userData?.kycProfile?.tiers?.tier2?.status === 'approved' ? (
                                    <Button className="w-full" asChild>
                                        <Link href="/dashboard/get-started/onboarding/business">
                                            Upgrade to Tier 3 <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button className="w-full" disabled>Requires Tier 2</Button>
                                )}
                            </CardFooter>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </div>
        <Dialog open={showCamera} onOpenChange={(open) => {
           if (!open) stopCamera();
           setShowCamera(open);
       }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Take a Selfie</DialogTitle>
                </DialogHeader>
                <div className="relative aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" ></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { stopCamera(); setShowCamera(false); }}>Cancel</Button>
                    <Button onClick={handleCapture}>Capture</Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>
      </main>
    </DashboardLayout>
  );
}
