
'use client';

import { useState, useEffect, useRef } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, Bell, User, Shield, CreditCard, Trash2, Edit, UploadCloud, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    fullName: string;
    email: string;
    dateOfBirth: string;
    country: string;
    photoURL?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    createdAt: string;
}

export default function ProfilePage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // If no profile exists in Firestore, create a basic one from auth data
             setProfile({
               fullName: user.displayName || 'New User',
               email: user.email || '',
               photoURL: user.photoURL || '',
               dateOfBirth: '',
               country: '',
               address: { street: '', city: '', state: '', zip: ''},
               createdAt: user.metadata.creationTime || new Date().toISOString(),
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
    fetchProfile();
  }, [user, toast]);

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

    const storageRef = ref(storage, `profile_pictures/${user.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Optional: handle progress
      },
      (error) => {
        console.error("Upload failed:", error);
        let description = 'Could not upload your photo. Please try again.';
        switch (error.code) {
            case 'storage/unauthorized':
                description = "You don't have permission to upload this file.";
                break;
            case 'storage/canceled':
                description = 'The upload was canceled.';
                break;
            case 'storage/quota-exceeded':
                description = 'You have exceeded your storage quota.';
                break;
        }
        toast({ title: 'Upload Failed', description, variant: 'destructive' });
        setUploading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateProfile(user, { photoURL: downloadURL });
          
          const userDocRef = doc(db, 'users', user.uid);
          
          const docSnap = await getDoc(userDocRef);
          const existingData = docSnap.exists() ? docSnap.data() as UserProfile : {
               fullName: user.displayName || 'New User',
               email: user.email || '',
               dateOfBirth: '',
               country: '',
               address: { street: '', city: '', state: '', zip: ''},
               createdAt: user.metadata.creationTime || new Date().toISOString(),
          };

          const newProfileData = {
              ...existingData,
              photoURL: downloadURL,
          };

          await setDoc(userDocRef, newProfileData);

          setProfile(newProfileData);
          
          toast({ title: 'Success!', description: 'Your profile photo has been updated.' });
        } catch (error) {
           console.error("Error updating profile:", error);
           toast({ title: 'Update Failed', description: 'Could not update your profile photo.', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
      }
    );
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return names[0].substring(0, 2).toUpperCase();
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
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
                        {/* Personal Information */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Manage your personal details.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Full Name</Label>
                                        <p className="text-sm">{profile?.fullName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Email</Label>
                                        <p className="text-sm">{profile?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Date of Birth</Label>
                                        <p className="text-sm">{formatDate(profile?.dateOfBirth)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Country</Label>
                                        <p className="text-sm">{profile?.country}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle>Address</CardTitle>
                                    <CardDescription>Update your primary address.</CardDescription>
                                </div>
                                 <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Edit</Button>
                            </CardHeader>
                             <CardContent className="space-y-1">
                                <Label>Primary Address</Label>
                                <p className="text-sm">{profile?.address ? `${profile.address.street}, ${profile.address.city}, ${profile.address.state} ${profile.address.zip}`: 'N/A'}</p>
                             </CardContent>
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
