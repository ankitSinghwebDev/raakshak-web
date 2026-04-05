import { initializeApp } from "firebase/app";
import {
  connectDatabaseEmulator,
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  increment,
  onValue,
} from "firebase/database";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'

const env = import.meta.env

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || env.VITE_FIREBASE_DB_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseEnvKeys = [
  ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_FIREBASE_DATABASE_URL', firebaseConfig.databaseURL],
  ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
  ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
]

const missingFirebaseEnvKeys = requiredFirebaseEnvKeys
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingFirebaseEnvKeys.length > 0) {
  throw new Error(
    `Missing Firebase env vars: ${missingFirebaseEnvKeys.join(', ')}. ` +
    'Add them to your local .env file before starting Vite.'
  )
}

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// FCM Messaging — only init in browser (not SSR)
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("FCM not supported in this environment");
}
export { messaging, getToken, onMessage };

// Re-export database utilities
export { ref, push, set, get, update, query, orderByChild, equalTo, increment, onValue };

// Cloud Functions (callable)
export const functions = getFunctions(app)
export { httpsCallable, signInWithCustomToken }

const emulatorPreference = env.VITE_USE_FIREBASE_EMULATORS
const isBrowser = typeof window !== 'undefined'
const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const useFirebaseEmulators = env.DEV && (
  emulatorPreference === 'true' || (emulatorPreference !== 'false' && isLocalHost)
)

if (useFirebaseEmulators && !globalThis.__RAKSHAK_FIREBASE_EMULATORS_CONNECTED__) {
  const functionsHost = env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || '127.0.0.1'
  const functionsPort = Number(env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5002)
  const databaseHost = env.VITE_FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1'
  const databasePort = Number(env.VITE_FIREBASE_DATABASE_EMULATOR_PORT || 9000)
  const storageHost = env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1'
  const storagePort = Number(env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199)

  connectDatabaseEmulator(db, databaseHost, databasePort)
  connectFunctionsEmulator(functions, functionsHost, functionsPort)
  connectStorageEmulator(storage, storageHost, storagePort)
  globalThis.__RAKSHAK_FIREBASE_EMULATORS_CONNECTED__ = true
}

export default app;
