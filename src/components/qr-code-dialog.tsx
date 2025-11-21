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
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface QRCodeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  url: string;
  title?: string;
}

export function QRCodeDialog({ isOpen, setIsOpen, url, title = 'QR Code' }: QRCodeDialogProps) {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && url) {
      generateQRCode();
    }
  }, [isOpen, url]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Generate QR code via API route
      const response = await fetch(`/api/qr-code?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      const blob = await response.blob();
      const qrUrl = URL.createObjectURL(blob);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'invoice-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Downloaded', description: 'QR code downloaded successfully' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Scan this QR code to access the invoice link
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : qrCodeUrl ? (
            <>
              <div className="p-4 bg-white rounded-lg border">
                <Image
                  src={qrCodeUrl}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="rounded"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadQRCode}>
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to generate QR code</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

