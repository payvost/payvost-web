
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { BusinessProfile } from '@/types/business-settings';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

const businessTypeMap: { [key: string]: string } = {
    'sole-prop': 'Sole Proprietorship',
    'llc': 'LLC',
    'corporation': 'Corporation',
    'non-profit': 'Non-Profit',
};

const documentTypeMap: { [key: string]: string } = {
    'incorporation': 'Certificate of Incorporation',
    'address_proof': 'Proof of Address',
    'owner_id': "Owner's ID",
};

function InfoField({ label, value }: { label: string; value: string | undefined | null }) {
    return (
        <div className="p-3 border rounded-lg bg-muted/30">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <p className="font-medium text-sm break-words">{value || 'N/A'}</p>
        </div>
    );
}

export function BusinessProfileSettings() {
    const { user, loading: authLoading } = useAuth();
    const [loadingData, setLoadingData] = useState(true);
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [kycDocuments, setKycDocuments] = useState<any[]>([]);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSavingLogo, setIsSavingLogo] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;
        setLoadingData(true);
        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                const businessProfile = userData.businessProfile || {};
                setProfile(businessProfile);
                setKycDocuments(userData.kycDocuments || []);
                 if (businessProfile.logoUrl) {
                    setLogoPreview(businessProfile.logoUrl);
                }
            }
            setLoadingData(false);
        });
        return () => unsub();
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: 'File too large', description: 'Logo should be less than 2MB.', variant: 'destructive' });
                return;
            }
            if(!file.type.startsWith('image/')) {
                toast({ title: 'Invalid File Type', description: 'Please upload a PNG or JPG file.', variant: 'destructive' });
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSaveLogo = async () => {
        if (!user || !logoFile) return;

        setIsSavingLogo(true);
        try {
            const storageRef = ref(storage, `business_logos/${user.uid}/${logoFile.name}`);
            await uploadBytes(storageRef, logoFile);
            const downloadURL = await getDownloadURL(storageRef);

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                'businessProfile.logoUrl': downloadURL
            });
            
            setProfile(prev => prev ? { ...prev, logoUrl: downloadURL } : null);

            toast({ title: 'Logo Updated', description: 'Your new business logo has been saved.' });
        } catch (error) {
            console.error("Error updating logo:", error);
            toast({ title: 'Upload Failed', description: 'Could not save your new logo.', variant: 'destructive' });
        } finally {
            setIsSavingLogo(false);
        }
    };
    
    if (loadingData || authLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Business Profile</CardTitle>
                    <CardDescription>This information has been verified and cannot be changed. Contact support for any modifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Legal Business Name" value={profile?.name} />
                        <InfoField label="Industry" value={profile?.industry} />
                        <InfoField label="Business Type" value={profile?.type ? businessTypeMap[profile.type] : 'N/A'} />
                        <InfoField label="Registration Number" value={profile?.registrationNumber} />
                        <InfoField label="Tax ID" value={profile?.taxId} />
                        <InfoField label="Website" value={profile?.website} />
                        <div className="sm:col-span-2">
                             <InfoField label="Business Address" value={profile?.address} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Brand Identity</CardTitle>
                    <CardDescription>Upload your business logo for invoices and payment pages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-6 p-4 border rounded-lg">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={logoPreview || undefined} />
                            <AvatarFallback>
                                {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'QI'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h4 className="font-semibold">Business Logo</h4>
                             <Label htmlFor="logo-upload" className="inline-flex items-center justify-center h-9 px-4 py-2 mt-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 cursor-pointer">
                                <UploadCloud className="mr-2 h-4 w-4" />
                                {logoFile ? 'Change Logo' : 'Upload Logo'}
                             </Label>
                             <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg"/>
                            <p className="text-xs text-muted-foreground mt-2">Recommended: 200x200px, PNG or JPG, max 2MB.</p>
                        </div>
                    </div>
                </CardContent>
                {logoFile && (
                     <CardFooter className="justify-end">
                        <Button onClick={handleSaveLogo} disabled={isSavingLogo}>
                            {isSavingLogo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Logo
                        </Button>
                    </CardFooter>
                )}
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>KYC/AML Verification</CardTitle>
                    <CardDescription>Your business verification status and documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-green-500/10 border-green-500/20 text-green-700">
                        <p className="font-semibold">Your business is currently {profile?.status || 'Pending'}.</p>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-medium">Uploaded Documents</h4>
                        {kycDocuments.map((doc, index) => (
                             <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{documentTypeMap[doc.type] || doc.type}</p>
                                    <p className="text-xs text-muted-foreground">Uploaded: {doc.name}</p>
                                </div>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm">View</Button>
                                </a>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
