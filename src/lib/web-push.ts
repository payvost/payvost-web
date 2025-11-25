/**
 * Web Push Service for Rate Alerts
 * Handles push notification subscription for FX rate alerts
 * Uses Web Push API (not FCM) for rate alerts
 */

// VAPID public key for web push - must match backend VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
  console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set. Web push notifications for rate alerts will not work.');
}

/**
 * Convert VAPID key from base64 URL-safe to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission was previously denied');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker for web push
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/web-push-sw.js', {
      scope: '/'
    });
    console.log('[Web Push] Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('[Web Push] Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Create push subscription for rate alerts
 */
export async function createPushSubscription(): Promise<PushSubscription | null> {
  try {
    // Check if VAPID key is configured
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Web Push] VAPID public key not configured');
      return null;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[Web Push] Notification permission not granted');
      return null;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
      console.log('[Web Push] Push subscription created:', subscription);
    } else {
      console.log('[Web Push] Using existing push subscription');
    }

    // Convert subscription to JSON format for backend
    return subscription;
  } catch (error) {
    console.error('[Web Push] Failed to create push subscription:', error);
    return null;
  }
}

/**
 * Get existing push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Web Push] Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribePush(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Web Push] Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Web Push] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Convert PushSubscription to JSON format for backend
 */
export function subscriptionToJSON(subscription: PushSubscription): any {
  const keys = subscription.getKey ? {
    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
    auth: arrayBufferToBase64(subscription.getKey('auth'))
  } : null;

  return {
    endpoint: subscription.endpoint,
    keys: keys
  };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

