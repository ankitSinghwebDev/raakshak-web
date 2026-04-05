// Application Constants

export const APP_NAME = 'Rakshak'
export const APP_TAGLINE = 'Har Gaadi Ka Guardian'
export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SYbpfevfxtoawA'
export const WHATSAPP_NUMBER = '8700730344'

export const LANGUAGES = {
  en: 'ENGLISH',
  hi: 'HINDI (हिन्दी)'
}

export const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter', 'Truck', 'Fleet']

export const TAG_TYPES = {
  SIMPLE: 'simple',
  PREMIUM: 'premium'
}

export const TAG_PRICES = {
  SIMPLE: 199,
  PREMIUM: 299
}

export const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking']

export const FEATURES = [
  {
    id: 1,
    title: 'NO Parking Drama',
    description: 'Get polite alerts if you\'ve parked wrongly—no heated arguments, no awkward sticky notes.',
    icon: '🚗',
    badge: 'Polite'
  },
  {
    id: 2,
    title: 'Privacy First',
    description: 'Communicate safely without ever revealing your phone number. Your identity stays encrypted.',
    icon: '🔐',
    badge: '100% Secure'
  },
  {
    id: 3,
    title: 'Emergency Profiles',
    description: 'In urgent cases, anyone can scan to see your blood group or contact family instantly.',
    icon: '📞',
    badge: 'Life Saving'
  },
  {
    id: 4,
    title: 'Instant Updates',
    description: 'Change your phone number anytime from your dashboard. One tag for life.',
    icon: '⚙️',
    badge: 'Dashboard'
  },
  {
    id: 5,
    title: 'No App Needed',
    description: 'Anyone can scan using their phone camera. No apps, no downloads — just quick and easy access when it matters.',
    icon: '📱',
    badge: 'Fast Scan'
  },
  {
    id: 6,
    title: 'Works for All',
    description: 'Perfect for cars, bikes, trucks, or fleets. Manage all under one Rakshak account.',
    icon: '🚚',
    badge: 'Universal'
  },
  {
    id: 7,
    title: 'Tough & Reflective',
    description: 'Weather-proof tags designed for rain and sun. High-quality reflective material.',
    icon: '🛡️',
    badge: 'Radium'
  },
  {
    id: 8,
    title: 'Built for India',
    description: 'Designed for our busy roads, narrow lanes, and unique parking challenges.',
    icon: '🇮🇳',
    badge: 'Desi Fix'
  }
]

export const REVIEWS = [
  {
    id: 'review-1',
    name: 'Rajnish Singh',
    location: 'New Delhi',
    verified: true,
    text: 'Delhi ki tight parking mein ye tag bohot kaam aata hai. Privacy safe rehti hai aur kaam bhi ho jata hai.',
    rating: 5,
  },
  {
    id: 'review-2',
    name: 'Suresh Absule',
    location: 'Mumbai',
    verified: true,
    text: 'Radium quality top class hai. Raat ko chamakta hai toh dur se hi dikh jata hai. Best investment.',
    rating: 5,
  },
  {
    id: 'review-3',
    name: 'Vikash Singh',
    location: 'Chandigarh',
    verified: true,
    text: 'Police towing se bachne ka best tarika. Ek baar scan karke call aa gaya, meri gaadi bach gayi!',
    rating: 5,
  },
  {
    id: 'review-4',
    name: 'Kamal Reddy',
    location: 'Hyderabad',
    verified: true,
    text: 'Premium Card wala option bohot mast hai. VIP look milta hai gaadi ko.',
    rating: 5,
  },
  {
    id: 'review-5',
    name: 'Rakesk Santosh Singh',
    location: 'Pune',
    verified: true,
    text: 'Privacy ka dhyan rakha hai company ne. Mera number kisi ko dikhta nahi par message aa jata hai.',
    rating: 5,
  },
  {
    id: 'review-6',
    name: 'Shivam Rajiv lal Patel',
    location: 'Ahmedabad',
    verified: true,
    text: 'Society parking mein aksar gaadi block ho jati thi, ab Rakshak se turant owner ko inform kar deta hoon.',
    rating: 5,
  },
  {
    id: 'review-7',
    name: 'Manish Das',
    location: 'Kolkata',
    verified: true,
    text: 'Sticker ki gum aur durability bohot achi hai. 3 mahine ho gaye, na rang uda na utra.',
    rating: 5,
  },
  {
    id: 'review-8',
    name: 'Avinash Singh',
    location: 'Patna',
    verified: true,
    text: 'Emergency contact wala feature accident ke waqt bohot kaam aa sakta hai. Safety ke liye best.',
    rating: 5,
  },
  {
    id: 'review-9',
    name: 'Ashutosh Kumar',
    location: 'Bangalore',
    verified: true,
    text: 'Mujhe pehle darr lagta tha ki koi bhi scan karega, par system ekdum secure hai. Good job team.',
    rating: 5,
  },
  {
    id: 'review-10',
    name: 'Samsher Bhadur',
    location: 'Noida',
    verified: true,
    text: 'Har gaadi mein hona chahiye. India ki roads aur parking ke liye ye ek bohot bada solution hai.',
    rating: 5,
  },
]

export const PREMIUM_TOOLS = [
  {
    id: 1,
    name: 'Challan Checker',
    icon: '🚔',
    badge: 'Live 🟢',
    description: 'Real-time integration with RTO database.',
    status: 'live',
    buttonText: 'SCAN FOR FINES'
  },
  {
    id: 2,
    name: 'Expiry Alerts',
    icon: '📅',
    badge: 'Locked 🔒',
    description: 'AI monitoring for Insurance & PUC.',
    status: 'locked',
    buttonText: 'ACTIVATE PRO'
  },
  {
    id: 3,
    name: 'SOS Network',
    icon: '🚑',
    badge: 'Locked 🔒',
    description: 'Broadcast GPS location during accidents.',
    status: 'locked',
    buttonText: 'ACTIVATE PRO'
  },
  {
    id: 4,
    name: 'Smart Vault',
    icon: '🔒',
    badge: 'Locked 🔒',
    description: 'Encrypted storage for RC & DL.',
    status: 'locked',
    buttonText: 'ACTIVATE PRO'
  }
  
]

export const SERVICES = [
  {
    id: 'fastag-repair',
    name: 'Fastag Repair',
    icon: '🏷️',
    badge: 'Active ⚡',
    price: 500,
    buttonText: 'FIX AT ₹500',
    description: 'Fix Blacklist & Hotlist issues instantly.',
    formTitle: 'Fastag Re-activation',
    formDesc: 'Re-activate your Blacklisted or Hotlisted tags easily.'
  },
  {
    id: 'fastag-new',
    name: 'New Fastag',
    icon: '💳',
    badge: 'New ✨',
    price: 400,
    buttonText: 'GET AT ₹400',
    description: 'Get door-step tag issuance.',
    formTitle: 'Instant Tag Issuance',
    formDesc: 'Order a fresh Rakshak Fastag at your doorstep.'
  },
  {
    id: 'ev-charger',
    name: 'EV Station',
    icon: '🔌',
    badge: 'Eco 🔋',
    price: 'Inquiry',
    buttonText: 'INQUIRY NOW',
    description: 'Expert EV Charger Installation pan India.',
    formTitle: 'EV Station Inquiry',
    formDesc: 'Professional technical survey for your EV charger installation.'
  }
]

export const PROCESS_STEPS = [
  { icon: '📝', title: 'Register', desc: 'Fill vehicle details & select your QR design.' },
  { icon: '💳', title: 'Secure Pay', desc: 'UPI, Cards or Net Banking via safe gateway.' },
  { icon: '✨', title: 'Radium Print', desc: 'We print your custom tag on reflective material.' },
  { icon: '📦', title: 'Dispatch', desc: 'Courier tracking link sent on your WhatsApp.' },
  { icon: '🛡️', title: 'Activated', desc: 'Peel, Paste & enjoy 24/7 vehicle guardianship.' },
]

export const WHY_INDIA_NEEDS = [
  {
    id: 1,
    badge: 'ALARMING',
    title: '460+ Daily Deaths',
    description: 'India mein har din 460+ log accidents mein jaan gavaate hain. Rakshak inform karta hai family ko "Golden Hour" ke andar.',
    isAlert: true,
  },
  {
    id: 2,
    badge: 'ROAD RAGE',
    title: '30% Parking Disputes',
    description: 'NCRB ke mutabik, parking disputes aksar violence mein badal jate hain kyunki owner ka koi contact nahi hota.',
  },
  {
    id: 3,
    badge: 'CHALLAN',
    title: '20 Lakh+ Fines',
    description: 'Sirf ek saal mein ek shehar mein 20 lakh+ parking challan kat-te hain. Rakshak aapko police se pehle batata hai.',
  },
]

export const GOVT_REPORTS = [
  {
    label: '1. MoRTH Annual Report: Road Accidents in India (Official)',
    url: 'https://sansad.in/getFile/annex/269/AU1227_uqqpf0.pdf?source=pqars',
  },
  {
    label: '2. NCRB: Accidental Deaths & Road Rage Stats India',
    url: 'https://www.ncrb.gov.in/uploads/files/1ADSIPublication-2023.pdf',
  },
]

export const COMPARISON_TABLE = {
  headers: ['Features', 'LITE', 'PRO ✨'],
  rows: [
    { feature: 'QR Quality', lite: 'Sticker', pro: 'Premium Radium' },
    { feature: 'Parking Alert', lite: true, pro: true },
    { feature: 'Accidental SOS', lite: false, pro: true },
    { feature: 'Smart Vault', lite: false, pro: true },
    { feature: 'AI Expiry Alert', lite: false, pro: true },
  ],
}

export const CONTACT_INFO = {
  email: 'support@rakshak.com',
  phone: '+91 8700730344',
  whatsapp: '918700730344',
  office: 'Abhishek Technology India Private Limited'
}

export const BENEFIT_SLIDES = {
  love: [
    { title: 'NO Parking Drama', desc: 'Get polite alerts if you\'ve parked wrongly—no heated arguments, no awkward sticky notes. Rakshak sends a polite notification to the vehicle owner without any confrontation.', image: '' },
    { title: 'Privacy First', desc: 'Communicate safely without ever revealing your phone number. Your identity stays encrypted. No one can see your personal details—only Rakshak connects you securely.', image: '' },
    { title: 'Emergency Profiles', desc: 'In urgent cases, anyone can scan to see your blood group or contact family instantly. This can be life-saving during the Golden Hour after an accident.', image: '' },
    { title: 'Instant Updates', desc: 'Change your phone number anytime from your dashboard. One tag for life. No need to buy a new tag when you change your number or vehicle details.', image: '' },
    { title: 'No App Needed', desc: 'Anyone can scan using their phone camera. No apps, no downloads — just quick and easy access when it matters most.', image: '' },
    { title: 'Works for All', desc: 'Perfect for cars, bikes, trucks, or fleets. Manage all vehicles under one Rakshak account with a single dashboard.', image: '' },
    { title: 'Tough & Reflective', desc: 'Weather-proof tags designed for rain and sun. High-quality reflective radium material that glows at night for visibility.', image: '' },
    { title: 'Built for India', desc: 'Designed specifically for Indian roads, narrow lanes, and unique parking challenges. Made by Indians, for Indians.', image: '' },
  ],
  needs: [
    { title: '460+ Daily Deaths', desc: 'India records over 460 road accident deaths daily. Rakshak helps emergency responders contact your family within the Golden Hour—the critical time that can save lives.', image: '' },
    { title: '30% Parking Disputes', desc: 'According to NCRB data, parking disputes frequently escalate to violence because there is no way to contact the vehicle owner. Rakshak bridges this gap safely.', image: '' },
    { title: '20 Lakh+ Fines', desc: 'In just one year, a single city issues over 20 lakh parking challans. Rakshak alerts you before the police tow your vehicle, saving you from fines and hassle.', image: '' },
  ],
}
