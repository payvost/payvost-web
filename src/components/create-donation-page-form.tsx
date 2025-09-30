
'use client';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Gift, Plus, Trash2, Upload, Link as LinkIcon, Image as ImageIcon, Video, Youtube, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import Image from 'next/image';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];

const campaignSchema = z.object({
  title: z.string().min(3, 'Campaign title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  mediaType: z.enum(['image', 'video', 'embed']).default('image'),
  bannerFile: z.any().optional(),
  bannerUrl: z.string().optional(),
  galleryFiles: z.any().optional(),
  goal: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().positive('Goal must be a positive number').optional()),
  currency: z.string().min(1, 'Currency is required'),
  suggestedAmounts: z.string().optional(),
  allowCustomAmount: z.boolean(),
}).superRefine((data, ctx) => {
    // Validation logic for banner file based on media type
    if (data.mediaType === 'image' && data.bannerFile && data.bannerFile.length > 0) {
        if (data.bannerFile[0].size > MAX_FILE_SIZE) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Max image size is 5MB.`, path: ['bannerFile'] });
        if (!ACCEPTED_IMAGE_TYPES.includes(data.bannerFile[0].type)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only .jpg, .jpeg, .png and .webp formats are supported.', path: ['bannerFile'] });
    }
    if (data.mediaType === 'video' && data.bannerFile && data.bannerFile.length > 0) {
        if (data.bannerFile[0].size > MAX_VIDEO_SIZE) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Max video size is 50MB.`, path: ['bannerFile'] });
        if (!ACCEPTED_VIDEO_TYPES.includes(data.bannerFile[0].type)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only .mp4 and .webm formats are supported.', path: ['bannerFile'] });
    }
    if (data.mediaType === 'embed') {
        if (!data.bannerUrl || !z.string().url().safeParse(data.bannerUrl).success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A valid YouTube or Vimeo URL is required.', path: ['bannerUrl'] });
        }
    }
    if (data.galleryFiles && data.galleryFiles.length > 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'You can upload a maximum of 5 gallery images.', path: ['galleryFiles'] });
    }
});


type FormValues = z.infer<typeof campaignSchema>;

interface CreateDonationPageFormProps {
    onBack: () => void;
    campaignId?: string | null;
}

export function CreateDonationPageForm({ onBack, campaignId }: CreateDonationPageFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const { user } = useAuth();
  const isEditing = !!campaignId;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
        title: '',
        description: '',
        currency: 'USD',
        suggestedAmounts: '10, 25, 50, 100',
        allowCustomAmount: true,
        mediaType: 'image',
    },
  });

  useEffect(() => {
    if (isEditing) {
        const fetchCampaign = async () => {
            const docRef = doc(db, "donations", campaignId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                reset({
                    ...data,
                    suggestedAmounts: data.suggestedAmounts?.join(', ') || '',
                });
                setBannerPreview(data.bannerImage);
                setGalleryPreviews(data.galleryUrls || []);
            }
        }
        fetchCampaign();
    }
  }, [campaignId, isEditing, reset]);


  const mediaType = watch('mediaType');

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
      setValue('bannerFile', e.target.files, { shouldValidate: true });
    }
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        if (files.length > 5) {
            toast({ title: "Too many files", description: "You can only select up to 5 images.", variant: "destructive" });
            return;
        }
        const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
        setGalleryPreviews(newPreviews);
        setValue('galleryFiles', files, { shouldValidate: true });
    }
  }
  
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to create or edit a campaign.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    try {
        let bannerImage = data.bannerUrl || bannerPreview || '';

        if (data.bannerFile && data.bannerFile.length > 0) {
            const file = data.bannerFile[0];
            const storageRef = ref(storage, `donation_media/${user.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            bannerImage = await getDownloadURL(snapshot.ref);
        }

        const galleryUrls = [...galleryPreviews];
        if (data.galleryFiles) {
            for (const file of Array.from(data.galleryFiles as FileList)) {
                const storageRef = ref(storage, `donation_media/${user.uid}/gallery/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                galleryUrls.push(await getDownloadURL(snapshot.ref));
            }
        }
        
        const campaignData = {
            title: data.title,
            description: data.description,
            mediaType: data.mediaType,
            bannerImage,
            galleryUrls,
            goal: data.goal || 0,
            currency: data.currency,
            suggestedAmounts: data.suggestedAmounts?.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)) || [],
            allowCustomAmount: data.allowCustomAmount,
            userId: user.uid,
            updatedAt: serverTimestamp(),
        };

        if (isEditing) {
            const docRef = doc(db, "donations", campaignId);
            await updateDoc(docRef, campaignData);
            toast({ title: "Campaign Updated!", description: `Your campaign "${data.title}" has been saved.` });
        } else {
             const docRef = await addDoc(collection(db, "donations"), {
                ...campaignData,
                createdAt: serverTimestamp(),
                raisedAmount: 0,
                status: 'Active',
            });
            const link = `${window.location.origin}/donate/${docRef.id}`;
            await updateDoc(docRef, { link });

            toast({ title: "Campaign Created!", description: `Your campaign "${data.title}" is now live.` });
        }
        
        onBack();

    } catch (error) {
        console.error("Error saving campaign:", error);
        toast({
            title: "Something went wrong",
            description: "Could not save the campaign. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
           <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <CardTitle>{isEditing ? 'Edit Campaign' : 'Create a New Campaign'}</CardTitle>
                    <CardDescription>
                        {isEditing ? 'Update the details of your fundraising campaign.' : 'Set up a public page to collect donations for your cause.'}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Campaign Details</h3>
                 <Tabs defaultValue="image" onValueChange={(value) => setValue('mediaType', value as 'image' | 'video' | 'embed')}>
                    <TabsList>
                        <TabsTrigger value="image"><ImageIcon className="mr-2 h-4 w-4"/>Image</TabsTrigger>
                        <TabsTrigger value="video"><Video className="mr-2 h-4 w-4"/>Video Upload</TabsTrigger>
                        <TabsTrigger value="embed"><Youtube className="mr-2 h-4 w-4"/>Video Embed</TabsTrigger>
                    </TabsList>
                    <TabsContent value="image">
                        <div className="p-4 mt-2 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center aspect-[2.5/1] flex flex-col justify-center items-center relative overflow-hidden">
                             <input type="file" id="banner-image-upload" className="hidden" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleBannerFileChange} />
                             <Label htmlFor="banner-image-upload" className="w-full h-full absolute inset-0 cursor-pointer">
                                {bannerPreview && mediaType === 'image' ? (
                                    <Image src={bannerPreview} alt="Campaign banner preview" fill sizes="500px" className="object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full"><ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">Click to upload a campaign banner</p></div>
                                )}
                             </Label>
                        </div>
                    </TabsContent>
                    <TabsContent value="video">
                        <div className="p-4 mt-2 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center aspect-[2.5/1] flex flex-col justify-center items-center relative overflow-hidden">
                            <input type="file" id="banner-video-upload" className="hidden" accept={ACCEPTED_VIDEO_TYPES.join(',')} onChange={handleBannerFileChange} />
                            <Label htmlFor="banner-video-upload" className="w-full h-full absolute inset-0 cursor-pointer">
                                {bannerPreview && mediaType === 'video' ? (
                                    <video src={bannerPreview} controls className="w-full h-full object-cover"></video>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full"><Video className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">Click to upload a video</p></div>
                                )}
                            </Label>
                        </div>
                    </TabsContent>
                    <TabsContent value="embed">
                         <div className="space-y-2 mt-2">
                            <Label htmlFor="bannerUrl">YouTube or Vimeo URL</Label>
                            <Input id="bannerUrl" {...register('bannerUrl')} placeholder="https://www.youtube.com/watch?v=..." />
                            {errors.bannerUrl && <p className="text-sm text-destructive">{errors.bannerUrl.message}</p>}
                        </div>
                    </TabsContent>
                </Tabs>
                {errors.bannerFile && <p className="text-sm text-destructive mt-2">{errors.bannerFile.message as string}</p>}

                <div className="space-y-2">
                    <Label htmlFor="title">Campaign Title</Label>
                    <Input id="title" {...register('title')} placeholder="e.g., Help Us Build a New Playground" />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description / Story</Label>
                    <Textarea id="description" {...register('description')} placeholder="Tell people about your cause..." rows={5} />
                    {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Image Gallery (Optional)</Label>
                    <div className="p-4 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
                        <input type="file" id="gallery-upload" multiple className="hidden" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleGalleryFilesChange} />
                        <Label htmlFor="gallery-upload" className="cursor-pointer">
                            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Upload up to 5 images</p>
                        </Label>
                    </div>
                     <div className="grid grid-cols-5 gap-2 mt-2">
                        {galleryPreviews.map((src, index) => (
                             <div key={index} className="relative aspect-square">
                                <Image src={src} alt={`Preview ${index+1}`} fill sizes="100px" className="object-cover rounded-md" />
                            </div>
                        ))}
                    </div>
                    {errors.galleryFiles && <p className="text-sm text-destructive mt-2">{errors.galleryFiles.message as string}</p>}
                </div>

            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Donation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="goal">Fundraising Goal (Optional)</Label>
                        <Input id="goal" type="number" {...register('goal')} placeholder="e.g., 5000" />
                        {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Controller
                            name="currency"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="suggestedAmounts">Suggested Donation Amounts</Label>
                    <Input id="suggestedAmounts" {...register('suggestedAmounts')} placeholder="e.g. 10, 25, 50, 100" />
                    <p className="text-xs text-muted-foreground">Enter comma-separated values.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Controller
                        name="allowCustomAmount"
                        control={control}
                        render={({ field }) => (
                            <Switch 
                                id="allowCustomAmount"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="allowCustomAmount">Allow donors to enter a custom amount</Label>
                </div>
            </div>
        </CardContent>
        <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Gift className="mr-2 h-4 w-4" />
                {isEditing ? 'Save Changes' : 'Create Campaign & Get Link'}
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
