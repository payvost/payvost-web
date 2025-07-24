
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Users, Percent, Baseline } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';


const participantSchema = z.object({
  name: z.string().min(1, 'Recipient is required'),
  splitType: z.enum(['fixed', 'percentage']),
  value: z.preprocess(
    (val) => Number(String(val)),
    z.number().positive('Value must be > 0')
  ),
});

const splitPaymentSchema = z.object({
  totalAmount: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().positive('Total amount must be a positive number')
  ),
  participants: z.array(participantSchema).min(1, 'At least one participant is required'),
});

type SplitPaymentFormValues = z.infer<typeof splitPaymentSchema>;

export function SplitPaymentTab() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SplitPaymentFormValues>({
    resolver: zodResolver(splitPaymentSchema),
    defaultValues: {
      participants: [],
      totalAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });
  
  const totalAmount = watch('totalAmount') || 0;
  const participants = watch('participants');

  const allocated = participants.reduce((acc, p) => {
    if (p.splitType === 'fixed') {
      return acc + (p.value || 0);
    }
    if (p.splitType === 'percentage') {
      return acc + (totalAmount * (p.value || 0)) / 100;
    }
    return acc;
  }, 0);

  const allocatedPercentage = totalAmount > 0 ? (allocated / totalAmount) * 100 : 0;
  const remaining = totalAmount - allocated;

  const onSubmit = (data: SplitPaymentFormValues) => {
    setIsSubmitting(true);
    console.log(data);
    
    if (allocated.toFixed(2) !== totalAmount.toFixed(2)) {
      toast({
        title: "Allocation Error",
        description: `Total allocated amount (${allocated.toFixed(2)}) does not match the total amount (${totalAmount.toFixed(2)}).`,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Split Payment Created",
      description: "The payment request has been successfully created.",
    });
    setIsSubmitting(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Create a Split Payment</CardTitle>
          <CardDescription>Divide a single payment among multiple recipients. You can split by fixed amounts or percentages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount to Split (USD)</Label>
            <Input id="total-amount" type="number" placeholder="Enter total amount" {...register('totalAmount')} />
            {errors.totalAmount && <p className="text-sm text-destructive">{errors.totalAmount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Allocation Progress</Label>
            <Progress value={allocatedPercentage} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Allocated: ${allocated.toFixed(2)} ({allocatedPercentage.toFixed(0)}%)</span>
              <span>Remaining: ${remaining.toFixed(2)}</span>
            </div>
          </div>
          
          <Separator />

          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
               <div className="flex justify-between items-start">
                    <h4 className="font-semibold">Participant {index + 1}</h4>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <Label>Recipient</Label>
                         <Input placeholder="Recipient Name or Email" {...register(`participants.${index}.name`)} />
                         {errors.participants?.[index]?.name && <p className="text-sm text-destructive">{errors.participants[index]?.name?.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Split Type</Label>
                        <Controller
                            control={control}
                            name={`participants.${index}.splitType`}
                            defaultValue="fixed"
                            render={({ field }) => (
                                <ToggleGroup type="single" value={field.value} onValueChange={field.onChange} className="w-full">
                                    <ToggleGroupItem value="fixed" className="w-full"><Baseline className="mr-2 h-4 w-4"/>Fixed</ToggleGroupItem>
                                    <ToggleGroupItem value="percentage" className="w-full"><Percent className="mr-2 h-4 w-4"/>Percentage</ToggleGroupItem>
                                </ToggleGroup>
                            )}
                        />
                    </div>
               </div>
               <div className="space-y-2">
                <Label>Value</Label>
                <Input type="number" placeholder="e.g., 50 or 25" {...register(`participants.${index}.value`)} />
                 {errors.participants?.[index]?.value && <p className="text-sm text-destructive">{errors.participants[index]?.value?.message}</p>}
               </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => append({ name: '', splitType: 'fixed', value: 0 })}>
            <Plus className="mr-2 h-4 w-4" /> Add Participant
          </Button>
          {errors.participants && typeof errors.participants === 'object' && 'message' in errors.participants && <p className="text-sm text-destructive">{errors.participants.message}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Users className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Creating Request...' : 'Create Split Payment Request'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
