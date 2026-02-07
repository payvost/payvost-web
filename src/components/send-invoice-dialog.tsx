
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
import { DocumentData } from 'firebase/firestore';
import { QRCodeDialog } from './qr-code-dialog';
import { useAuth } from '@/hooks/use-auth';

interface SendInvoiceDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  invoiceId: string | null;
  onSuccessfulSend: () => void;
}

export function SendInvoiceDialog({ isOpen, setIsOpen, invoiceId, onSuccessfulSend }: SendInvoiceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
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

    const fetchInvoice = async (retryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second
      
      try {
        if (!user) {
          setLoading(false);
          toast({ title: 'Not authenticated', description: 'Please sign in again.', variant: 'destructive' });
          return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`/api/v1/invoices/${invoiceId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 404) {
            // If invoice not found and we have retries left, retry (might be timing issue)
            if (retryCount < maxRetries) {
              setTimeout(() => {
                fetchInvoice(retryCount + 1);
              }, retryDelay);
              return;
            }
            
            setLoading(false);
            toast({
              title: 'Invoice not found',
              description: 'The invoice may still be processing. Please refresh the page in a moment.',
              variant: 'destructive',
            });
            return;
          }
          
          // For other errors, try to parse error message
          let errorMessage = 'Failed to load invoice';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If response is not JSON, use status text
          }
          
          setLoading(false);
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }

        const invoiceData = await response.json();
        
        if (!invoiceData || !invoiceData.id) {
          // If invalid data and we have retries left, retry
          if (retryCount < maxRetries) {
            setTimeout(() => {
              fetchInvoice(retryCount + 1);
            }, retryDelay);
            return;
          }
          
          setLoading(false);
          toast({
            title: 'Error',
            description: 'Invalid invoice data received',
            variant: 'destructive',
          });
          return;
        }

        // Invoice endpoint already returns UI-friendly flattened fields (publicUrl + publicLinkToken when available)
        const convertedData: DocumentData = {
          id: invoiceData.id,
          invoiceNumber: invoiceData.invoiceNumber || '',
          status: invoiceData.status || 'Draft',
          publicUrl: invoiceData.publicUrl || null,
          publicLinkToken: invoiceData.publicLinkToken || null,
          grandTotal: invoiceData.grandTotal,
          currency: invoiceData.currency || 'USD',
          ...invoiceData,
        };

        setInvoiceData(convertedData);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        
        // If error and we have retries left, retry
        if (retryCount < maxRetries) {
          setTimeout(() => {
            fetchInvoice(retryCount + 1);
          }, retryDelay);
          return;
        }
        
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load invoice. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchInvoice();
  }, [isOpen, invoiceId, toast, user]);

  const copyLink = () => {
    const publicUrl = getPublicUrl();
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast({ title: 'Link Copied!' });
  }
  
  const getPublicUrl = () => {
    const raw = (invoiceData as any)?.publicUrl as string | null | undefined;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${window.location.origin}${raw}`;
  }

  const handlePrint = () => {
    if (!invoiceId) return;
    const publicLinkToken = (invoiceData as any)?.publicLinkToken as string | null;
    if (!publicLinkToken) {
      toast({ title: 'Link Not Ready', description: 'Public link is not available yet.', variant: 'destructive' });
      return;
    }
    
    // Open PDF in new window for printing
    const pdfUrl = `/api/pdf/invoice/${invoiceId}?token=${encodeURIComponent(publicLinkToken)}`;
    window.open(pdfUrl, '_blank');
    
    toast({
      title: "Opening PDF",
      description: "The invoice PDF will open in a new window. Use the print button in the PDF viewer.",
    });
  };

  const handleDownloadInvoice = () => {
    if (!invoiceId) return;
    const publicLinkToken = (invoiceData as any)?.publicLinkToken as string | null;
    if (!publicLinkToken) {
      toast({ title: 'Link Not Ready', description: 'Public link is not available yet.', variant: 'destructive' });
      return;
    }

    // Use Vercel serverless function for PDF generation
    const downloadUrl = `/api/pdf/invoice/${invoiceId}?token=${encodeURIComponent(publicLinkToken)}`;
    
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
