
'use client';

import { useState, useEffect } from 'react';
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
import { Copy, Download, FileImage, Loader2, Send, QrCode, Share2, Printer } from 'lucide-react';
import type { InvoiceFormValues } from './create-invoice-page';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SendInvoiceDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  invoiceId: string | null;
  onSuccessfulSend: () => void;
}

export function SendInvoiceDialog({ isOpen, setIsOpen, invoiceId, onSuccessfulSend }: SendInvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<DocumentData | null>(null);

  useEffect(() => {
    if (isOpen && invoiceId) {
      setLoading(true);
      const docRef = doc(db, 'invoices', invoiceId);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setInvoiceData({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoice. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isOpen, invoiceId, toast]);

  const copyLink = () => {
    if (!invoiceData?.publicUrl) return;
    navigator.clipboard.writeText(invoiceData.publicUrl);
    toast({ title: 'Link Copied!' });
  }

  const handlePrint = () => {
    if (!invoiceId) return;
    
    // Open PDF in new window for printing
    const pdfUrl = `/api/pdf/invoice/${invoiceId}`;
    window.open(pdfUrl, '_blank');
    
    toast({
      title: "Opening PDF",
      description: "The invoice PDF will open in a new window. Use the print button in the PDF viewer.",
    });
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onSuccessfulSend(); // Navigate back when dialog closes
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send & Share Invoice</DialogTitle>
          <DialogDescription>
            Your invoice has been sent. You can also share it using the link below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             {loading && (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating shareable link...</p>
                </div>
            )}
            
            {invoiceData && invoiceData.publicUrl && (
                <>
                    <div className="space-y-2">
                        <Label>Shareable Payment Link</Label>
                        <div className="flex gap-2">
                            <Input value={invoiceData.publicUrl} readOnly />
                            <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon">
                                <QrCode className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {invoiceData && (
                <div className="space-y-2 pt-4">
                     <div className="grid grid-cols-2 gap-2">
                        <Button asChild type="button" variant="outline"><a href={`/api/pdf/invoice/${invoiceData.id}`} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4"/>Download PDF</a></Button>
                        <Button type="button" variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                     </div>
                </div>
            )}

          </div>
      </DialogContent>
    </Dialog>
  );
}
