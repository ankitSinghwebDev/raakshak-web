// Firebase Cloud Messaging Service Worker
// This runs in the background even when the browser tab is closed

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAs2Gz0ofXnCmePl50-tGHqGTsBvOgj7o0",
  authDomain: "rakshak-official-8e6b1.firebaseapp.com",
  projectId: "rakshak-official-8e6b1",
  messagingSenderId: "406498340217",
  appId: "1:406498340217:web:0b0e588b6f6ae73ca4d3a8",
});

const messaging = firebase.messaging();

// Handle background messages (when tab is closed/minimized)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || '🛡️ Rakshak Alert';
  const notificationOptions = {
    body: body || 'Someone scanned your Rakshak QR',
    icon: icon || 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
    badge: '/favicon.jpg',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'rakshak-scan-alert',
    renotify: true,
    data: payload.data || {},
    actions: [
      { action: 'open_dashboard', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open_dashboard' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing tab if open
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new tab
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
    );
  }
});
