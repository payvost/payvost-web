/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification registration and message handling
 */

// @ts-ignore - Firebase messaging types
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';
import { app } from './firebase';

// FCM VAPID Key - must be set via environment variable
const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;

if (!VAPID_KEY) {
  console.error('NEXT_PUBLIC_FCM_VAPID_KEY is not set. Push notifications will not work.');
}

let messaging: Messaging | null = null;

/**
 * Initialize Firebase Cloud Messaging
 * Only works in browser environment
 */
export const initializeFCM = (): Messaging | null => {
  if (typeof window === 'undefined') {
    console.warn('FCM can only be initialized in browser environment');
    return null;
  }

  if (!messaging) {
    try {
      messaging = getMessaging(app);
      console.log('✅ Firebase Cloud Messaging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize FCM:', error);
      return null;
    }
  }

  return messaging;
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Initialize messaging
    const messagingInstance = initializeFCM();
    if (!messagingInstance) {
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Get FCM token
    if (!VAPID_KEY) {
      console.error('FCM VAPID key not configured. Cannot get notification token.');
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ FCM Token:', token);
      return token;
    } else {
      console.log('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

/**
 * Save FCM token to Firestore for the current user
 */
export const saveFCMToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    const { db } = await import('./firebase');
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    await setDoc(
      doc(db, 'users', userId),
      {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('✅ FCM token saved to Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return false;
  }
};

/**
 * Setup foreground message listener
 * Handles notifications when app is in foreground
 */
export const setupForegroundMessageHandler = (
  callback: (payload: MessagePayload) => void
): (() => void) | null => {
  const messagingInstance = initializeFCM();
  if (!messagingInstance) {
    return null;
  }

  const unsubscribe = onMessage(messagingInstance, (payload: any) => {
    console.log('📬 Foreground message received:', payload);
    
    // Show browser notification even when app is open
    if (payload.notification) {
      const { title, body, icon } = payload.notification;
      
      if (Notification.permission === 'granted') {
        new Notification(title || 'Payvost', {
          body: body || 'You have a new notification',
          icon: icon || '/payvost.png',
          badge: '/payvost.png',
          tag: payload.data?.type || 'general',
          data: payload.data,
        });
      }
    }

    // Call custom callback
    callback(payload);
  });

  return unsubscribe;
};

/**
 * Complete FCM setup for a user
 * Call this after user logs in
 */
export const setupUserNotifications = async (userId: string): Promise<boolean> => {
  try {
    // Request permission and get token
    const token = await requestNotificationPermission();
    
    if (!token) {
      console.log('Could not get FCM token');
      return false;
    }

    // Save token to Firestore
    const saved = await saveFCMToken(userId, token);
    
    if (!saved) {
      console.log('Could not save FCM token');
      return false;
    }

    console.log('✅ User notifications setup complete');
    return true;
  } catch (error) {
    console.error('❌ Error setting up user notifications:', error);
    return false;
  }
};

/**
 * Remove FCM token when user logs out
 */
export const clearFCMToken = async (userId: string): Promise<boolean> => {
  try {
    const { db } = await import('./firebase');
    const { doc, updateDoc, deleteField } = await import('firebase/firestore');

    await updateDoc(doc(db, 'users', userId), {
      fcmToken: deleteField(),
      fcmTokenUpdatedAt: deleteField(),
    });

    console.log('✅ FCM token cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing FCM token:', error);
    return false;
  }
};
