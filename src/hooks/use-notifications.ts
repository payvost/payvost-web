/**
 * Custom hook for managing push notifications
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import {
  setupUserNotifications,
  setupForegroundMessageHandler,
  clearFCMToken,
} from '@/lib/fcm';
import type { MessagePayload } from 'firebase/messaging';
import { useToast } from './use-toast';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Setup notifications when user logs in
  useEffect(() => {
    if (!user) return;

    // Check if notifications are already enabled
    if (Notification.permission === 'granted') {
      setIsEnabled(true);
    }

    // Setup foreground message handler
    const unsubscribe = setupForegroundMessageHandler((payload: MessagePayload) => {
      // Show toast notification
      toast({
        title: payload.notification?.title || 'New Notification',
        description: payload.notification?.body || '',
        duration: 5000,
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, toast]);

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'You must be logged in to enable notifications',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const success = await setupUserNotifications(user.uid);
      
      if (success) {
        setIsEnabled(true);
        toast({
          title: 'Success',
          description: 'Push notifications enabled',
        });
        return true;
      } else {
        toast({
          title: 'Error',
          description: 'Could not enable notifications. Please check your browser settings.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while enabling notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    if (!user?.uid) return false;

    setIsLoading(true);

    try {
      const success = await clearFCMToken(user.uid);
      
      if (success) {
        setIsEnabled(false);
        toast({
          title: 'Success',
          description: 'Push notifications disabled',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  return {
    isEnabled,
    isLoading,
    enableNotifications,
    disableNotifications,
  };
};
