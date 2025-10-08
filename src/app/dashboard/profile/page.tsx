
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Mail, User as UserIcon, Phone, Globe, Edit, ShieldCheck, KeyRound, UploadCloud, Loader2, Home, CheckCircle, ArrowRight, Eye, EyeOff, Building2, Ticket, Fingerprint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { KycStatus } from '@/types/customer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

const kycStatusConfig: Record<KycStatus | 'Default', { color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Verified: { color: 'text-green-700', variant: 'default' },
    Pending: { color: 'text-yellow-700', variant: 'secondary' },
    Unverified: { color: 'text-gray-700', variant: 'outline' },
    Restricted: { color: 'text-orange-700', variant: 'destructive' },
    Default: { color: 'text-gray-700', variant: 'outline' },
};


const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPasswordForm } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
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
  
  const currentKycStatus: KycStatus = userData?.kycStatus || 'Unverified';
  const kycStatusBadge = kycStatusConfig[currentKycStatus] || kycStatusConfig.Default;
  const userTier = userData?.userType || 'Pending';


  if (loading) {
    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
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
                                <>
                                 <Label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 cursor-pointer p-2 bg-primary text-primary-foreground rounded-full border-2 border-background hover:bg-primary/90">
                                    <UploadCloud className="h-4 w-4" />
                                </Label>
                                <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isSaving} />
                                </>
                            )}
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
                                {currentKycStatus}
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
                         <Button variant="outline" className="w-full justify-start"><ShieldCheck className="mr-2 h-4 w-4"/>Enable Two-Factor Auth</Button>
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
      </main>
    </DashboardLayout>
  );
}
