
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building, UploadCloud, FileUp, Loader2, Save } from 'lucide-react';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { BusinessProfile } from '@/types/business-settings';


const profileSchema = z.object({
    legalName: z.string().min(2, 'Legal name is required'),
    industry: z.string().min(1, 'Industry is required'),
    businessType: z.string().min(1, 'Business type is required'),
    registrationNumber: z.string().optional(),
    taxId: z.string().optional(),
    businessAddress: z.string().min(5, 'Address is required'),
    website: z.string().url('Must be a valid URL').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const mockProfile: BusinessProfile = {
    legalName: 'Qwibik Inc.',
    industry: 'Financial Technology',
    businessType: 'Corporation',
    registrationNumber: 'RC123456',
    taxId: 'TIN987654',
    businessAddress: '123 Finance Street, Moneyville, USA',
    website: 'https://qwibik.remit',
    logoUrl: 'https://placehold.co/100x100.png',
    kycStatus: 'Verified'
};

export function BusinessProfileSettings() {
    const { toast } = useToast();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            ...mockProfile,
        }
    });

    const onSubmit = async (data: ProfileFormValues) => {
        console.log(data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: 'Profile Updated',
            description: 'Your business profile has been successfully saved.',
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Business Profile</CardTitle>
                    <CardDescription>Manage your legal business name, address, and other identifying information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="legalName">Legal Business Name</Label><Input id="legalName" {...register('legalName')} />{errors.legalName && <p className="text-sm text-destructive">{errors.legalName.message}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="industry">Industry</Label><Input id="industry" {...register('industry')} />{errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}</div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label htmlFor="businessType">Business Type</Label><Controller name="businessType" control={control} render={({field}) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Corporation">Corporation</SelectItem><SelectItem value="LLC">LLC</SelectItem><SelectItem value="Non-Profit">Non-Profit</SelectItem></SelectContent></Select>)}/>{errors.businessType && <p className="text-sm text-destructive">{errors.businessType.message}</p>}</div>
                        <div className="space-y-2"><Label htmlFor="registrationNumber">Registration Number</Label><Input id="registrationNumber" {...register('registrationNumber')} /></div>
                        <div className="space-y-2"><Label htmlFor="taxId">Tax ID</Label><Input id="taxId" {...register('taxId')} /></div>
                    </div>
                     <div className="space-y-2"><Label htmlFor="businessAddress">Business Address</Label><Input id="businessAddress" {...register('businessAddress')} />{errors.businessAddress && <p className="text-sm text-destructive">{errors.businessAddress.message}</p>}</div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Brand Identity</CardTitle>
                    <CardDescription>Manage your logo and other branding elements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-6 p-4 border rounded-lg">
                        <Avatar className="h-20 w-20"><AvatarImage src={mockProfile.logoUrl} /><AvatarFallback>QI</AvatarFallback></Avatar>
                        <div className="flex-1">
                            <h4 className="font-semibold">Business Logo</h4>
                            <p className="text-sm text-muted-foreground">Upload a logo to personalize your invoices and payment pages. Recommended size: 200x200px.</p>
                        </div>
                        <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/>Upload New Logo</Button>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>KYC/AML Verification</CardTitle>
                    <CardDescription>Manage required documents for business verification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-green-500/10 border-green-500/20 text-green-700">
                        <p className="font-semibold">Your business is currently verified.</p>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-medium">Uploaded Documents</h4>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div><p className="font-semibold">Certificate of Incorporation</p><p className="text-xs text-muted-foreground">Uploaded on 2024-08-10</p></div><Button variant="outline" size="sm">View</Button></div>
                        <div className="flex items-center justify-between p-4 border rounded-lg"><div><p className="font-semibold">Proof of Address</p><p className="text-xs text-muted-foreground">Uploaded on 2024-08-10</p></div><Button variant="outline" size="sm">View</Button></div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="secondary"><FileUp className="mr-2 h-4 w-4"/>Upload New Document</Button>
                </CardFooter>
            </Card>

        </form>
    );
}
