import { initializeApp } from 'firebase/app'
import { getDatabase, push, ref, set } from 'firebase/database'
import { pbkdf2Sync, randomBytes } from 'node:crypto'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAs2Gz0ofXnCmePl50-tGHqGTsBvOgj7o0',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'rakshak-official-8e6b1.firebaseapp.com',
  databaseURL: process.env.VITE_FIREBASE_DB_URL || 'https://rakshak-official-8e6b1-default-rtdb.firebaseio.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'rakshak-official-8e6b1',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'rakshak-official-8e6b1.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '406498340217',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:406498340217:web:0b0e588b6f6ae73ca4d3a8',
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const DEV_VAULT_PIN = '1234'
const PIN_ITERATIONS = 150000

const now = Date.now()
const defaultGeneratedId = `RKSKDEV${String(now).slice(-4)}`
const defaultVehicle = `HR26DS${String(now).slice(-4)}`
const publicSiteUrl = (process.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '')

const args = process.argv.slice(2)

const getArgValue = (flag, fallback) => {
  const index = args.indexOf(flag)
  if (index === -1 || index === args.length - 1) return fallback
  return args[index + 1]
}

const hasFlag = (flag) => args.includes(flag)

const devUser = {
  name: getArgValue('--name', 'Dev User'),
  vehicle: getArgValue('--vehicle', defaultVehicle),
  mobile: getArgValue('--mobile', '9876543210'),
  whatsapp: getArgValue('--whatsapp', '9876543210'),
  generatedId: getArgValue('--id', defaultGeneratedId),
  plan: getArgValue('--plan', 'Premium Studio'),
  amount: Number(getArgValue('--amount', '299')),
  coupon: getArgValue('--coupon', 'WTRAK01'),
}

const createSeedVaultSecrets = (pin) => {
  const pinSalt = randomBytes(16).toString('base64')
  const pinHash = pbkdf2Sync(pin, Buffer.from(pinSalt, 'base64'), PIN_ITERATIONS, 32, 'sha256').toString('base64')
  return { pinSalt, pinHash }
}

const buildCustomerPayload = () => ({
  ...(() => {
    const { pinSalt, pinHash } = createSeedVaultSecrets(DEV_VAULT_PIN)
    return {
      generatedId: devUser.generatedId,
      name: devUser.name.toUpperCase(),
      vehicle: devUser.vehicle.toUpperCase(),
      mobile: devUser.mobile,
      whatsapp: devUser.whatsapp,
      plan: devUser.plan,
      amount: devUser.amount,
      paymentId: `dev_payment_${now}`,
      coupon: devUser.coupon.toUpperCase(),
      status: 'Paid',
      qrLink: `${publicSiteUrl}/scan?id=${devUser.generatedId}`,
      totalScans: 2,
      fcmToken: '',
      timestamp: new Date(now).toISOString(),
      emergency: {
        iceContact1: '9988776655',
        relation1: 'Brother',
        iceContact2: '8877665544',
        relation2: 'Friend',
        bloodGroup: 'B+',
        age: '29',
        conditions: ['Asthma'],
        medicines: 'Inhaler',
      },
      vault: {
        pinHash,
        pinSalt,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
        documents: {},
      },
    }
  })(),
})

const buildSeedScans = () => ([
  {
    message: 'Your vehicle is blocking my way',
    type: 'parking',
    deviceFingerprint: 'dev_fp_alpha',
    timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
  },
  {
    message: 'Someone damaged your vehicle',
    type: 'urgent',
    deviceFingerprint: 'dev_fp_beta',
    timestamp: new Date(now - 4 * 60 * 1000).toISOString(),
  },
])

const buildSupportMessages = () => ([
  {
    text: 'QR not working on one of my vehicles.',
    sender: 'user',
    name: devUser.name.toUpperCase(),
    vehicle: devUser.vehicle.toUpperCase(),
    timestamp: new Date(now - 20 * 60 * 1000).toISOString(),
  },
  {
    text: 'Thanks for reaching out! Our support team will get back to you within 24 hours. For urgent issues, please call us directly.',
    sender: 'bot',
    timestamp: new Date(now - 19 * 60 * 1000).toISOString(),
  },
])

const seedDevUserData = async () => {
  const customersRef = ref(db, 'customers')
  const newCustomerRef = push(customersRef)
  const customerKey = newCustomerRef.key
  const customerPayload = buildCustomerPayload()

  await set(newCustomerRef, customerPayload)

  const seedScans = !hasFlag('--no-scans')
  if (seedScans) {
    for (const scan of buildSeedScans()) {
      await set(push(ref(db, `scans/${customerKey}`)), scan)
    }
  }

  const seedSupport = !hasFlag('--no-support')
  if (seedSupport) {
    for (const message of buildSupportMessages()) {
      await set(push(ref(db, `support/${customerKey}`)), message)
    }
  }

  console.log('Dev user seeded successfully')
  console.log(JSON.stringify({
    customerKey,
    generatedId: customerPayload.generatedId,
    vehicle: customerPayload.vehicle,
    mobile: customerPayload.mobile,
    qrLink: customerPayload.qrLink,
    seededScans: seedScans ? 2 : 0,
    seededSupportMessages: seedSupport ? 2 : 0,
  }, null, 2))
}

seedDevUserData().catch((error) => {
  console.error('Failed to seed dev user')
  console.error(error)
  process.exit(1)
})
