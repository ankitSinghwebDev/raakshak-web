import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import './LoginModal.css'

const PartnerLoginModal = ({ open, onClose }) => {
  const [partnerId, setPartnerId] = useState('')
  const [password, setPassword] = useState('')

  const handleClose = useCallback(() => {
    setPartnerId('')
    setPassword('')
    onClose()
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Integrate partner authentication
    toast('Partner Dashboard coming soon!')
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="partner-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        <div className="partner-icon">🚀</div>
        <h2 className="partner-title">Welcome <span className="text-orange">Partner</span></h2>
        <p className="partner-subtitle">Har Gaadi Ka Guardian Hub</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="PARTNER ID"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            required
            className="partner-input"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="partner-input"
          />
          <button type="submit" className="btn-modal-submit">
            Login To Portal ➔
          </button>
        </form>
        <p className="modal-footer-text">Protected by Rakshak Encryption</p>
      </div>
    </div>
  )
}

export default PartnerLoginModal
