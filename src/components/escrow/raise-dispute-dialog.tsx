'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { escrowApi } from '@/lib/api/escrow';
import { AlertCircle } from 'lucide-react';

const disputeSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  description: z.string().min(20, 'Please provide detailed description (min 20 characters)'),
  evidenceUrls: z.array(z.string()).optional(),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

interface RaiseDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escrowId: string;
  userRole: 'BUYER' | 'SELLER';
  onSuccess?: () => void;
}

export function RaiseDisputeDialog({
  open,
  onOpenChange,
  escrowId,
  userRole,
  onSuccess,
}: RaiseDisputeDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeSchema),
  });

  const onSubmit = async (data: DisputeFormValues) => {
    setIsSubmitting(true);
    try {
      await escrowApi.raiseDispute(escrowId, {
        reason: data.reason,
        description: data.description,
        evidenceUrls: data.evidenceUrls,
        role: userRole,
      });

      toast({
        title: 'Dispute Raised',
        description: 'Your dispute has been submitted and will be reviewed by a mediator.',
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to raise dispute',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Raise a Dispute
          </DialogTitle>
          <DialogDescription>
            Submit a formal dispute for this escrow agreement. A mediator will review your claim.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Dispute Reason</Label>
            <Input
              id="reason"
              placeholder="e.g., Deliverable not as agreed"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed explanation of the issue..."
              rows={5}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Note:</strong> Raising a dispute will pause the escrow process. Both parties
              will have an opportunity to present evidence before a resolution is made.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
