import React, { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { RAZORPAY_KEY, TAG_PRICES, COMPARISON_TABLE } from '../../utils/constants'
import { validateMobileNumber, generateQRCodeUrl, buildPublicSiteUrl } from '../../utils/helpers'
import { db, ref, push, set, get, update, query, orderByChild, equalTo, increment } from '../../config/firebase'
import useBodyLock from '../../hooks/useBodyLock'
import './RegistrationModal.css'

const RegistrationModal = ({ open, onClose, onSuccess, onOpenStudio }) => {
  useBodyLock(open)
  const [ownerName, setOwnerName] = useState('')
  const [vehicleNum, setVehicleNum] = useState('')
  const [mobileNum, setMobileNum] = useState('')
  const [whatsappNum, setWhatsappNum] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' })
  const [isCouponApplied, setIsCouponApplied] = useState(false)
  const [appliedCouponMeta, setAppliedCouponMeta] = useState(null)
  const [isCustomQR, setIsCustomQR] = useState(false)
  const [tcChecked, setTcChecked] = useState(false)
  const [mobileError, setMobileError] = useState(false)
  const [whatsappError, setWhatsappError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const activePrice = isCustomQR ? TAG_PRICES.PREMIUM : TAG_PRICES.SIMPLE

  const resetForm = useCallback(() => {
    setOwnerName('')
    setVehicleNum('')
    setMobileNum('')
    setWhatsappNum('')
    setCouponCode('')
    setCouponMsg({ text: '', type: '' })
    setIsCouponApplied(false)
    setAppliedCouponMeta(null)
    setIsCustomQR(false)
    setTcChecked(false)
    setMobileError(false)
    setWhatsappError(false)
    setSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const getUrlReferralCode = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return (urlParams.get('ref') || urlParams.get('coupon') || '').trim().toUpperCase()
  }, [])

  const handleApplyCoupon = useCallback(async (overrideCode = '') => {
    const code = (overrideCode || couponCode).trim().toUpperCase()
    const urlCode = getUrlReferralCode()

    if (!code) {
      setIsCouponApplied(false)
      setAppliedCouponMeta(null)
      setCouponMsg({ text: '❌ Enter a valid code first.', type: 'error' })
      return
    }

    if (code === 'WTRAK01') {
      setIsCouponApplied(true)
      setAppliedCouponMeta({
        source: 'team_code',
        entry: urlCode === code ? 'qr_link' : 'manual_code',
        partnerKey: null,
        partnerCode: null,
        partnerName: null,
        partnerShop: null,
        partnerComm: 0,
      })
      setCouponMsg({ text: '🎉 Team code applied successfully!', type: 'success' })
      return
    }

    try {
      const partnersRef = ref(db, 'partners')
      const partnerQuery = query(partnersRef, orderByChild('code'), equalTo(code))
      const partnerSnap = await get(partnerQuery)

      if (!partnerSnap.exists()) {
        setIsCouponApplied(false)
        setAppliedCouponMeta(null)
        setCouponMsg({ text: '❌ Invalid partner code. Please enter a valid dealer ID.', type: 'error' })
        return
      }

      const partnerKey = Object.keys(partnerSnap.val())[0]
      const partnerData = Object.values(partnerSnap.val())[0]
      if ((partnerData.status || 'active') === 'inactive') {
        setIsCouponApplied(false)
        setAppliedCouponMeta(null)
        setCouponMsg({ text: '❌ This partner code is inactive right now.', type: 'error' })
        return
      }

      const fromPartnerQr = Boolean(urlCode) && urlCode === code
      setIsCouponApplied(true)
      setAppliedCouponMeta({
        source: fromPartnerQr ? 'partner_qr' : 'partner_code',
        entry: fromPartnerQr ? 'qr_link' : 'manual_code',
        partnerKey,
        partnerCode: code,
        partnerName: partnerData.name || '',
        partnerShop: partnerData.shop || '',
        partnerComm: Number(partnerData.comm) || 0,
        urlCode: urlCode || null,
      })
      setCouponMsg({
        text: fromPartnerQr
          ? `🎉 ${partnerData.shop || partnerData.name} referral linked successfully!`
          : `🎉 Partner code applied for ${partnerData.shop || partnerData.name}!`,
        type: 'success',
      })
    } catch (err) {
      console.error('Coupon validation error:', err)
      setIsCouponApplied(false)
      setAppliedCouponMeta(null)
      setCouponMsg({ text: '❌ Unable to verify code right now. Please try again.', type: 'error' })
    }
  }, [couponCode, getUrlReferralCode])

  useEffect(() => {
    if (!open) return
    const urlCode = getUrlReferralCode()
    if (!urlCode) return
    setCouponCode(urlCode)
    handleApplyCoupon(urlCode)
  }, [open, getUrlReferralCode])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isCouponApplied) {
      toast.error('Pehle Coupon Code (WTRAK01) / Dealer ID apply karo!')
      return
    }

    let hasError = false
    if (mobileNum.length !== 10 || !validateMobileNumber(mobileNum)) {
      setMobileError(true)
      hasError = true
    }
    if (whatsappNum.length !== 10 || !validateMobileNumber(whatsappNum)) {
      setWhatsappError(true)
      hasError = true
    }
    if (hasError) return

    setSubmitting(true)
    const vehicle = vehicleNum.toUpperCase()
    const appliedCoupon = couponCode.trim().toUpperCase()

    // Save to Firebase after successful payment
    const saveToFirebase = async (paymentId) => {
      const customersRef = ref(db, 'customers')
      const generatedID = 'RKSK' + Math.floor(1000 + Math.random() * 9000)
      const newCustomerRef = push(customersRef)

      const qrLink = buildPublicSiteUrl('/scan', { id: generatedID })
      const urlReferralCode = getUrlReferralCode()

      const formData = {
        generatedId: generatedID,
        name: ownerName.toUpperCase(),
        vehicle: vehicle,
        mobile: mobileNum,
        whatsapp: whatsappNum,
        plan: isCustomQR ? 'Premium Studio' : 'Lite Plan',
        amount: activePrice,
        paymentId: paymentId,
        coupon: appliedCoupon,
        partnerCode: appliedCouponMeta?.partnerCode || null,
        partnerKey: appliedCouponMeta?.partnerKey || null,
        referredByName: appliedCouponMeta?.partnerName || null,
        referredByShop: appliedCouponMeta?.partnerShop || null,
        registrationSource: appliedCouponMeta?.source || (appliedCoupon === 'WTRAK01' ? 'team_code' : 'partner_code'),
        registrationEntry: appliedCouponMeta?.entry || 'manual_code',
        referralUrlCode: urlReferralCode || null,
        status: 'Paid',
        qrLink: qrLink,
        timestamp: new Date().toISOString(),
      }

      await set(newCustomerRef, formData)

      return { generatedID, qrLink }
    }

    // PRODUCTION: Razorpay payment
    const amountInPaise = activePrice * 100

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Project Rakshak',
      description: `Secure Registration for ${vehicle}`,
      image: 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
      handler: async function (response) {
        try {
          const { generatedID, qrLink } = await saveToFirebase(response.razorpay_payment_id)

          // Partner stats auto-update
          if (appliedCouponMeta?.partnerKey) {
            await update(ref(db, `partners/${appliedCouponMeta.partnerKey}`), {
              totalSales: increment(1),
              totalRevenue: increment(activePrice),
              pendingComm: increment(appliedCouponMeta.partnerComm || 0),
            })
          }

          // Generate QR URL from stored link
          const qrUrl = generateQRCodeUrl(qrLink, 150)

          resetForm()
          onClose()
          if (onSuccess) {
            onSuccess({
              generatedId: generatedID,
              vehicleNum: vehicle,
              qrUrl: qrUrl,
            })
          }
        } catch (err) {
          console.error('Firebase Error:', err)
          toast.error('Database error! Payment ID: ' + response.razorpay_payment_id)
          setSubmitting(false)
        }
      },
      prefill: { name: ownerName, contact: mobileNum },
      theme: { color: '#F28C38' },
      modal: {
        ondismiss: function () {
          setSubmitting(false)
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        <h2 className="reg-title">Register Your Vehicle</h2>
        <p className="reg-tagline">HAR GAADI KA GUARDIAN</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Owner Name */}
          <div className="input-container">
            <label>Owner Name</label>
            <input
              type="text"
              placeholder="Enter Name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>

          {/* Vehicle Number */}
          <div className="input-container">
            <label>Vehicle Number</label>
            <input
              type="text"
              placeholder="e.g. MH 12 AB 1234"
              value={vehicleNum}
              onChange={(e) => setVehicleNum(e.target.value.toUpperCase())}
              required
            />
          </div>

          {/* Mobile Number */}
          <div className="input-container">
            <label>Mobile Number</label>
            {mobileError && <span className="error-text">Invalid</span>}
            <input
              type="text"
              placeholder="Enter Mobile Number"
              maxLength={10}
              value={mobileNum}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setMobileNum(val)
                setMobileError(false)
              }}
              inputMode="numeric"
              required
            />
          </div>

          {/* WhatsApp Number */}
          <div className="input-container">
            <label>WhatsApp Number</label>
            {whatsappError && <span className="error-text">Invalid</span>}
            <input
              type="text"
              placeholder="Enter WhatsApp Number"
              maxLength={10}
              value={whatsappNum}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setWhatsappNum(val)
                setWhatsappError(false)
              }}
              inputMode="numeric"
              required
            />
          </div>

          {/* Coupon Code */}
          <div className="coupon-container">
            <label className="coupon-label">Coupon Code-WTRAK01</label>
            <div className="coupon-row">
              <input
                type="text"
                placeholder="Enter WTRAK01 or Dealer ID"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase())
                  setIsCouponApplied(false)
                  setAppliedCouponMeta(null)
                  setCouponMsg({ text: '', type: '' })
                }}
                className="coupon-input"
                required
              />
              <button type="button" className="coupon-apply-btn" onClick={() => handleApplyCoupon()}>
                APPLY
              </button>
            </div>
            {couponMsg.text && (
              <p className={`coupon-msg ${couponMsg.type}`}>{couponMsg.text}</p>
            )}
          </div>

          {/* QR Selection */}
          <div className="qr-selection">
            <button
              type="button"
              className={`qr-option-btn ${!isCustomQR ? 'active-qr' : ''}`}
              onClick={() => setIsCustomQR(false)}
            >
              SIMPLE QR ⬛
            </button>
            <button
              type="button"
              className={`qr-option-btn ${isCustomQR ? 'active-qr' : ''}`}
              onClick={() => {
                setIsCustomQR(true)
                if (onOpenStudio) onOpenStudio()
              }}
            >
              🎨 PREMIUM STUDIO
            </button>
          </div>

          {/* Comparison Table */}
          <div className="comparison-container">
            <table>
              <thead>
                <tr>
                  {COMPARISON_TABLE.headers.map((h, i) => (
                    <th key={i} className={i === 2 ? 'pro-header' : i === 1 ? 'lite-header' : ''}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="feature-name">{row.feature}</td>
                    <td className="check-cell">
                      {typeof row.lite === 'boolean' ? (
                        row.lite ? <span className="check-yes">✅</span> : <span className="check-no">❌</span>
                      ) : (
                        <span className="text-muted">{row.lite}</span>
                      )}
                    </td>
                    <td className="check-cell">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <span className="check-yes">✅</span> : <span className="check-no">❌</span>
                      ) : (
                        <span className="text-white">{row.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* T&C */}
          <div className="tc-container">
            <input
              type="checkbox"
              id="tc-checkbox"
              checked={tcChecked}
              onChange={(e) => setTcChecked(e.target.checked)}
              required
            />
            <label htmlFor="tc-checkbox" className="tc-label">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> of Rakshak.
            </label>
          </div>

          {/* Price Display */}
          <div className="price-display">
            <p>₹{activePrice} FOR 2 QR CARDS</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-submit-reg"
            disabled={!isCouponApplied || submitting}
            style={{
              opacity: isCouponApplied ? 1 : 0.5,
              cursor: isCouponApplied ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting
              ? 'Opening Secure Gateway...'
              : isCouponApplied
              ? `PAY ₹${activePrice} SECURELY`
              : 'APPLY CODE FIRST'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegistrationModal
