
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
import { Mail, User as UserIcon, Phone, Globe, Edit, ShieldCheck, KeyRound, UploadCloud, Loader2, Home, CheckCircle, ArrowRight, Eye, EyeOff, Building2, Ticket, Fingerprint, BadgeInfo, Camera, Copy, Landmark, Banknote } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        }
        setLoading(false);
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
            <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
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
                             {isEditing && (
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

                        {isEditing ? (
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
                
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Manage your personal and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><UserIcon className="h-4 w-4"/>Full Name</Label>
                                {isEditing ? <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSaving}/> : <p className="font-medium">{displayName || 'N/A'}</p>}
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
                                {isEditing ? <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" disabled={isSaving}/> : <p className="font-medium">{phone || 'Not provided'}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4"/>Country</Label>
                                <p className="font-medium">{userData?.country || 'Not set'}</p>
                            </div>
                        </div>
                         <Separator />
                         <div className="space-y-2">
                             <Label className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4"/>Address</Label>
                            {isEditing ? (
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
                                    <TabsTrigger key={currency} value={currency}>{currency}</TabsTrigger>
                                ))}
                            </TabsList>
                            {activeWallets.map((currency: string) => (
                                <TabsContent key={currency} value={currency}>
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
                                    <p className="text-center text-muted-foreground py-4">Account details for {currency} are not yet available.</p>
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
                            <div className="space-y-1"><Label className="text-muted-foreground flex items-center gap-2"><Ticket className="h-4 w-4"/>ID Type</Label><p className="font-medium">{userData?.idType || 'N/A'}</p></div>
                            <div className="space-y-1"><Label className="text-muted-foreground flex items-center gap-2"><Fingerprint className="h-4 w-4"/>ID Number</Label><p className="font-medium">{userData?.idNumber || 'N/A'}</p></div>
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
                         <Card className="bg-primary/5">
                            <CardHeader>
                                <CardTitle>Tier 2: Verified</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2"/>Higher transaction limits</li>
                                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2"/>Access to virtual cards</li>
                                </ul>
                            </CardContent>
                             <CardFooter>
                                <Button className="w-full">Upgrade to Tier 2 <ArrowRight className="ml-2 h-4 w-4"/></Button>
                            </CardFooter>
                        </Card>
                         <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle>Tier 3: Verified Pro</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2"/>Unlimited transactions</li>
                                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2"/>Business account features</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled>Requires Tier 2</Button>
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
