
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Mail, User as UserIcon, Phone, Globe, Edit, ShieldCheck, KeyRound, UploadCloud, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';

export default function ProfilePage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
        let photoURL = user.photoURL;

        // If a new image file is selected, upload it
        if (imageFile) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            photoURL = await getDownloadURL(snapshot.ref);
        }

        // Update Firebase Auth profile
        await updateProfile(user, {
            displayName: displayName,
            photoURL: photoURL,
        });

        // Update Firestore document
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            name: displayName,
            photoURL: photoURL,
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(user?.displayName || '');
    setPreviewImage(null);
    setImageFile(null);
  }

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
                                <AvatarImage src={previewImage || user?.photoURL || ''} alt={user?.displayName || 'User'} />
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
                            <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                        )}

                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant={user?.emailVerified ? 'default' : 'destructive'} className={user?.emailVerified ? 'bg-green-500/20 text-green-700' : ''}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {user?.emailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         <Button variant="outline" className="w-full justify-start"><KeyRound className="mr-2 h-4 w-4"/>Change Password</Button>
                         <Button variant="outline" className="w-full justify-start"><ShieldCheck className="mr-2 h-4 w-4"/>Enable Two-Factor Auth</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Manage your personal and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><UserIcon className="h-4 w-4"/>Full Name</Label>
                                {isEditing ? <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSaving}/> : <p className="font-medium">{user?.displayName || 'N/A'}</p>}
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
                                {isEditing ? <Input defaultValue={user?.phoneNumber || ''} placeholder="Add phone number" disabled={isSaving}/> : <p className="font-medium">{user?.phoneNumber || 'Not provided'}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4"/>Country</Label>
                                <p className="font-medium">Nigeria</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
