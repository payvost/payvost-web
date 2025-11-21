
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { BusinessProfile } from '@/types/business-settings';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, CheckCircle2, XCircle, Clock, FileText, ExternalLink, AlertCircle, Briefcase, Shield } from 'lucide-react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

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

function InfoField({ label, value, icon }: { label: string; value: string | undefined | null; icon?: React.ReactNode }) {
    return (
        <div className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
            </div>
            <p className="font-semibold text-sm break-words text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
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

    const getKycStatusBadge = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'verified':
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>;
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Not Submitted</Badge>;
        }
    };

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
            {/* KYC Status Alert */}
            {profile && (
                <Alert className={profile.kycStatus === 'verified' ? 'border-green-500/50 bg-green-500/10' : profile.kycStatus === 'pending' ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-red-500/50 bg-red-500/10'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span className="font-semibold">Verification Status: {getKycStatusBadge(profile.kycStatus)}</span>
                        {profile.kycStatus === 'pending' && (
                            <span className="text-sm text-muted-foreground">Your documents are under review</span>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Business Profile
                    </CardTitle>
                    <CardDescription>This information has been verified and cannot be changed. Contact support for any modifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Legal Business Name" value={profile?.legalName} icon={<FileText className="h-3 w-3" />} />
                        <InfoField label="Industry" value={profile?.industry} />
                        <InfoField label="Business Type" value={profile?.businessType ? businessTypeMap[profile.businessType] : undefined} />
                        <InfoField label="Registration Number" value={profile?.registrationNumber} />
                        <InfoField label="Tax ID" value={profile?.taxId} />
                        <InfoField 
                            label="Website" 
                            value={profile?.website ? (
                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="text-primary hover:underline flex items-center gap-1">
                                    {profile.website}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            ) : undefined
                        } />
                        <div className="sm:col-span-2">
                             <InfoField label="Business Address" value={profile?.businessAddress} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UploadCloud className="h-5 w-5" />
                        Brand Identity
                    </CardTitle>
                    <CardDescription>Upload your business logo for invoices and payment pages. Your logo will be displayed on all customer-facing documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-6 p-6 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <Avatar className="h-24 w-24 border-2 border-border">
                            <AvatarImage src={logoPreview || undefined} className="object-contain" />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                {profile?.legalName ? profile.legalName.substring(0, 2).toUpperCase() : 'BS'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h4 className="font-semibold text-base mb-1">Business Logo</h4>
                                <p className="text-sm text-muted-foreground">Upload a high-quality logo for professional invoices and payment pages</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Label htmlFor="logo-upload" className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium transition-colors bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                                </Label>
                                <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg"/>
                                {logoFile && (
                                    <Button 
                                        onClick={handleSaveLogo} 
                                        disabled={isSavingLogo}
                                        size="sm"
                                        className="h-10"
                                    >
                                        {isSavingLogo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Logo
                                    </Button>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>✓ Recommended: 200x200px or larger</p>
                                <p>✓ Formats: PNG, JPG (max 2MB)</p>
                                <p>✓ Transparent background preferred for best results</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        KYC/AML Verification
                    </CardTitle>
                    <CardDescription>Your business verification status and uploaded compliance documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className={`p-4 border rounded-lg flex items-center justify-between ${
                        profile?.kycStatus === 'verified' ? 'bg-green-500/10 border-green-500/20' : 
                        profile?.kycStatus === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20' : 
                        'bg-red-500/10 border-red-500/20'
                    }`}>
                        <div className="flex items-center gap-3">
                            {profile?.kycStatus === 'verified' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                             profile?.kycStatus === 'pending' ? <Clock className="h-5 w-5 text-yellow-600" /> :
                             <XCircle className="h-5 w-5 text-red-600" />}
                            <div>
                                <p className="font-semibold text-base">Verification Status</p>
                                <p className="text-sm text-muted-foreground">
                                    {profile?.kycStatus === 'verified' ? 'Your business is fully verified and compliant' :
                                     profile?.kycStatus === 'pending' ? 'Your documents are being reviewed by our compliance team' :
                                     'Please resubmit your verification documents'}
                                </p>
                            </div>
                        </div>
                        {getKycStatusBadge(profile?.kycStatus)}
                    </div>
                     <div className="space-y-3">
                        <h4 className="font-semibold text-base">Uploaded Documents</h4>
                        {kycDocuments.length > 0 ? (
                            <div className="space-y-2">
                                {kycDocuments.map((doc, index) => (
                                     <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{documentTypeMap[doc.type] || doc.type}</p>
                                                <p className="text-xs text-muted-foreground">{doc.name || 'Document'}</p>
                                                {doc.uploadedAt && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                          <Button variant="outline" size="sm" className="gap-2">
                                            <ExternalLink className="h-3 w-3" />
                                            View
                                          </Button>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed rounded-lg text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="font-medium text-sm mb-1">No documents uploaded</p>
                                <p className="text-xs text-muted-foreground">Upload your business documents to begin verification</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
