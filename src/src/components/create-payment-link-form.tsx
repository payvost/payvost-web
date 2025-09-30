
'use client';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Link as LinkIcon, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const paymentLinkFormSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  amount: z.preprocess(
    (val) => (String(val) === '' ? undefined : Number(val)),
    z.number().positive('Amount must be a positive number').optional()
  ),
  expiryDate: z.date().optional(),
  successUrl: z.string().url('Must be a valid URL').optional(),
  failureUrl: z.string().url('Must be a valid URL').optional(),
});

type PaymentLinkFormValues = z.infer<typeof paymentLinkFormSchema>;

interface CreatePaymentLinkFormProps {
  onBack: () => void;
}

export function CreatePaymentLinkForm({ onBack }: CreatePaymentLinkFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentLinkFormValues>({
    resolver: zodResolver(paymentLinkFormSchema),
  });

  const onSubmit: SubmitHandler<PaymentLinkFormValues> = async (data) => {
    setIsSubmitting(true);
    console.log(data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Payment Link Created!',
      description: `The link "${data.title}" is now active.`,
    });
    setIsSubmitting(false);
    onBack();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Payment Link</h2>
          <p className="text-muted-foreground">Configure the details for your new payment link.</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Link Title</Label>
            <Input id="title" {...register('title')} placeholder="e.g., UX Design Course" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" {...register('description')} placeholder="A brief description of what the payment is for." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" type="number" {...register('amount')} placeholder="Leave blank for customer to decide" />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : <span>Never expires</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="successUrl">Success Redirect URL (Optional)</Label>
            <Input id="successUrl" {...register('successUrl')} placeholder="https://yourdomain.com/thank-you" />
            {errors.successUrl && <p className="text-sm text-destructive">{errors.successUrl.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="failureUrl">Failure Redirect URL (Optional)</Label>
            <Input id="failureUrl" {...register('failureUrl')} placeholder="https://yourdomain.com/payment-failed" />
            {errors.failureUrl && <p className="text-sm text-destructive">{errors.failureUrl.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : <><LinkIcon className="mr-2 h-4 w-4" />Create Link</>}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
