
'use client';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const disputeFormSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID or Agreement ID is required'),
  reason: z.string().min(1, 'Please select a reason for the dispute'),
  explanation: z.string().min(20, 'Please provide a detailed explanation (at least 20 characters)'),
  evidence: z.any().optional(),
});

type DisputeFormValues = z.infer<typeof disputeFormSchema>;

interface RaiseDisputeFormProps {
  onBack: () => void;
}

export function RaiseDisputeForm({ onBack }: RaiseDisputeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeFormSchema),
  });

  const onSubmit: SubmitHandler<DisputeFormValues> = async (data) => {
    setIsSubmitting(true);
    console.log(data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: 'Dispute Case Opened',
      description: 'Your dispute has been submitted and is now under review.',
    });
    setIsSubmitting(false);
    onBack();
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Raise a New Dispute</h1>
          <p className="text-muted-foreground text-sm">Provide details about the transaction you want to dispute.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction or Agreement ID</Label>
                <Input
                  id="transactionId"
                  {...register('transactionId')}
                  placeholder="e.g., txn_01 or ESC-84321"
                />
                {errors.transactionId && <p className="text-sm text-destructive">{errors.transactionId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Dispute</Label>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fraudulent">Fraudulent Transaction</SelectItem>
                        <SelectItem value="not_received">Product/Service Not Received</SelectItem>
                        <SelectItem value="not_as_described">Product/Service Not as Described</SelectItem>
                        <SelectItem value="duplicate">Duplicate Transaction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Detailed Explanation</Label>
              <Textarea
                id="explanation"
                {...register('explanation')}
                placeholder="Please describe the issue in detail. The more information you provide, the faster we can resolve your case."
                rows={6}
              />
              {errors.explanation && <p className="text-sm text-destructive">{errors.explanation.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Upload Evidence (Optional)</Label>
                <div className="p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Drag and drop files here or click to upload.</p>
                    <p className="text-xs text-muted-foreground mt-1">Screenshots, receipts, conversation logs, etc.</p>
                    <Button variant="outline" className="mt-4" type="button">
                        Select Files
                    </Button>
                </div>
            </div>

          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : <><ShieldQuestion className="mr-2 h-4 w-4" /> Submit Dispute</>}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
