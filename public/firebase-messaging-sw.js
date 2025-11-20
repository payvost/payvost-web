// Firebase Cloud Messaging Service Worker
// This handles background push notifications
//
// SECURITY NOTE: Service workers cannot access process.env directly.
// Firebase config should be injected at build time or fetched from an API endpoint.
// For now, this uses a config endpoint. Update to use your actual Firebase project config.

importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Fetch Firebase config from API endpoint (recommended approach)
// Fallback to default config if fetch fails (for development)
let firebaseConfig = null;

// Try to get config from API endpoint first
self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/api/firebase-config')
      .then(response => response.json())
      .then(config => {
        firebaseConfig = config;
        firebase.initializeApp(config);
      })
      .catch(() => {
        // Fallback: Use environment-based config (injected at build time)
        // TODO: Replace with actual build-time environment variable injection
        console.warn('[firebase-messaging-sw] Using fallback config. Configure /api/firebase-config endpoint for production.');
        firebaseConfig = {
          apiKey: "{{NEXT_PUBLIC_FIREBASE_API_KEY}}",
          authDomain: "{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}",
          projectId: "{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}",
          storageBucket: "{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}",
          messagingSenderId: "{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}",
          appId: "{{NEXT_PUBLIC_FIREBASE_APP_ID}}",
          measurementId: "{{NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}}"
        };
        // Only initialize if we have a valid API key (not a placeholder)
        if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('{{')) {
          firebase.initializeApp(firebaseConfig);
        } else {
          console.error('[firebase-messaging-sw] Firebase config not available. Push notifications disabled.');
        }
      })
  );
});

// Initialize with fallback if install event already fired
if (!firebaseConfig) {
  // This will be replaced at build time with actual values
  const config = {
    apiKey: "{{NEXT_PUBLIC_FIREBASE_API_KEY}}",
    authDomain: "{{NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}}",
    projectId: "{{NEXT_PUBLIC_FIREBASE_PROJECT_ID}}",
    storageBucket: "{{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}}",
    messagingSenderId: "{{NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}}",
    appId: "{{NEXT_PUBLIC_FIREBASE_APP_ID}}",
    measurementId: "{{NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}}"
  };
  
  // Only initialize if config looks valid (not placeholders)
  if (config.apiKey && !config.apiKey.startsWith('{{')) {
    firebase.initializeApp(config);
  }
}

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Payvost';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/payvost.png',
    badge: '/payvost.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'View'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Get the notification data
  const data = event.notification.data || {};
  const urlToOpen = data.url || '/dashboard/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window exists, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
