import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { db, ref, get, push, set, query, orderByChild, equalTo } from '../../config/firebase'
import './ScannerPage.css'

const PREDEFINED_MESSAGES = [
  { id: 'blocking', icon: '🅿️', label: 'Your vehicle is blocking my way', type: 'parking' },
  { id: 'lights', icon: '💡', label: 'Your lights / AC are on', type: 'parking' },
  { id: 'towing', icon: '🚛', label: 'Your car is being towed', type: 'urgent' },
  { id: 'damage', icon: '⚠️', label: 'Someone damaged your vehicle', type: 'urgent' },
  { id: 'accident', icon: '🚨', label: 'Accident / Medical Emergency', type: 'emergency' },
]

const RATE_LIMIT = { maxPerHour: 3, maxPerDay: 10 }

const getDeviceFingerprint = () => {
  let fp = localStorage.getItem('rksk_fp')
  if (!fp) {
    fp = 'fp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10)
    localStorage.setItem('rksk_fp', fp)
  }
  return fp
}

const checkRateLimit = () => {
  const now = Date.now()
  const scans = JSON.parse(localStorage.getItem('rksk_scans') || '[]')
  const hourAgo = now - 3600000
  const dayAgo = now - 86400000
  const hourScans = scans.filter((t) => t > hourAgo)
  const dayScans = scans.filter((t) => t > dayAgo)

  if (hourScans.length >= RATE_LIMIT.maxPerHour) return { blocked: true, reason: 'Too many attempts. Please try again in an hour.' }
  if (dayScans.length >= RATE_LIMIT.maxPerDay) return { blocked: true, reason: 'Daily limit reached. Please try again tomorrow.' }
  return { blocked: false }
}

const recordScan = () => {
  const scans = JSON.parse(localStorage.getItem('rksk_scans') || '[]')
  scans.push(Date.now())
  // Keep only last 24h of scans
  const dayAgo = Date.now() - 86400000
  localStorage.setItem('rksk_scans', JSON.stringify(scans.filter((t) => t > dayAgo)))
}

const ScannerPage = () => {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [userKey, setUserKey] = useState(null)
  const [error, setError] = useState('')
  const [screen, setScreen] = useState('main') // main | messages | sent | rate-limited
  const [sending, setSending] = useState(false)

  // Fetch user data
  useEffect(() => {
    if (!id) { setError('Invalid QR Code'); setLoading(false); return }

    const fetchUser = async () => {
      try {
        const customersRef = ref(db, 'customers')
        let found = false
        try {
          const q = query(customersRef, orderByChild('generatedId'), equalTo(id))
          const snap = await get(q)
          if (snap.exists()) {
            const data = snap.val()
            const key = Object.keys(data)[0]
            setUserData(data[key])
            setUserKey(key)
            found = true
          }
        } catch {
          // Fallback if no index
          const allSnap = await get(customersRef)
          if (allSnap.exists()) {
            const allData = allSnap.val()
            const matchKey = Object.keys(allData).find((k) => allData[k].generatedId === id)
            if (matchKey) {
              setUserData(allData[matchKey])
              setUserKey(matchKey)
              found = true
            }
          }
        }
        if (!found) setError('Vehicle not found')
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Connection error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  // Send predefined message → store in Firebase (no direct number exposure)
  const handleSendMessage = async (msg) => {
    const rateCheck = checkRateLimit()
    if (rateCheck.blocked) {
      setError(rateCheck.reason)
      setScreen('rate-limited')
      return
    }

    setSending(true)
    try {
      const scanRef = ref(db, `scans/${userKey}`)
      await push(scanRef, {
        message: msg.label,
        type: msg.type,
        deviceFingerprint: getDeviceFingerprint(),
        timestamp: new Date().toISOString(),
      })

      // Also update scan count on customer
      const customerRef = ref(db, `customers/${userKey}`)
      const snap = await get(customerRef)
      const currentScans = snap.val()?.totalScans || 0
      await set(ref(db, `customers/${userKey}/totalScans`), currentScans + 1)

      recordScan()
      setScreen('sent')
    } catch (err) {
      console.error('Send error:', err)
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Emergency — direct WhatsApp to ICE contact (only for real emergencies)
  const handleEmergencySOS = () => {
    if (!userData) return
    const rateCheck = checkRateLimit()
    if (rateCheck.blocked) { setError(rateCheck.reason); setScreen('rate-limited'); return }

    const iceContact = userData.emergency?.iceContact1
    if (iceContact) {
      const emergency = userData.emergency || {}
      const medicalInfo = [
        emergency.bloodGroup && emergency.bloodGroup !== 'Select' ? `Blood Group: ${emergency.bloodGroup}` : '',
        emergency.age ? `Age: ${emergency.age}` : '',
        emergency.conditions?.length ? `Conditions: ${emergency.conditions.join(', ')}` : '',
      ].filter(Boolean).join('\n')

      const msg = `🆘 RAKSHAK EMERGENCY ALERT 🆘\n\nVehicle: ${userData.vehicle}\nOwner: ${userData.name}\nRakshak ID: ${userData.generatedId}\n\n⚠️ This vehicle needs immediate help.\n\n${medicalInfo ? `MEDICAL INFO:\n${medicalInfo}\n\n` : ''}— Rakshak Emergency Response`
      recordScan()
      window.location.href = `https://api.whatsapp.com/send?phone=91${iceContact}&text=${encodeURIComponent(msg)}`
    } else {
      // No ICE contact — log in Firebase
      handleSendMessage({ label: 'EMERGENCY SOS — No ICE contact set', type: 'emergency' })
    }
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="scan-page">
        <div className="scan-card">
          <div className="scan-logo-wrap">
            <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" alt="Rakshak" className="scan-logo" />
          </div>
          <h2 className="scan-brand">RAKSHAK</h2>
          <p className="scan-brand-sub">EMERGENCY RESPONSE SYSTEM</p>
          <div className="scan-loading">
            <div className="scan-spinner" />
            <p>FETCHING...</p>
          </div>
        </div>
      </div>
    )
  }

  // ===== ERROR =====
  if (error && screen !== 'rate-limited') {
    return (
      <div className="scan-page">
        <div className="scan-card">
          <div className="scan-logo-wrap">
            <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" alt="Rakshak" className="scan-logo" />
          </div>
          <h2 className="scan-brand">RAKSHAK</h2>
          <p className="scan-brand-sub">EMERGENCY RESPONSE SYSTEM</p>
          <div className="scan-error-box"><p>{error}</p></div>
          <div className="scan-promo">
            <div className="scan-promo-left">
              <span className="scan-promo-label">GET YOURS</span>
              <span className="scan-promo-name">SMART QR</span>
            </div>
            <Link to="/" className="scan-promo-btn">BUY NOW</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="scan-page">
      <div className="scan-card">
        {/* Header */}
        <div className="scan-logo-wrap">
          <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" alt="Rakshak" className="scan-logo" />
        </div>
        <h2 className="scan-brand">RAKSHAK</h2>
        <p className="scan-brand-sub">EMERGENCY RESPONSE SYSTEM</p>

        {/* Vehicle Number */}
        <div className="scan-vehicle-box">
          <span className="scan-vehicle-num">{userData.vehicle}</span>
        </div>

        {/* Privacy Notice */}
        <div className="scan-privacy-notice">
          <span>🔒</span> Owner's number is protected. Messages are delivered securely via Rakshak.
        </div>

        {/* ===== MAIN SCREEN ===== */}
        {screen === 'main' && (
          <>
            {/* SOS Button */}
            <button className="scan-sos-btn" onClick={handleEmergencySOS}>
              <span className="scan-sos-icon">🆘</span>
              <span>SEND SOS ALERT</span>
            </button>

            {/* Contact via predefined messages */}
            <button className="scan-contact-btn" onClick={() => setScreen('messages')}>
              <span>📞</span> GET IN TOUCH WITH OWNER
            </button>

            {/* Emergency Services */}
            <div className="scan-emergency-row">
              <a href="tel:100" className="scan-em-btn"><span>🚔</span> POLICE (100)</a>
              <a href="tel:108" className="scan-em-btn"><span>🚑</span> AMBULANCE (108)</a>
            </div>
          </>
        )}

        {/* ===== MESSAGE SELECTION ===== */}
        {screen === 'messages' && (
          <div className="scan-messages-screen">
            <p className="scan-msg-title">What's the situation?</p>
            <p className="scan-msg-subtitle">Select a message to send to the vehicle owner</p>

            <div className="scan-msg-list">
              {PREDEFINED_MESSAGES.map((msg) => (
                <button
                  key={msg.id}
                  className={`scan-msg-btn scan-msg-${msg.type}`}
                  onClick={() => handleSendMessage(msg)}
                  disabled={sending}
                >
                  <span className="scan-msg-icon">{msg.icon}</span>
                  <span>{msg.label}</span>
                </button>
              ))}
            </div>

            <button className="scan-back-btn" onClick={() => setScreen('main')}>← Back</button>
          </div>
        )}

        {/* ===== SENT CONFIRMATION ===== */}
        {screen === 'sent' && (
          <div className="scan-sent-screen">
            <div className="scan-sent-icon">✅</div>
            <h3>Message Sent!</h3>
            <p>The vehicle owner has been notified securely via Rakshak. They will respond if needed.</p>
            <button className="scan-done-btn" onClick={() => setScreen('main')}>Done</button>
          </div>
        )}

        {/* ===== RATE LIMITED ===== */}
        {screen === 'rate-limited' && (
          <div className="scan-sent-screen">
            <div className="scan-sent-icon">⏳</div>
            <h3>Too Many Attempts</h3>
            <p>{error}</p>
            <button className="scan-done-btn" onClick={() => { setError(''); setScreen('main') }}>OK</button>
          </div>
        )}

        {/* Promo */}
        <div className="scan-promo">
          <div className="scan-promo-left">
            <span className="scan-promo-label">GET YOURS</span>
            <span className="scan-promo-name">SMART QR</span>
          </div>
          <Link to="/" className="scan-promo-btn">BUY NOW</Link>
        </div>

        <p className="scan-footer">&copy; 2026 ABHISHEK TECHNOLOGY INDIA PRIVATE LIMITED</p>
      </div>
    </div>
  )
}

export default ScannerPage
