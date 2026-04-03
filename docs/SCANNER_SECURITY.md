# Rakshak Scanner — Security & Architecture Documentation

**Version:** 1.0  
**Last Updated:** April 2026  
**Author:** Rakshak Engineering Team

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Security Architecture](#security-architecture)
4. [Scanner Flow (Step by Step)](#scanner-flow-step-by-step)
5. [Predefined Messages](#predefined-messages)
6. [Rate Limiting](#rate-limiting)
7. [Data Storage (Firebase)](#data-storage-firebase)
8. [Dashboard Scan Alerts](#dashboard-scan-alerts)
9. [Emergency SOS Flow](#emergency-sos-flow)
10. [Privacy Protections](#privacy-protections)
11. [Technical Implementation](#technical-implementation)
12. [File Reference](#file-reference)
13. [Future Enhancements (Phase 2 & 3)](#future-enhancements)

---

## Overview

The Rakshak Scanner is the public-facing page that opens when anyone scans a Rakshak QR code placed on a vehicle. It allows bystanders to **securely communicate** with the vehicle owner without ever seeing their phone number.

**URL Pattern:** `https://yourdomain.com/scan?id=RKSKXXXX`

**Key Principle:** The owner's personal information (phone number, WhatsApp, address) is **never exposed** to the person scanning the QR code.

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Person scans│────▶│ Scanner Page  │────▶│   Firebase   │────▶│  Owner sees  │
│  QR on car   │     │ (predefined  │     │  stores scan │     │  alert on    │
│              │     │  messages)   │     │  under their │     │  dashboard   │
└─────────────┘     └──────────────┘     │  account     │     └──────────────┘
                                          └──────────────┘
```

1. Scanner picks a predefined message (e.g., "Your vehicle is blocking my way")
2. Message is saved to Firebase under `scans/{ownerKey}`
3. Owner's `totalScans` counter increments
4. Owner sees the scan alert **in real-time** on their dashboard
5. Owner **chooses** whether to respond — their number is never shared

---

## Security Architecture

### What We Protect Against

| Threat | Protection |
|--------|-----------|
| **Phone number exposure** | Owner's number is never shown on scanner page. No `tel:` or `wa.me` links to owner. |
| **Spam / Harassment** | Rate limiting: max 3 messages/hour, 10/day per device. Device fingerprinting. |
| **Abusive content** | Only predefined messages allowed. No free-text input from scanner. |
| **Stalking via repeated scans** | Device fingerprint tracking. Scan logs with timestamps visible to owner. |
| **Fake emergency alerts** | SOS is the only action that contacts ICE directly. All other messages are stored, not forwarded. |

### What Is Exposed

| Data | Visible to Scanner? |
|------|---------------------|
| Vehicle number | ✅ Yes (visible on the car anyway) |
| Owner name | ❌ No |
| Owner phone | ❌ No |
| Owner WhatsApp | ❌ No |
| Emergency contact | ❌ No (only used in SOS flow, scanner doesn't see it) |
| Blood group / Medical info | ❌ No (only included in SOS WhatsApp to ICE contact) |

---

## Scanner Flow (Step by Step)

### Step 1: QR Scan → Page Load
- User scans QR code with phone camera
- Opens `https://domain.com/scan?id=RKSK2648`
- Page fetches vehicle data from Firebase using `generatedId`
- Shows: Rakshak logo, vehicle number, privacy notice

### Step 2: Choose Action
Scanner sees 3 options:
1. **🆘 SEND SOS ALERT** — For real emergencies only
2. **📞 GET IN TOUCH WITH OWNER** — Opens predefined message list
3. **🚔 POLICE (100) / 🚑 AMBULANCE (108)** — Direct emergency calls

### Step 3: Select Predefined Message
If "Get in Touch" is selected, scanner chooses from 5 fixed messages:
- Message is stored in Firebase (not sent directly)
- Confirmation screen: "✅ Message Sent! The vehicle owner has been notified securely via Rakshak."

### Step 4: Owner Notification
- Owner's dashboard shows the scan alert in real-time
- Total scan counter updates
- Owner decides whether to take action

---

## Predefined Messages

| ID | Icon | Message | Type | Severity |
|----|------|---------|------|----------|
| `blocking` | 🅿️ | Your vehicle is blocking my way | `parking` | Normal |
| `lights` | 💡 | Your lights / AC are on | `parking` | Normal |
| `towing` | 🚛 | Your car is being towed | `urgent` | High |
| `damage` | ⚠️ | Someone damaged your vehicle | `urgent` | High |
| `accident` | 🚨 | Accident / Medical Emergency | `emergency` | Critical |

**Why no free-text?** Free-text input enables abuse — profanity, threats, spam. Predefined messages cover 95%+ of real-world scenarios while eliminating all abusive content.

---

## Rate Limiting

### Client-Side Rate Limiting

```
Max 3 messages per device per hour
Max 10 messages per device per day
```

### Implementation

- **Device Fingerprint:** Generated on first visit, stored in `localStorage` as `rksk_fp`
  - Format: `fp_1712345678_a8b2c3d4ef`
  - Persists across page refreshes
  
- **Scan History:** Stored in `localStorage` as `rksk_scans`
  - Array of timestamps
  - Auto-cleaned: only last 24h of scans retained
  
- **Check before every message send:**
  1. Count scans from last 1 hour → if ≥ 3, block
  2. Count scans from last 24 hours → if ≥ 10, block
  3. Show "⏳ Too Many Attempts" screen with reason

### Limitations

- Client-side only — technically bypassable by clearing localStorage
- Phase 2 will add server-side rate limiting via Firebase Cloud Functions

---

## Data Storage (Firebase)

### Scan Records

**Path:** `scans/{customerKey}/{auto-generated-key}`

```json
{
  "message": "Your vehicle is blocking my way",
  "type": "parking",
  "deviceFingerprint": "fp_1712345678_a8b2c3d4ef",
  "timestamp": "2026-04-03T14:30:00.000Z"
}
```

### Customer Scan Count

**Path:** `customers/{customerKey}/totalScans`

```json
15
```

Incremented by +1 on each scan. Used for dashboard stats display.

### Firebase Database Rules (Recommended)

```json
{
  "rules": {
    "customers": {
      ".indexOn": ["mobile", "generatedId"],
      ".read": true,
      ".write": true
    },
    "scans": {
      "$customerId": {
        ".read": "auth != null || true",
        ".write": true
      }
    }
  }
}
```

---

## Dashboard Scan Alerts

### Real-Time Listener

The owner's dashboard uses Firebase `onValue` to listen for scan changes in real-time:

```javascript
onValue(ref(db, `scans/${currentUser.key}`), (snap) => {
  // Updates instantly when a new scan arrives
})
```

### What Owner Sees

- **Total Scans** counter in stats bar (live updates)
- **Recent Scan Alerts** section showing last 5 scans:
  - Message text
  - Timestamp (formatted: "03 Apr, 2:30 PM")
  - Type badge (color-coded: parking=orange, urgent=amber, emergency=red)
  - Type icon

### No Push Notifications (Current)

Currently, the owner must have the dashboard open to see real-time alerts. Phase 2 will add:
- Browser push notifications
- WhatsApp notification via Business API

---

## Emergency SOS Flow

The SOS button is the **only action** that directly contacts someone outside Rakshak.

### Flow

```
Scanner taps SOS
    │
    ▼
Does owner have ICE Contact 1?
    │
    ├── YES → Open WhatsApp to ICE contact with emergency message
    │         Message includes: vehicle number, owner name, medical info
    │
    └── NO  → Store scan in Firebase as emergency type
              Owner sees it on dashboard
```

### SOS WhatsApp Message Content

```
🆘 RAKSHAK EMERGENCY ALERT 🆘

Vehicle: HR 26 DS 95151
Owner: ANKIT SINGH
Rakshak ID: RKSK2648

⚠️ This vehicle needs immediate help.

MEDICAL INFO:
Blood Group: O+
Age: 28
Conditions: No Known Medical Condition

— Rakshak Emergency Response
```

### Why SOS Uses Direct WhatsApp

In a real accident/emergency, every second matters. Storing a message in Firebase and waiting for the owner to check their dashboard is not fast enough. The SOS goes directly to the **emergency contact (ICE)** — not to the owner — because the owner may be unconscious.

---

## Privacy Protections

### For Vehicle Owner

1. **Phone number never shown** — Scanner page has zero `tel:` or `wa.me` links to owner
2. **Name not displayed** — Only vehicle number is shown (already visible on the car)
3. **Masked number on dashboard** — Even on owner's own dashboard: `80●●●●0595`
4. **ICE contact protected** — Only used in SOS flow, never displayed to scanner

### For Scanner (Person Scanning)

1. **Device fingerprint is anonymous** — No personal data collected
2. **No login required** — Scanner doesn't need to create an account
3. **No location tracking** — GPS is not requested
4. **Scan history only local** — Stored in scanner's own localStorage, not uploaded

### Privacy Notice on Scanner Page

Visible green banner: "🔒 Owner's number is protected. Messages are delivered securely via Rakshak."

---

## Technical Implementation

### Key Files

| File | Purpose |
|------|---------|
| `src/components/Scanner/ScannerPage.jsx` | Main scanner page component |
| `src/components/Scanner/ScannerPage.css` | Scanner page styles |
| `src/components/Dashboard/UserDashboard.jsx` | Dashboard with live scan alerts |
| `src/components/Dashboard/UserDashboard.css` | Dashboard styles |
| `src/config/firebase.js` | Firebase config + exports |

### Dependencies

- **Firebase Realtime Database** — scan storage + real-time listeners
- **React Router** — `/scan` route with query parameter `?id=`
- **localStorage** — device fingerprint + rate limit tracking

### QR Code Generation

```javascript
// QR always points to current domain
const qrLink = `${window.location.origin}/scan?id=${currentUser.generatedId}`
const qrUrl = generateQRCodeUrl(qrLink, 200) // display
const qrUrlHD = generateQRCodeUrl(qrLink, 600) // print/download
```

QR is generated via `api.qrserver.com` — a free QR code API.

### Vercel SPA Routing

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Required so `/scan?id=RKSKXXXX` loads the React app instead of returning 404.

---

## File Reference

```
src/
├── components/
│   ├── Scanner/
│   │   ├── ScannerPage.jsx      # Scanner page with security
│   │   └── ScannerPage.css      # Scanner styles
│   └── Dashboard/
│       ├── UserDashboard.jsx     # Dashboard with scan alerts
│       └── UserDashboard.css     # Dashboard styles
├── config/
│   └── firebase.js               # Firebase config (onValue export)
└── router/
    └── AppRouter.jsx              # /scan route definition
```

---

## Future Enhancements

### Phase 2 — Server-Side Security

| Feature | Description |
|---------|-------------|
| **Scanner OTP verification** | Require scanner to verify their phone via OTP before sending message. Creates accountability. |
| **Server-side rate limiting** | Firebase Cloud Functions to enforce rate limits that can't be bypassed by clearing localStorage. |
| **Owner controls** | Pause QR (vacation mode), block specific device fingerprints, set quiet hours. |
| **Push notifications** | Browser notifications + WhatsApp Business API to notify owner of new scans. |

### Phase 3 — Advanced Protection

| Feature | Description |
|---------|-------------|
| **Rotating QR tokens** | QR URL contains a token that rotates server-side. Photographed/shared QR codes expire. Physical sticker stays same. |
| **Anomaly detection** | Flag repeated scans from same device across different days as potential stalking. Alert owner. |
| **Scan analytics** | Dashboard showing scan patterns — time of day, frequency, message types. |
| **Geofencing** | Owner sets "home zone" — scans outside this zone get extra verification. |

---

## Summary

The Rakshak Scanner implements a **privacy-first communication bridge** between vehicle owners and bystanders. No personal information is exposed. All communication is controlled through predefined messages, rate-limited, and logged for the owner's visibility.

**Core principle:** The person scanning should be able to help — but never able to harass.

---

*This document is part of the Rakshak project. For questions, contact the development team.*
