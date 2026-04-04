import { useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { messaging, getToken, onMessage } from '../config/firebase'
import { db, ref, set } from '../config/firebase'

// Your VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// Generate one at: Firebase Console → Project Settings → Cloud Messaging → Web configuration → Generate key pair
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

const usePushNotifications = (currentUser) => {
  // Register FCM token and save to Firebase
  const registerPush = useCallback(async () => {
    if (!messaging || !currentUser?.key) return
    if (!('serviceWorker' in navigator)) return
    if (!('Notification' in window)) return

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      // Get FCM token
      if (!VAPID_KEY) {
        console.warn('VAPID key not set — FCM token generation skipped. Add VITE_FIREBASE_VAPID_KEY to .env')
        return
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        // Save token to Firebase under user's record
        await set(ref(db, `customers/${currentUser.key}/fcmToken`), token)
        console.log('FCM token registered')
      }
    } catch (err) {
      console.warn('FCM registration failed:', err.message)
    }
  }, [currentUser?.key])

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {}
      toast(body || 'New scan alert!', { duration: 5000 })

      // Also show browser notification for foreground
      if (Notification.permission === 'granted') {
        new Notification(title || '🛡️ Rakshak Alert', {
          body: body || 'Someone scanned your QR',
          icon: 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
          tag: 'rakshak-foreground',
          renotify: true,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  // Register on mount
  useEffect(() => {
    registerPush()
  }, [registerPush])

  return { registerPush }
}

export default usePushNotifications
