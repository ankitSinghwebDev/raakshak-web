import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import './LoginModal.css'

const AdminLoginModal = ({ open, onClose }) => {
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')

  const handleClose = useCallback(() => {
    setEmpId('')
    setPassword('')
    onClose()
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Integrate admin authentication
    toast('Admin Dashboard coming soon!')
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        <div className="admin-icon">🛡️</div>
        <h2 className="admin-title">Admin <span className="text-orange">Portal</span></h2>
        <p className="admin-subtitle">Secure System Access</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label style={{ color: '#F28C38', letterSpacing: '1px', display: 'block', textAlign: 'left', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>EMPLOYEE ID</label>
            <input
              type="text"
              placeholder="ENTER ID"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              required
              className="admin-input"
            />
          </div>
          <div>
            <label style={{ color: '#F28C38', letterSpacing: '1px', display: 'block', textAlign: 'left', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>PASSWORD</label>
            <input
              type="password"
              placeholder="ENTER PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>
          <button type="submit" className="btn-modal-submit">
            Unlock Dashboard ➔
          </button>
        </form>
        <p className="modal-footer-text">Protected by Rakshak Encryption</p>
      </div>
    </div>
  )
}

export default AdminLoginModal
