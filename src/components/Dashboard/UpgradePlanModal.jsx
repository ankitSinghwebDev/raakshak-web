import { useState } from 'react'
import toast from 'react-hot-toast'
import { RAZORPAY_KEY, COMPARISON_TABLE } from '../../utils/constants'
import { db, ref, update } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import './UpgradePlanModal.css'

const PLANS = [
  {
    id: 'premium',
    name: 'Simple QR Code',
    price: 199,
    icon: '✨',
    desc: 'Radium reflective QR with premium card design',
    features: ['Premium Radium QR', 'Parking Alert', 'Accidental SOS', 'Smart Vault', 'AI Expiry Alert'],
  },
  {
    id: 'studio',
    name: 'Premium Studio',
    price: 299,
    icon: '🎨',
    desc: 'Custom photo card with premium QR design',
    features: ['Custom Photo Card', 'Premium Radium QR', 'All Pro Features', 'Priority Support', 'Dashboard Access'],
  },
]

const UpgradePlanModal = ({ open, onClose }) => {
  const { currentUser, loginUser } = useAppContext()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [processing, setProcessing] = useState(false)

  const handleClose = () => {
    setSelectedPlan(null)
    setProcessing(false)
    onClose()
  }

  const handleUpgrade = () => {
    if (!selectedPlan) return

    const plan = PLANS.find((p) => p.id === selectedPlan)
    if (!plan) return

    setProcessing(true)
    const amountInPaise = plan.price * 100

    const options = {
      key: RAZORPAY_KEY,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Rakshak Upgrade',
      description: `Upgrade to ${plan.name} for ${currentUser.vehicle}`,
      image: 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
      handler: async function (response) {
        try {
          const customerRef = ref(db, `customers/${currentUser.key}`)
          const newPlan = plan.id === 'studio' ? 'Premium Studio' : 'Custom QR'

          await update(customerRef, {
            plan: newPlan,
            upgradePaymentId: response.razorpay_payment_id,
            upgradedAt: new Date().toISOString(),
            upgradeAmount: plan.price,
          })

          loginUser({
            ...currentUser,
            plan: newPlan,
          })

          toast.success('Upgrade successful! Premium tools unlocked.')
          handleClose()
        } catch (err) {
          console.error('Upgrade error:', err)
          toast.error('Database error! Payment ID: ' + response.razorpay_payment_id)
        } finally {
          setProcessing(false)
        }
      },
      prefill: { name: currentUser.name, contact: currentUser.mobile },
      theme: { color: '#F28C38' },
      modal: {
        ondismiss: function () {
          setProcessing(false)
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>

        <div className="up-header">
          <div className="up-icon">🚀</div>
          <h2>Upgrade to <span className="up-highlight">Pro</span></h2>
          <p>Unlock all premium tools & features</p>
        </div>

        {/* Plan Cards */}
        <div className="up-plans">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`up-plan-card ${selectedPlan === plan.id ? 'up-plan-selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="up-plan-top">
                <span className="up-plan-icon">{plan.icon}</span>
                <h3>{plan.name}</h3>
                <p className="up-plan-desc">{plan.desc}</p>
              </div>
              <div className="up-plan-price">
                <span className="up-rupee">₹</span>
                <span className="up-amount">{plan.price}</span>
              </div>
              <ul className="up-plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}><span className="up-check">✅</span> {f}</li>
                ))}
              </ul>
              {selectedPlan === plan.id && (
                <div className="up-selected-badge">SELECTED</div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="up-comparison">
          <p className="up-comparison-title">FEATURE COMPARISON</p>
          <table>
            <thead>
              <tr>
                {COMPARISON_TABLE.headers.map((h, i) => (
                  <th key={i} className={i === 2 ? 'up-pro-th' : ''}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_TABLE.rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.feature}</td>
                  <td className="up-cell-center">
                    {typeof row.lite === 'boolean'
                      ? (row.lite ? '✅' : '❌')
                      : row.lite}
                  </td>
                  <td className="up-cell-center">
                    {typeof row.pro === 'boolean'
                      ? (row.pro ? '✅' : '❌')
                      : <span style={{ color: '#fff' }}>{row.pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pay Button */}
        <button
          className="up-pay-btn"
          disabled={!selectedPlan || processing}
          onClick={handleUpgrade}
        >
          {processing
            ? 'Opening Payment...'
            : selectedPlan
            ? `PAY ₹${PLANS.find((p) => p.id === selectedPlan)?.price} & UPGRADE ➔`
            : 'SELECT A PLAN ABOVE'}
        </button>
      </div>
    </div>
  )
}

export default UpgradePlanModal
