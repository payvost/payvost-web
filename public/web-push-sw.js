// Web Push Service Worker for Rate Alerts
// This handles push notifications for FX rate alerts

self.addEventListener('push', (event) => {
  console.log('[web-push-sw] Push event received:', event);

  let notificationData = {
    title: 'FX Rate Alert',
    body: 'Your rate alert has been triggered!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'rate-alert',
    requireInteraction: true,
    data: {}
  };

  // Parse the push data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction !== false,
        data: data.data || {},
        actions: [
          {
            action: 'view',
            title: 'View Rates'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };
    } catch (e) {
      // If data is text, use it as the body
      const text = event.data.text();
      notificationData.body = text || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[web-push-sw] Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default URL to open
  const urlToOpen = event.notification.data?.url || '/fx-rates';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with this URL
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

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[web-push-sw] Notification closed:', event);
});

