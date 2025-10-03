
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
import { ArrowLeft, Upload, ShieldQuestion, Loader2, File, X, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;

const disputeFormSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID or Agreement ID is required'),
  reason: z.string().min(1, 'Please select a reason for the dispute'),
  explanation: z.string().min(20, 'Please provide a detailed explanation (at least 20 characters)'),
});

type DisputeFormValues = z.infer<typeof disputeFormSchema>;

interface RaiseDisputeFormProps {
  onBack: () => void;
}

export function RaiseDisputeForm({ onBack }: RaiseDisputeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeFormSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalFiles = evidenceFiles.length + newFiles.length;

    if (totalFiles > MAX_FILES) {
      toast({ title: "Too many files", description: `You can only upload a maximum of ${MAX_FILES} files.`, variant: "destructive" });
      return;
    }

    const totalSize = [...evidenceFiles, ...newFiles].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
        toast({ title: "Total size exceeded", description: `Total file size cannot exceed 50MB.`, variant: "destructive" });
        return;
    }

    const invalidFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
        toast({ title: "File too large", description: `${invalidFiles[0].name} exceeds the 5MB limit.`, variant: "destructive" });
        return;
    }

    setEvidenceFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (indexToRemove: number) => {
    setEvidenceFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const onSubmit: SubmitHandler<DisputeFormValues> = async (data) => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to raise a dispute.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    
    let disputeDataPayload: any; // Define payload here

    try {
        const txId = data.transactionId;
        
        let transactionData: any = null;
        let found = false;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
             const userTransactions = userDocSnap.data().transactions || [];
             const foundTx = userTransactions.find((tx: any) => tx.id === txId);
             if (foundTx) {
                 transactionData = foundTx;
                 found = true;
             }
        }

        if (!found) {
            // Check escrows collection at root
            const escrowRef = doc(db, 'escrow', txId);
            const escrowSnap = await getDoc(escrowRef);
            if (escrowSnap.exists()) {
                transactionData = escrowSnap.data();
                found = true;
            }
        }
        
        if (!found) {
            toast({
                title: "Invalid ID",
                description: "The transaction or agreement ID you entered does not exist in your records.",
                variant: "destructive"
            });
            setIsSubmitting(false);
            return;
        }
        
        const evidenceUrls = [];
        for (const file of evidenceFiles) {
            const storageRef = ref(storage, `disputes/${user.uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            evidenceUrls.push({ name: file.name, url: url, uploadedBy: user.displayName || 'Customer', date: new Date().toISOString() });
        }
        
        disputeDataPayload = {
            ...data,
            caseId: `case_${Date.now()}`,
            userId: user.uid,
            customerName: user.displayName || 'N/A',
            amount: transactionData?.numericAmount || transactionData?.amount || 0,
            currency: transactionData?.currency || 'USD',
            status: 'Needs response',
            createdAt: serverTimestamp(),
            dueBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            evidence: evidenceUrls,
        };

        const disputesCollectionRef = collection(db, "disputes");
        await addDoc(disputesCollectionRef, disputeDataPayload);

        toast({
            title: 'Dispute Case Opened',
            description: 'Your dispute has been submitted and is now under review.',
        });
        
        onBack();

    } catch (error) {
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: 'disputes',
                operation: 'create',
                requestResourceData: disputeDataPayload,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            console.error("Error submitting dispute:", error);
            toast({
                title: "Submission Failed",
                description: "An error occurred while submitting your dispute. Please try again.",
                variant: "destructive"
            });
        }
    } finally {
        setIsSubmitting(false);
    }
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
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                />
                <div 
                    className="p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">Drag and drop files here or click to upload.</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 5 files, 5MB each, 50MB total.</p>
                </div>
                 {evidenceFiles.length > 0 && (
                    <div className="space-y-2 pt-4">
                        <h4 className="font-medium text-sm">Selected Files:</h4>
                        {evidenceFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                                <div className="flex items-center gap-2 truncate">
                                    <Paperclip className="h-4 w-4 shrink-0"/>
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><ShieldQuestion className="mr-2 h-4 w-4" /> Submit Dispute</>}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
