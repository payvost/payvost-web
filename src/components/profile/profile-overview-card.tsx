'use client';

import { useRef, useState } from 'react';
import { Camera, UploadCloud } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export type OverviewBadge = {
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
};

interface Props {
  name: string;
  email: string;
  photoUrl?: string | null;
  previewUrl?: string | null;
  badges?: OverviewBadge[];
  editing?: boolean;
  locked?: boolean;
  disabled?: boolean;
  onPhotoSelected?: (file: File, previewUrl: string) => void;
}

export function ProfileOverviewCard({
  name,
  email,
  photoUrl,
  previewUrl,
  badges = [],
  editing = false,
  locked = false,
  disabled = false,
  onPhotoSelected,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getInitials = (n?: string) => {
    const v = (n || '').trim();
    if (!v) return 'U';
    const parts = v.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return v.slice(0, 2).toUpperCase();
  };

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB.', variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(file);
    onPhotoSelected?.(file, url);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: 'Camera unavailable', description: "Your browser doesn't support camera access.", variant: 'destructive' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast({ title: 'Camera error', description: "Could not access your device's camera.", variant: 'destructive' });
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const el = videoRef.current;
    if (!el) return;
    const stream = el.srcObject as MediaStream | null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    el.srcObject = null;
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      handleFile(file);
      stopCamera();
      setCameraOpen(false);
    }, 'image/jpeg');
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={previewUrl || photoUrl || ''} alt={name || 'User'} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>

            {editing && !locked && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onSelect={() => fileInputRef.current?.click()}
                    disabled={disabled}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={startCamera} disabled={disabled}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take selfie
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.currentTarget.value = '';
              }}
              disabled={disabled}
            />
          </div>

          <h2 className="text-xl font-semibold">{name || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{email || 'N/A'}</p>

          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {badges.map((b) => (
                <Badge key={b.label} variant={b.variant || 'secondary'} className={b.className}>
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={cameraOpen}
        onOpenChange={(o) => {
          if (!o) stopCamera();
          setCameraOpen(o);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Take a selfie</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopCamera();
                setCameraOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={capture}>
              Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
