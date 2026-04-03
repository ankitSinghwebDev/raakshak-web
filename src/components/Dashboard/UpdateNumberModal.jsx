import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { db, ref, update } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import './UpdateNumberModal.css'

const UpdateNumberModal = ({ open, onClose }) => {
  const { currentUser, loginUser } = useAppContext()
  const [oldNumber, setOldNumber] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Auto-populate when modal opens
  useEffect(() => {
    if (open && currentUser) {
      setOldNumber(currentUser.mobile || '')
      setWhatsappNumber(currentUser.whatsapp || '')
    }
  }, [open, currentUser])

  const resetForm = useCallback(() => {
    setOldNumber('')
    setNewNumber('')
    setWhatsappNumber('')
    setError('')
    setSaving(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validations
    if (oldNumber.length !== 10 || newNumber.length !== 10 || whatsappNumber.length !== 10) {
      setError('All numbers must be 10 digits')
      return
    }

    if (oldNumber !== currentUser.mobile) {
      setError('Old number does not match your registered number')
      return
    }

    if (oldNumber === newNumber) {
      setError('New number cannot be the same as old number')
      return
    }

    setSaving(true)
    try {
      const customerRef = ref(db, `customers/${currentUser.key}`)
      await update(customerRef, {
        mobile: newNumber,
        whatsapp: whatsappNumber,
        numberUpdatedAt: new Date().toISOString(),
      })

      // Update local user state
      loginUser({
        ...currentUser,
        mobile: newNumber,
        whatsapp: whatsappNumber,
      })

      toast.success('Number updated successfully!')
      handleClose()
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content update-num-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>

        <div className="un-header">
          <div className="un-icon">⚙️</div>
          <h2>Update Number</h2>
          <p>Change your registered mobile & WhatsApp number</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="un-field">
            <label>OLD MOBILE NUMBER</label>
            <input
              type="text"
              placeholder="Enter current registered number"
              maxLength={10}
              value={oldNumber}
              onChange={(e) => { setOldNumber(e.target.value.replace(/\D/g, '')); setError('') }}
              inputMode="numeric"
              required
            />
          </div>

          <div className="un-arrow">↓</div>

          <div className="un-field">
            <label>NEW MOBILE NUMBER</label>
            <input
              type="text"
              placeholder="Enter new mobile number"
              maxLength={10}
              value={newNumber}
              onChange={(e) => { setNewNumber(e.target.value.replace(/\D/g, '')); setError('') }}
              inputMode="numeric"
              required
            />
          </div>

          <div className="un-field">
            <label>WHATSAPP NUMBER</label>
            <input
              type="text"
              placeholder="Enter WhatsApp number"
              maxLength={10}
              value={whatsappNumber}
              onChange={(e) => { setWhatsappNumber(e.target.value.replace(/\D/g, '')); setError('') }}
              inputMode="numeric"
              required
            />
          </div>

          {error && <p className="un-error">{error}</p>}

          <button type="submit" className="un-submit" disabled={saving}>
            {saving ? 'Updating...' : 'UPDATE NUMBER ➔'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UpdateNumberModal
