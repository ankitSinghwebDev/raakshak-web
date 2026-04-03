import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { db, ref, get, set } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import './SmartVaultModal.css'

const SmartVaultModal = ({ open, onClose }) => {
  const { currentUser } = useAppContext()

  // Screens: 'auth' | 'setup' | 'vault'
  const [screen, setScreen] = useState('auth')
  const [hasPin, setHasPin] = useState(null) // null = loading
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if user has a vault PIN when modal opens
  useEffect(() => {
    if (!open || !currentUser?.key) return

    const checkPin = async () => {
      setHasPin(null)
      try {
        const vaultRef = ref(db, `customers/${currentUser.key}/vault`)
        const snap = await get(vaultRef)
        if (snap.exists() && snap.val().pin) {
          setHasPin(true)
          setScreen('auth')
        } else {
          setHasPin(false)
          setScreen('setup')
        }
      } catch {
        setHasPin(false)
        setScreen('setup')
      }
    }

    checkPin()
    setMobile('')
    setPin('')
    setConfirmPin('')
    setError('')
  }, [open, currentUser?.key])

  const handleClose = useCallback(() => {
    setScreen('auth')
    setMobile('')
    setPin('')
    setConfirmPin('')
    setError('')
    onClose()
  }, [onClose])

  // ===== SETUP PIN =====
  const handleSetupPin = async (e) => {
    e.preventDefault()
    setError('')

    if (pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setLoading(true)
    try {
      const vaultRef = ref(db, `customers/${currentUser.key}/vault`)
      await set(vaultRef, {
        pin: pin,
        createdAt: new Date().toISOString(),
        documents: {},
      })
      setHasPin(true)
      setScreen('auth')
      setPin('')
      setConfirmPin('')
      toast.success('Vault PIN created successfully!')
    } catch (err) {
      console.error('Setup error:', err)
      setError('Failed to create PIN. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== AUTH WITH PIN =====
  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')

    if (mobile !== currentUser.mobile) {
      setError('Mobile number does not match')
      return
    }
    if (pin.length !== 4) {
      setError('Enter your 4-digit PIN')
      return
    }

    setLoading(true)
    try {
      const vaultRef = ref(db, `customers/${currentUser.key}/vault`)
      const snap = await get(vaultRef)
      if (snap.exists() && snap.val().pin === pin) {
        setScreen('vault')
        setPin('')
        setMobile('')
      } else {
        setError('Incorrect PIN. Try again.')
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  // Loading state
  if (hasPin === null) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content sv-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sv-loading">Loading Smart Vault...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content sv-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>

        {/* ===== SETUP SCREEN ===== */}
        {screen === 'setup' && (
          <div className="sv-screen">
            <div className="sv-header">
              <div className="sv-icon">🔐</div>
              <h2>Create Vault PIN</h2>
              <p>Set a 4-digit PIN to secure your documents</p>
            </div>
            <form onSubmit={handleSetupPin}>
              <div className="sv-field">
                <label>CREATE 4-DIGIT PIN</label>
                <input
                  type="password"
                  placeholder="● ● ● ●"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-pin-input"
                />
              </div>
              <div className="sv-field">
                <label>CONFIRM PIN</label>
                <input
                  type="password"
                  placeholder="● ● ● ●"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-pin-input"
                />
              </div>
              {error && <p className="sv-error">{error}</p>}
              <button type="submit" className="sv-submit" disabled={loading}>
                {loading ? 'Creating...' : 'CREATE VAULT PIN ➔'}
              </button>
            </form>
          </div>
        )}

        {/* ===== AUTH SCREEN ===== */}
        {screen === 'auth' && (
          <div className="sv-screen">
            <div className="sv-header">
              <div className="sv-icon">🔒</div>
              <h2>Unlock Smart Vault</h2>
              <p>Enter your mobile & PIN to access documents</p>
            </div>
            <form onSubmit={handleAuth}>
              <div className="sv-field">
                <label>REGISTERED MOBILE</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-input"
                />
              </div>
              <div className="sv-field">
                <label>4-DIGIT PIN</label>
                <input
                  type="password"
                  placeholder="● ● ● ●"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError('') }}
                  inputMode="numeric"
                  required
                  className="sv-pin-input"
                />
              </div>
              {error && <p className="sv-error">{error}</p>}
              <button type="submit" className="sv-submit" disabled={loading}>
                {loading ? 'Verifying...' : 'UNLOCK VAULT ➔'}
              </button>
            </form>
          </div>
        )}

        {/* ===== VAULT SCREEN ===== */}
        {screen === 'vault' && (
          <div className="sv-screen">
            <div className="sv-header">
              <div className="sv-icon">🛡️</div>
              <h2>Smart Vault</h2>
              <p>Your encrypted document storage</p>
            </div>

            <div className="sv-vault-grid">
              <div className="sv-doc-card">
                <div className="sv-doc-icon">📄</div>
                <h4>Registration Certificate (RC)</h4>
                <p>Not uploaded</p>
                <button className="sv-doc-btn" disabled>COMING SOON</button>
              </div>
              <div className="sv-doc-card">
                <div className="sv-doc-icon">🪪</div>
                <h4>Driving License (DL)</h4>
                <p>Not uploaded</p>
                <button className="sv-doc-btn" disabled>COMING SOON</button>
              </div>
              <div className="sv-doc-card">
                <div className="sv-doc-icon">📋</div>
                <h4>Insurance Policy</h4>
                <p>Not uploaded</p>
                <button className="sv-doc-btn" disabled>COMING SOON</button>
              </div>
              <div className="sv-doc-card">
                <div className="sv-doc-icon">🌿</div>
                <h4>PUC Certificate</h4>
                <p>Not uploaded</p>
                <button className="sv-doc-btn" disabled>COMING SOON</button>
              </div>
            </div>

            <div className="sv-vault-footer">
              <span>🔐</span> End-to-end encrypted storage by Rakshak
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SmartVaultModal
