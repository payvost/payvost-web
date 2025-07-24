
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
import { ArrowLeft, CalendarIcon, Plus, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Separator } from './ui/separator';

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
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
    onBack: () => void;
}

export function CreateEventForm({ onBack }: CreateEventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tickets',
  });

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    setIsSubmitting(true);
    console.log(data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Event Page Created!",
      description: `Your ticket sales page for ${data.eventName} is now live.`,
    });
    setIsSubmitting(false);
    onBack();
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
                    <CardTitle>Create a New Event</CardTitle>
                    <CardDescription>Create a public page to sell tickets for your next event.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Event Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Event Details</h3>
            <div className="p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Drag and drop an event banner or click to upload.</p>
              <Button variant="outline" className="mt-4" type="button">
                Upload Image
              </Button>
            </div>
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
            <LinkIcon className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating Event...' : 'Create Event & Get Sales Link'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
