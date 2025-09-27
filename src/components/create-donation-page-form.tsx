
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
import { ArrowLeft, Gift, Plus, Trash2, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import Image from 'next/image';
import { storage, db, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const donationPageSchema = z.object({
  title: z.string().min(3, 'Campaign title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  goal: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().positive('Goal must be a positive number').optional()),
  currency: z.string().min(1, 'Currency is required'),
  suggestedAmounts: z.string().optional(),
  allowCustomAmount: z.boolean(),
  bannerImage: z.any()
    .refine((files) => files?.length === 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type DonationFormValues = z.infer<typeof donationPageSchema>;

interface CreateDonationPageFormProps {
    onBack: () => void;
}

export function CreateDonationPageForm({ onBack }: CreateDonationPageFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationPageSchema),
    defaultValues: {
        title: '',
        description: '',
        currency: 'USD',
        suggestedAmounts: '10, 25, 50, 100',
        allowCustomAmount: true,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Only JPG, PNG, and WebP formats are supported.", variant: "destructive" });
        return;
      }
      setPreviewImage(URL.createObjectURL(file));
      setValue('bannerImage', e.target.files);
    }
  };

  const onSubmit: SubmitHandler<DonationFormValues> = async (data) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to create a campaign.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    try {
        const imageFile = data.bannerImage[0];
        const storageRef = ref(storage, `donation_banners/${user.uid}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const donationData = {
            ...data,
            bannerImage: downloadURL,
            userId: user.uid,
            createdAt: serverTimestamp(),
            raisedAmount: 0,
            status: 'Active',
            suggestedAmounts: data.suggestedAmounts?.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)) || []
        };
        
        const docRef = await addDoc(collection(db, "donations"), donationData);

        toast({
            title: "Campaign Created!",
            description: `Your campaign "${data.title}" is now live.`,
        });
        onBack();

    } catch (error) {
        console.error("Error creating campaign:", error);
        toast({
            title: "Something went wrong",
            description: "Could not create the campaign. Please try again.",
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
                    <CardTitle>Create a New Campaign</CardTitle>
                    <CardDescription>Set up a public campaign to collect donations for your cause.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Campaign Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Campaign Details</h3>
             <div className="p-4 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center aspect-video flex flex-col justify-center items-center relative overflow-hidden">
                <input
                    type="file"
                    id="banner-upload"
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handleFileChange}
                />
                <Label htmlFor="banner-upload" className="w-full h-full absolute inset-0 cursor-pointer">
                    {previewImage ? (
                        <Image src={previewImage} alt="Campaign banner preview" layout="fill" objectFit="cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">Click to upload a campaign banner</p>
                        </div>
                    )}
                </Label>
            </div>
            {errors.bannerImage && <p className="text-sm text-destructive">{errors.bannerImage.message as string}</p>}

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
          </div>

          <Separator />
          
          {/* Settings Section */}
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
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Gift className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating Campaign...' : 'Create Campaign & Get Link'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
