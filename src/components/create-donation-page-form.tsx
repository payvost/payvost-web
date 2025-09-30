
'use client';

import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Gift, Plus, Trash2, Upload, Link as LinkIcon, Image as ImageIcon, Video, Youtube, Loader2, CalendarIcon, FileUp, Check, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import Image from 'next/image';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { RichTextEditor } from './rich-text-editor';


const campaignSchema = z.object({
  title: z.string().min(3, 'Campaign title is required').max(120, 'Title must be 120 characters or less'),
  category: z.string().min(1, "Please select a category."),
  tags: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  mediaType: z.enum(['image', 'video', 'embed']).default('image'),
  bannerFile: z.any().optional(),
  bannerUrl: z.string().optional(),
  galleryFiles: z.any().optional(),
  goal: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().positive('Goal must be a positive number').optional()),
  currency: z.string().min(1, 'Currency is required'),
  suggestedAmounts: z.string().optional(),
  allowCustomAmount: z.boolean(),
  enableRecurring: z.boolean(),
  recurringFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  endDate: z.date().optional(),
  visibility: z.enum(['public', 'private']),
  supportingDocs: z.any().optional(),
  impactItems: z.array(z.object({ description: z.string() })).optional(),
}).refine(data => data.enableRecurring ? !!data.recurringFrequency : true, {
    message: "Please select a frequency for recurring donations.",
    path: ["recurringFrequency"],
});

type FormValues = z.infer<typeof campaignSchema>;

interface CreateDonationPageFormProps {
    onBack: () => void;
    campaignId?: string | null;
}

const steps = [
    { id: 1, name: 'Campaign Basics', fields: ['title', 'category', 'tags', 'description'] },
    { id: 2, name: 'Media', fields: ['mediaType', 'bannerFile', 'bannerUrl', 'galleryFiles'] },
    { id: 3, name: 'Donations', fields: ['goal', 'currency', 'suggestedAmounts', 'allowCustomAmount', 'enableRecurring', 'recurringFrequency'] },
    { id: 4, name: 'Transparency', fields: ['supportingDocs', 'impactItems'] },
    { id: 5, name: 'Publish', fields: ['endDate', 'visibility'] },
];

export function CreateDonationPageForm({ onBack, campaignId }: CreateDonationPageFormProps) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const isEditing = !!campaignId;

    const { register, control, handleSubmit, trigger, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            currency: 'USD',
            allowCustomAmount: true,
            enableRecurring: false,
            visibility: 'public',
        },
    });

     useEffect(() => {
        if (isEditing && campaignId) {
            const fetchCampaign = async () => {
                const docRef = doc(db, 'donations', campaignId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    reset({
                        ...data,
                        tags: data.tags?.join(', '),
                        suggestedAmounts: data.suggestedAmounts?.join(', '),
                        endDate: data.endDate ? data.endDate.toDate() : undefined,
                    });
                    if (data.bannerImage) {
                        setBannerPreview(data.bannerImage);
                    }
                    if (data.gallery) {
                        setGalleryPreviews(data.gallery);
                    }
                }
            };
            fetchCampaign();
        }
    }, [isEditing, campaignId, reset]);

    const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid File Type", description: "Please upload a valid image file.", variant: "destructive" });
                return;
            }
            setBannerPreview(URL.createObjectURL(file));
            setValue('bannerFile', e.target.files);
        }
    };
    
    const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const currentFilesCount = galleryPreviews.length + files.length;
        if (currentFilesCount > 5) {
            toast({ title: "Limit Exceeded", description: "You can upload a maximum of 5 gallery images.", variant: "destructive" });
            return;
        }

        const newPreviews: string[] = [];
        const validFiles: File[] = [];

        Array.from(files).forEach(file => {
             if (file.size > 5 * 1024 * 1024) {
                toast({ title: `File too large: ${file.name}`, variant: "destructive" });
                return;
            }
             if (!file.type.startsWith('image/')) {
                toast({ title: `Invalid file type: ${file.name}`, variant: "destructive" });
                return;
            }
            newPreviews.push(URL.createObjectURL(file));
            validFiles.push(file);
        });

        setGalleryPreviews(prev => [...prev, ...newPreviews]);
        const existingFiles = watch('galleryFiles') || [];
        setValue('galleryFiles', [...existingFiles, ...validFiles]);
    };
    
    const removeGalleryImage = (index: number) => {
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        const existingFiles = watch('galleryFiles') || [];
        setValue('galleryFiles', existingFiles.filter((_: any, i: number) => i !== index));
    };

    
     const handleNext = async () => {
        const fields = steps[currentStep].fields;
        const output = await trigger(fields as (keyof FormValues)[], { shouldFocus: true });
        if (!output) return;
        if (currentStep < steps.length - 1) {
            setCurrentStep(step => step + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(step => step - 1);
        }
    };
    
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            let bannerURL = isEditing ? bannerPreview : ''; // Keep existing URL if not changed
            const bannerFile = data.bannerFile?.[0];

            if (bannerFile) {
                const bannerRef = ref(storage, `donation_media/${user.uid}/${Date.now()}_${bannerFile.name}`);
                await uploadBytes(bannerRef, bannerFile);
                bannerURL = await getDownloadURL(bannerRef);
            }
            
            const galleryFiles = data.galleryFiles || [];
            const galleryURLs = await Promise.all(
                galleryFiles.map(async (file: File) => {
                     const galleryRef = ref(storage, `donation_media/${user.uid}/${Date.now()}_${file.name}`);
                     await uploadBytes(galleryRef, file);
                     return getDownloadURL(galleryRef);
                })
            );


            const campaignData = {
                userId: user.uid,
                title: data.title,
                category: data.category,
                tags: data.tags?.split(',').map(t => t.trim()) || [],
                description: data.description,
                mediaType: data.mediaType,
                bannerImage: bannerURL,
                gallery: galleryURLs,
                goal: data.goal || 0,
                currency: data.currency,
                raisedAmount: isEditing ? (await getDoc(doc(db, "donations", campaignId!))).data()?.raisedAmount || 0 : 0,
                suggestedAmounts: data.suggestedAmounts?.split(',').map(a => Number(a.trim())) || [],
                allowCustomAmount: data.allowCustomAmount,
                enableRecurring: data.enableRecurring,
                recurringFrequency: data.recurringFrequency,
                endDate: data.endDate || null,
                visibility: data.visibility,
                status: 'Active',
                updatedAt: serverTimestamp(),
            };

            if (isEditing && campaignId) {
                const docRef = doc(db, 'donations', campaignId);
                await updateDoc(docRef, campaignData);
                toast({ title: "Campaign Updated!", description: "Your changes have been saved." });
            } else {
                const docRef = await addDoc(collection(db, 'donations'), {
                    ...campaignData,
                    createdAt: serverTimestamp(),
                });
                const link = `${window.location.origin}/donate/${docRef.id}`;
                await updateDoc(docRef, { link });
                 toast({ title: "Campaign Created!", description: "Your new campaign is now live." });
            }
            onBack();

        } catch (error) {
            console.error("Error saving campaign: ", error);
            toast({ title: "Error", description: "Failed to save the campaign.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        {currentStep === 0 ? (
                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                                <ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span>
                             </Button>
                        ) : (
                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                                <ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span>
                             </Button>
                        )}
                        <div>
                            <CardTitle>{isEditing ? 'Edit Campaign' : 'Create a New Campaign'}</CardTitle>
                            <CardDescription>Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}</CardDescription>
                        </div>
                    </div>
                    <Progress value={progress} />
                </CardHeader>
                <CardContent className="space-y-8 min-h-[400px]">
                    {currentStep === 0 && (
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="title">Campaign Title</Label>
                                <Input id="title" {...register('title')} placeholder="e.g., Help Us Build a New Playground" />
                                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Controller name="category" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select a category..."/></SelectTrigger><SelectContent><SelectItem value="Education">Education</SelectItem><SelectItem value="Health">Health</SelectItem><SelectItem value="Community">Community</SelectItem><SelectItem value="Emergency">Emergency</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select>)} />
                                    {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                                    <Input id="tags" {...register('tags')} placeholder="e.g., education, kids, community" />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="description">Story / Description</Label>
                                <Controller
                                    name="description"
                                    control={control}
                                    render={({ field }) => (
                                        <RichTextEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Tell people about your cause..."
                                        />
                                    )}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                            </div>
                        </div>
                    )}
                    
                     {currentStep === 1 && (
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label>Campaign Banner</Label>
                                <Tabs defaultValue="image" className="w-full" onValueChange={(v) => setValue('mediaType', v as any)}>
                                    <TabsList><TabsTrigger value="image"><ImageIcon className="mr-2"/>Image</TabsTrigger><TabsTrigger value="video"><Video className="mr-2"/>Video Upload</TabsTrigger><TabsTrigger value="embed"><Youtube className="mr-2"/>Video Embed</TabsTrigger></TabsList>
                                     <TabsContent value="image">
                                        <Label htmlFor="banner-upload" className="mt-2 block cursor-pointer">
                                            <div className="relative border-2 border-dashed rounded-lg text-center aspect-[2.5/1] flex flex-col justify-center items-center hover:bg-muted/50 transition-colors">
                                                {bannerPreview ? (
                                                    <Image src={bannerPreview} alt="Banner preview" layout="fill" objectFit="cover" className="rounded-md" />
                                                ) : (
                                                    <div className="p-4">
                                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                        <p className="mt-2 text-sm text-muted-foreground">Click to upload banner image</p>
                                                    </div>
                                                )}
                                            </div>
                                        </Label>
                                        <Input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={handleBannerFileChange} />
                                    </TabsContent>
                                    <TabsContent value="video"><div className="p-4 mt-2 border-2 border-dashed rounded-lg text-center aspect-[2.5/1] flex flex-col justify-center items-center"><Upload className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Click to upload video (MP4, &lt;100MB)</p></div></TabsContent>
                                    <TabsContent value="embed"><div className="space-y-2 mt-2"><Label htmlFor="bannerUrl">YouTube or Vimeo URL</Label><Input id="bannerUrl" {...register('bannerUrl')} placeholder="https://www.youtube.com/watch?v=..." /></div></TabsContent>
                                </Tabs>
                            </div>
                            <div className="space-y-2">
                                <Label>Image Gallery ({galleryPreviews.length}/5)</Label>
                                <input
                                    ref={galleryInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleGalleryFileChange}
                                />
                                <div className="p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50" onClick={() => galleryInputRef.current?.click()}>
                                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">Click to upload gallery images (up to 5)</p>
                                </div>
                                {galleryPreviews.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                                        {galleryPreviews.map((src, index) => (
                                            <div key={index} className="relative group aspect-square">
                                                <Image src={src} alt={`Gallery preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md"/>
                                                <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeGalleryImage(index)}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                     {currentStep === 2 && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between rounded-lg border p-4">
                                <Label>Fundraising Goal</Label>
                                <Switch />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2"><Label htmlFor="goal">Goal Amount</Label><Input id="goal" type="number" {...register('goal')} placeholder="5000" /></div>
                               <div className="space-y-2"><Label>Currency</Label><Controller name="currency" control={control} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="NGN">NGN</SelectItem></SelectContent></Select>)} /></div>
                           </div>
                           <div className="space-y-2"><Label>Suggested Amounts</Label><Input {...register('suggestedAmounts')} placeholder="e.g., 10, 25, 50, 100" /></div>
                           <div className="flex items-center space-x-2"><Controller name="allowCustomAmount" control={control} render={({field}) => (<Switch id="allowCustomAmount" checked={field.value} onCheckedChange={field.onChange}/>)} /><Label htmlFor="allowCustomAmount">Allow custom donation amounts</Label></div>
                           <div className="flex items-center space-x-2"><Controller name="enableRecurring" control={control} render={({field}) => (<Switch id="enableRecurring" checked={field.value} onCheckedChange={field.onChange}/>)} /><Label htmlFor="enableRecurring">Enable recurring donations</Label></div>
                           {watch('enableRecurring') && <div className="space-y-2"><Label>Recurring Frequency</Label><Controller name="recurringFrequency" control={control} render={({field}) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select frequency..." /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select>)}/>{errors.recurringFrequency && <p className="text-sm text-destructive">{errors.recurringFrequency.message}</p>}</div>}
                        </div>
                    )}
                     {currentStep === 3 && (
                        <div className="space-y-4">
                           <div className="p-4 border rounded-lg bg-green-500/10 text-green-700 flex items-center gap-2"><Check className="h-5 w-5"/>Your account is KYC verified.</div>
                           <div className="space-y-2"><Label>Supporting Documents</Label><div className="p-4 border-2 border-dashed rounded-lg text-center"><FileUp className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Upload receipts, bills, etc. (PDF, Word)</p></div></div>
                           <div className="space-y-2"><Label>Impact Breakdown</Label><div className="flex items-center gap-2"><Input placeholder="e.g., $25 feeds a child for a week" /><Button variant="outline" size="icon"><Plus className="h-4 w-4"/></Button></div></div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-4">
                           <div className="space-y-2">
                                <Label>Campaign End Date (Optional)</Label>
                                <Controller name="endDate" control={control} render={({ field }) => (<Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP') : <span>No end date</span>}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>)} />
                           </div>
                           <div className="space-y-2">
                                <Label>Visibility</Label>
                                <Controller name="visibility" control={control} render={({field}) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public (Visible on your profile)</SelectItem><SelectItem value="private">Private (Only with a direct link)</SelectItem></SelectContent></Select>)}/>
                           </div>
                           <Button variant="secondary" className="w-full">Preview Campaign</Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-between">
                     <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    {currentStep < steps.length - 1 ? (
                        <Button type="button" onClick={handleNext}>Next</Button>
                    ) : (
                         <div className="flex gap-2">
                            <Button type="button" variant="outline">Save as Draft</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{isEditing ? 'Update Campaign' : 'Publish Now'}</Button>
                         </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}
