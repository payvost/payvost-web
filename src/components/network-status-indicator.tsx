'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  className?: string;
  showOfflineOnly?: boolean;
  position?: 'top' | 'bottom' | 'inline';
}

export function NetworkStatusIndicator({ 
  className,
  showOfflineOnly = true,
  position = 'top'
}: NetworkStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Clear the wasOffline flag after showing the reconnection message
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render if online and showOfflineOnly is true
  if (isOnline && showOfflineOnly && !wasOffline) {
    return null;
  }

  const alertContent = (
    <Alert
      variant={isOnline ? 'default' : 'destructive'}
      className={cn(
        'mb-4',
        position === 'top' && 'mb-4',
        position === 'bottom' && 'mt-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            wasOffline ? (
              <>
                <Wifi className="h-4 w-4" />
                <AlertDescription>
                  Connection restored. Your changes will sync automatically.
                </AlertDescription>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <AlertDescription>You are online</AlertDescription>
              </>
            )
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You are currently offline. Some features may be unavailable.
              </AlertDescription>
            </>
          )}
        </div>
        {wasOffline && isOnline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWasOffline(false)}
            aria-label="Dismiss connection restored message"
          >
            Dismiss
          </Button>
        )}
      </div>
    </Alert>
  );

  if (position === 'inline') {
    return alertContent;
  }

  return (
    <div
      className={cn(
        position === 'top' && 'sticky top-0 z-50',
        position === 'bottom' && 'sticky bottom-0 z-50'
      )}
    >
      {alertContent}
    </div>
  );
}

