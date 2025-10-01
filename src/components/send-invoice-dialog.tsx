
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, FileImage, FileText, Loader2, Send } from 'lucide-react';
import type { InvoiceFormValues } from './create-invoice-page';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';

interface SendInvoiceDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  invoiceData: InvoiceFormValues;
  grandTotal: number;
  onSuccessfulSend: () => void;
}

export function SendInvoiceDialog({ isOpen, setIsOpen, invoiceData, grandTotal, onSuccessfulSend }: SendInvoiceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');


  // Listen for updates on the created invoice document
  useEffect(() => {
    if (!invoiceId || !user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid, "invoices", invoiceId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.shareUrl) {
          setShareableLink(data.shareUrl);
        }
        if (data.pdfUrl) {
          setPdfUrl(data.pdfUrl);
          setIsProcessing(false); // Stop loading when PDF is ready
        }
      }
    });

    return () => unsub();
  }, [invoiceId, user]);


  const handleSaveAndInitiateGeneration = async () => {
    if (!user) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return;
    }
    setIsProcessing(true);
    
    // Convert dates to Timestamps for Firestore
    const firestoreData = {
        ...invoiceData,
        issueDate: Timestamp.fromDate(invoiceData.issueDate),
        dueDate: Timestamp.fromDate(invoiceData.dueDate),
        grandTotal,
        userId: user.uid,
        status: 'Pending',
        createdAt: serverTimestamp(),
    };

    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'invoices'), firestoreData);
        setInvoiceId(docRef.id);
        toast({
            title: "Invoice Saved",
            description: "Generating your invoice PDF and shareable link now...",
        });

    } catch (error) {
        console.error("Error saving invoice:", error);
        toast({ title: "Error Saving Invoice", variant: "destructive" });
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Automatically trigger save & generation when dialog opens with data
    if (isOpen && invoiceData && !invoiceId) {
        handleSaveAndInitiateGeneration();
    }
    // Reset state when dialog closes
    if (!isOpen) {
        setIsProcessing(false);
        setInvoiceId(null);
        setShareableLink('');
        setPdfUrl('');
    }
  }, [isOpen, invoiceData]);


  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({ title: 'Link Copied!' });
  }

  // This function would now use the generated link
  const handleSendEmail = async () => {
     if (!shareableLink) {
        toast({ title: "Link not ready", description: "Please wait for the link to be generated.", variant: 'destructive'});
        return;
    }
    // Logic to send email with the `shareableLink`
    console.log(`Sending email to ${invoiceData.toEmail} with link: ${shareableLink}`);
    toast({ title: "Email Sent!", description: `Invoice sent to ${invoiceData.toEmail}`});
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send & Share Invoice</DialogTitle>
          <DialogDescription>
            Your invoice is being processed. Share it with your client once it's ready.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             {isProcessing && (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating PDF and links...</p>
                </div>
            )}
            
            {!isProcessing && shareableLink && (
                <>
                    <div className="space-y-2">
                        <Label>Shareable Payment Link</Label>
                        <div className="flex gap-2">
                            <Input value={shareableLink} readOnly />
                            <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <Button type="button" onClick={handleSendEmail} className="w-full">
                        <Send className="mr-2 h-4 w-4" /> Send to {invoiceData.toEmail}
                    </Button>
                </>
            )}

            {!isProcessing && pdfUrl && (
                <div className="space-y-2">
                     <Label>Download / Share as Document</Label>
                     <div className="grid grid-cols-2 gap-2">
                        <Button asChild type="button" variant="outline"><a href={pdfUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download PDF</a></Button>
                        <Button type="button" variant="outline" disabled><FileImage className="mr-2 h-4 w-4"/>Image (Coming Soon)</Button>
                     </div>
                </div>
            )}

          </div>
      </DialogContent>
    </Dialog>
  );
}
