
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
import { doc, onSnapshot, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QRCodeDialog } from './qr-code-dialog';

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
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !invoiceId) {
      setInvoiceData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | null = null;

    const fetchInvoice = async () => {
      try {
        // Try invoices collection first
        let docRef = doc(db, 'invoices', invoiceId);
        let docSnap = await getDoc(docRef);

        // If not found, try businessInvoices collection
        if (!docSnap.exists()) {
          docRef = doc(db, 'businessInvoices', invoiceId);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setInvoiceData(data);
          
          // Set up real-time listener for updates
          unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
              setInvoiceData({ id: snapshot.id, ...snapshot.data() });
            }
          });
        } else {
          toast({
            title: 'Error',
            description: 'Invoice not found.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'Error',
          description: error?.code === 'permission-denied' 
            ? 'Permission denied. Please ensure you have access to this invoice.'
            : 'Failed to load invoice. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();

    // Cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, invoiceId, toast]);

  const copyLink = () => {
    const publicUrl = invoiceData?.publicUrl || (invoiceId ? `${window.location.origin}/invoice/${invoiceId}` : null);
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Link Copied!' });
  }
  
  const getPublicUrl = () => {
    return invoiceData?.publicUrl || (invoiceId ? `${window.location.origin}/invoice/${invoiceId}` : null);
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

  const handleDownloadInvoice = () => {
    if (!invoiceId) return;

    // Use Vercel serverless function for PDF generation
    const downloadUrl = `/api/pdf/invoice/${invoiceId}`;
    
    // Show loading toast
    toast({
      title: "Preparing Download",
      description: "Generating your invoice PDF...",
    });

    // Attempt download with error handling
    fetch(downloadUrl)
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          
          // Check if it's the billing/service unavailable error
          if (errorText.includes('not available yet') || errorText.includes('try again in 30 seconds')) {
            toast({
              title: "Service Temporarily Unavailable",
              description: "The PDF generation service is currently unavailable. Please try again later or contact support.",
              variant: "destructive",
            });
          } else if (errorText.includes('not configured')) {
            toast({
              title: "Configuration Error",
              description: "The PDF service is not properly configured. Please contact support.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Download Failed",
              description: `Unable to generate PDF. ${errorText}`,
              variant: "destructive",
            });
          }
          throw new Error(errorText);
        }
        return response.blob();
      })
      .then((blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete",
          description: "Your invoice has been downloaded successfully.",
        });
      })
      .catch((error) => {
        console.error('[Invoice Download] Error:', error);
        // Error toast already shown above
      });
  };

  const handleShare = async () => {
    const publicUrl = getPublicUrl();
    if (!publicUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${invoiceData?.invoiceNumber || invoiceData?.id || invoiceId}`,
          text: `Please pay invoice ${invoiceData?.invoiceNumber || invoiceData?.id || invoiceId}`,
          url: publicUrl,
        });
        toast({ title: 'Shared', description: 'Invoice link shared successfully' });
      } else {
        // Fallback: copy to clipboard
        copyLink();
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // User cancelled or error occurred
        copyLink(); // Fallback to copy
      }
    }
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
            
            {invoiceData && (() => {
                const publicUrl = getPublicUrl();
                if (!publicUrl) {
                    return (
                        <div className="text-sm text-muted-foreground p-4 text-center">
                            Generating shareable link...
                        </div>
                    );
                }
                
                return (
                    <div className="space-y-2">
                        <Label>Shareable Payment Link</Label>
                        <div className="flex gap-2">
                            <Input value={publicUrl} readOnly />
                            <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={handleShare}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={() => setQrCodeOpen(true)}>
                                <QrCode className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
            })()}

            {invoiceData && (
                <div className="space-y-2 pt-4">
                     <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={handleDownloadInvoice}><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
                        <Button type="button" variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                     </div>
                </div>
            )}

          </div>
      </DialogContent>
      
      {/* QR Code Dialog */}
      {invoiceData && getPublicUrl() && (
        <QRCodeDialog
          isOpen={qrCodeOpen}
          setIsOpen={setQrCodeOpen}
          url={getPublicUrl() || ''}
          title="Invoice QR Code"
        />
      )}
    </Dialog>
  );
}
