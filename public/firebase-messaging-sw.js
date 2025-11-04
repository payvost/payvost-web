// Firebase Cloud Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBqaU9yC9KvhB-KNvWg-dPWj5LbXXCbKxQ",
  authDomain: "qwibik-remit.firebaseapp.com",
  projectId: "qwibik-remit",
  storageBucket: "qwibik-remit.firebasestorage.app",
  messagingSenderId: "882514216036",
  appId: "1:882514216036:web:bd456ca04b5c49829e7ea4",
  measurementId: "G-3P52Y62PMF"
});

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
