'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supportService } from '@/services/supportService';

export default function DangerSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = confirmText.trim().toUpperCase() === 'DELETE';

  const submitDeletionRequest = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await supportService.createTicket({
        subject: 'Account deletion request',
        description:
          'User requested account deletion from Settings > Danger. Please follow internal account deletion process.',
        category: 'account_deletion',
        priority: 'MEDIUM',
        customerId: user.uid,
        tags: ['account_deletion'],
        metadata: {
          uid: user.uid,
          email: user.email || null,
          requestedAt: new Date().toISOString(),
          source: 'dashboard_settings_danger',
        },
      });

      toast({
        title: 'Request submitted',
        description: 'A support ticket has been created. Our team will follow up by email.',
      });

      setDialogOpen(false);
      router.push('/dashboard/support?tab=my-tickets');
    } catch (err: any) {
      console.error('Account deletion ticket creation failed:', err);
      toast({
        title: 'Request failed',
        description: err?.message || 'Could not submit the request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Danger</h2>
        <p className="text-sm text-muted-foreground">High-impact actions for your account.</p>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Request Account Deletion
          </CardTitle>
          <CardDescription>
            This creates a support ticket. Your account is not deleted automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
            Deletion requests are reviewed by support. If you have compliance or KYC-related concerns, include them in the ticket once it is created.
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={!user || submitting}
            />
          </div>

          <Button
            variant="destructive"
            className="w-full justify-start"
            disabled={!user || submitting || !canSubmit}
            onClick={() => setDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Request account deletion
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit deletion request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a support ticket and our team will contact you. It does not immediately delete your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitDeletionRequest} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

