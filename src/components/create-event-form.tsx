
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
import { ArrowLeft, CalendarIcon, Plus, Trash2, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';


const ticketTierSchema = z.object({
  name: z.string().min(1, 'Tier name is required'),
  price: z.preprocess((val) => Number(String(val)), z.number().min(0, 'Price must be 0 or more')),
  quantity: z.preprocess((val) => Number(String(val)), z.number().positive('Quantity must be > 0')),
});

const eventSchema = z.object({
  eventName: z.string().min(3, 'Event name is required'),
  eventDate: z.date({ required_error: 'Event date is required' }),
  location: z.string().min(3, 'Location is required'),
  currency: z.string().min(1, 'Currency is required'),
  tickets: z.array(ticketTierSchema).min(1, 'At least one ticket tier is required'),
  bannerFile: z.any().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
    onBack: () => void;
    eventId?: string | null;
}

export function CreateEventForm({ onBack, eventId }: CreateEventFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const isEditing = !!eventId;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventName: '',
      location: '',
      currency: 'USD',
      tickets: [{ name: 'General Admission', price: 0, quantity: 100 }],
    },
  });

  useEffect(() => {
    if (isEditing && eventId) {
        const fetchEvent = async () => {
            const docRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                reset({
                    ...data,
                    eventDate: data.eventDate ? data.eventDate.toDate() : new Date(),
                });
                if (data.bannerImage) {
                    setBannerPreview(data.bannerImage);
                }
            }
        };
        fetchEvent();
    }
  }, [isEditing, eventId, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tickets',
  });

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setBannerPreview(URL.createObjectURL(file));
      setValue('bannerFile', e.target.files);
    }
  };

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to create an event.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const { bannerFile, ...restOfData } = data;
        let bannerURL = bannerPreview;

        const fileToUpload = bannerFile?.[0];
        if (fileToUpload) {
            const storagePath = `event_banners/${user.uid}/${eventId || Date.now()}/${fileToUpload.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, fileToUpload);
            bannerURL = await getDownloadURL(storageRef);
        }

        const eventData = {
            ...restOfData,
            userId: user.uid,
            bannerImage: bannerURL,
            updatedAt: serverTimestamp(),
        };

        if (isEditing && eventId) {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, eventData);
        } else {
            const eventCollectionRef = collection(db, "events");
            const newDocRef = await addDoc(eventCollectionRef, {
                ...eventData,
                createdAt: serverTimestamp(),
            });
            const publicLink = `${window.location.origin}/event/${newDocRef.id}`;
            await updateDoc(newDocRef, { publicLink });
        }
        
        toast({
            title: isEditing ? "Event Updated!" : "Event Page Created!",
            description: `Your event page for "${data.eventName}" is live.`,
        });
        onBack();

    } catch (error) {
        console.error("Error saving event:", error);
        toast({ title: "Error", description: "Could not save your event. Please try again.", variant: "destructive" });
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
                    <CardTitle>{isEditing ? 'Edit Event' : 'Create a New Event'}</CardTitle>
                    <CardDescription>{isEditing ? 'Update the details for your event.' : 'Create a public page to sell tickets.'}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Event Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Event Details</h3>
             <Label htmlFor="banner-upload" className="block cursor-pointer">
                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg text-center aspect-video flex flex-col justify-center items-center hover:bg-muted/50 transition-colors">
                    {bannerPreview ? (
                        <Image src={bannerPreview} alt="Event banner preview" layout="fill" objectFit="cover" className="rounded-md" />
                    ) : (
                        <div className="p-8">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">Drag and drop an event banner or click to upload.</p>
                        </div>
                    )}
                </div>
            </Label>
            <Input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={handleBannerFileChange} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input id="eventName" {...register('eventName')} placeholder="e.g., Summer Music Festival" />
                    {errors.eventName && <p className="text-sm text-destructive">{errors.eventName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label>Event Date</Label>
                    <Controller
                        name="eventDate"
                        control={control}
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} placeholder="e.g., Central Park, New York" />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          <Separator />
          
          {/* Ticket Tiers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Ticket Tiers</h3>
                    <p className="text-sm text-muted-foreground">Create different types of tickets for your event.</p>
                </div>
                 <div className="w-40">
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
            
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label>Tier Name</Label>
                    <Input placeholder="e.g., General Admission" {...register(`tickets.${index}.name`)} />
                    {errors.tickets?.[index]?.name && <p className="text-sm text-destructive">{errors.tickets[index]?.name?.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input type="number" placeholder="25.00" {...register(`tickets.${index}.price`)} />
                     {errors.tickets?.[index]?.price && <p className="text-sm text-destructive">{errors.tickets[index]?.price?.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label>Quantity Available</Label>
                    <Input type="number" placeholder="100" {...register(`tickets.${index}.quantity`)} />
                     {errors.tickets?.[index]?.quantity && <p className="text-sm text-destructive">{errors.tickets[index]?.quantity?.message}</p>}
                  </div>
                </div>
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ name: 'VIP', price: 50, quantity: 20 })}>
              <Plus className="mr-2 h-4 w-4" /> Add Ticket Tier
            </Button>
             {errors.tickets && typeof errors.tickets === 'object' && 'message' in errors.tickets && <p className="text-sm text-destructive">{errors.tickets.message}</p>}
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> {isEditing ? 'Updating...' : 'Creating...'}</> : <><LinkIcon className="mr-2 h-4 w-4" />{isEditing ? 'Update Event' : 'Create Event & Get Link'}</>}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
