import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { db, ref, get, query, orderByChild, equalTo } from '../../config/firebase'
import './ScannerPage.css'

const ScannerPage = () => {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [error, setError] = useState('')
  const [contactMode, setContactMode] = useState(null) // null | 'options' | 'wrongParking' | 'accident'

  // Fetch user data by Rakshak ID
  useEffect(() => {
    if (!id) {
      setError('Invalid QR Code')
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        // Try query by generatedId first
        const customersRef = ref(db, 'customers')
        let snap
        try {
          const q = query(customersRef, orderByChild('generatedId'), equalTo(id))
          snap = await get(q)
        } catch (queryErr) {
          // If index not set, fallback: fetch all and filter
          console.warn('Index query failed, using fallback:', queryErr.message)
          const allSnap = await get(customersRef)
          if (allSnap.exists()) {
            const allData = allSnap.val()
            const matchKey = Object.keys(allData).find(k => allData[k].generatedId === id)
            if (matchKey) {
              setUserData({ key: matchKey, ...allData[matchKey] })
              setLoading(false)
              return
            }
          }
          setError('Vehicle not found')
          setLoading(false)
          return
        }

        if (snap.exists()) {
          const data = snap.val()
          const key = Object.keys(data)[0]
          setUserData({ key, ...data[key] })
        } else {
          setError('Vehicle not found')
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Connection error. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  // Build WhatsApp URL — use location.href so mobile browsers don't block it
  const sendWhatsApp = (number, message) => {
    const encoded = encodeURIComponent(message)
    const url = `https://api.whatsapp.com/send?phone=91${number}&text=${encoded}`
    window.location.href = url
  }

  const handleWrongParking = () => {
    if (!userData) return
    // Parking alerts go to OWNER's WhatsApp/mobile — not emergency contact
    const contactNum = userData.whatsapp || userData.mobile
    const msg = `🚨 RAKSHAK PARKING ALERT 🚨\n\nVehicle: ${userData.vehicle}\n\nYour vehicle is causing a parking issue. Please move it as soon as possible.\n\n— Sent via Rakshak QR Scan`
    sendWhatsApp(contactNum, msg)
  }

  const handleAccidentAlert = () => {
    if (!userData) return
    // Accident/Emergency alerts go to ICE contact first
    const contactNum = userData.emergency?.iceContact1 || userData.whatsapp || userData.mobile
    const emergency = userData.emergency || {}
    const medicalInfo = [
      emergency.bloodGroup && emergency.bloodGroup !== 'Select' ? `Blood Group: ${emergency.bloodGroup}` : '',
      emergency.age ? `Age: ${emergency.age}` : '',
      emergency.conditions?.length ? `Conditions: ${emergency.conditions.join(', ')}` : '',
    ].filter(Boolean).join('\n')

    const msg = `🆘 RAKSHAK EMERGENCY ALERT 🆘\n\nVehicle: ${userData.vehicle}\nOwner: ${userData.name}\n\n⚠️ This vehicle has been involved in an accident/emergency.\n\n${medicalInfo ? `MEDICAL INFO:\n${medicalInfo}\n\n` : ''}Please respond immediately.\n\n— Sent via Rakshak Emergency Scan`
    sendWhatsApp(contactNum, msg)
  }

  const handleSOS = () => {
    if (!userData) return
    const contactNum = userData.emergency?.iceContact1 || userData.whatsapp || userData.mobile
    const msg = `🚨🚨 SOS ALERT — RAKSHAK 🚨🚨\n\nVehicle: ${userData.vehicle}\nOwner: ${userData.name}\nRakshak ID: ${userData.generatedId}\n\nThis is an emergency SOS alert triggered by a QR scan. The vehicle owner may need immediate help.\n\nPlease contact them or emergency services immediately.\n\n— Rakshak Emergency Response System`
    sendWhatsApp(contactNum, msg)
  }

  const handleCallOwner = () => {
    if (!userData) return
    const contactNum = userData.whatsapp || userData.mobile
    window.location.href = `https://api.whatsapp.com/send?phone=91${contactNum}`
  }

  // Loading
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

  // Error
  if (error) {
    return (
      <div className="scan-page">
        <div className="scan-card">
          <div className="scan-logo-wrap">
            <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" alt="Rakshak" className="scan-logo" />
          </div>
          <h2 className="scan-brand">RAKSHAK</h2>
          <p className="scan-brand-sub">EMERGENCY RESPONSE SYSTEM</p>
          <div className="scan-error-box">
            <p>{error}</p>
          </div>
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

        {/* SOS Button */}
        <button className="scan-sos-btn" onClick={handleSOS}>
          <span className="scan-sos-icon">🆘</span>
          <span>SEND SOS ALERT</span>
        </button>

        {/* Contact Options */}
        {contactMode === null ? (
          <>
            {/* Get in Touch */}
            <button className="scan-contact-btn" onClick={() => setContactMode('options')}>
              <span>📞</span> GET IN TOUCH WITH OWNER
            </button>
          </>
        ) : contactMode === 'options' ? (
          <div className="scan-options">
            <p className="scan-options-title">What's the situation?</p>
            <button className="scan-option-btn scan-option-parking" onClick={handleWrongParking}>
              <span>🅿️</span> Wrong Parking
            </button>
            <button className="scan-option-btn scan-option-accident" onClick={handleAccidentAlert}>
              <span>🚨</span> Accident / Emergency
            </button>
            <button className="scan-option-back" onClick={() => setContactMode(null)}>
              ← Back
            </button>
          </div>
        ) : null}

        {/* Direct Buttons */}
        <button className="scan-call-btn" onClick={handleCallOwner}>
          <span>📞</span> CALL OWNER
        </button>
        <button className="scan-wa-btn" onClick={handleCallOwner}>
          <span>💬</span> WHATSAPP
        </button>

        {/* Emergency Services */}
        <div className="scan-emergency-row">
          <a href="tel:100" className="scan-em-btn">
            <span>🚔</span> POLICE (100)
          </a>
          <a href="tel:108" className="scan-em-btn">
            <span>🚑</span> AMBULANCE (108)
          </a>
        </div>

        {/* Promo */}
        <div className="scan-promo">
          <div className="scan-promo-left">
            <span className="scan-promo-label">GET YOURS</span>
            <span className="scan-promo-name">SMART QR</span>
          </div>
          <Link to="/" className="scan-promo-btn">BUY NOW</Link>
        </div>

        {/* Footer */}
        <p className="scan-footer">&copy; 2026 ABHISHEK TECHNOLOGY INDIA PRIVATE LIMITED</p>
      </div>
    </div>
  )
}

export default ScannerPage
