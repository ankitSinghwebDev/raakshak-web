/**
 * Rakshak Firebase Cloud Function
 * Sends push notification to vehicle owner when their QR is scanned
 *
 * SETUP:
 * 1. cd functions
 * 2. npm install
 * 3. firebase deploy --only functions
 *
 * REQUIRES: Firebase Blaze (pay-as-you-go) plan
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Trigger when a new scan is added under /scans/{customerId}/{scanId}
exports.onNewScan = functions.database
  .ref('/scans/{customerId}/{scanId}')
  .onCreate(async (snapshot, context) => {
    const { customerId } = context.params;
    const scanData = snapshot.val();

    try {
      // Get the customer's FCM token
      const customerSnap = await admin.database().ref(`customers/${customerId}`).once('value');
      const customer = customerSnap.val();

      if (!customer || !customer.fcmToken) {
        console.log('No FCM token for customer:', customerId);
        return null;
      }

      // Build notification
      const typeEmoji = scanData.type === 'emergency' ? '🚨'
        : scanData.type === 'urgent' ? '⚠️' : '🅿️';

      const message = {
        token: customer.fcmToken,
        notification: {
          title: `${typeEmoji} Rakshak Alert — ${customer.vehicle}`,
          body: scanData.message || 'Someone scanned your Rakshak QR',
        },
        data: {
          type: scanData.type || 'parking',
          message: scanData.message || '',
          timestamp: scanData.timestamp || '',
          customerId: customerId,
        },
        webpush: {
          notification: {
            icon: 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
            badge: '/favicon.jpg',
            vibrate: [200, 100, 200, 100, 200],
            tag: 'rakshak-scan-' + context.params.scanId,
            renotify: true,
            actions: [
              { action: 'open_dashboard', title: 'Open Dashboard' },
              { action: 'dismiss', title: 'Dismiss' },
            ],
          },
          fcmOptions: {
            link: '/dashboard',
          },
        },
      };

      await admin.messaging().send(message);
      console.log('Push notification sent to:', customer.vehicle);
      return null;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });
