import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { SafetyCertificateOutlined, IdcardOutlined, LockOutlined, LoadingOutlined } from '@ant-design/icons'
import { db, ref, get } from '../../config/firebase'
import { verifyPassword } from '../../utils/hashPassword'
import useBodyLock from '../../hooks/useBodyLock'
import './LoginModal.css'

const AdminLoginModal = ({ open, onClose }) => {
  useBodyLock(open)
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    setEmpId('')
    setPassword('')
    setError('')
    setLoading(false)
    onClose()
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!empId || !password) {
      setError('Please fill both fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const snap = await get(ref(db, 'admins'))

      if (snap.exists()) {
        const admins = snap.val()

        let matchKey = null, matchData = null
        for (const [key, admin] of Object.entries(admins)) {
          if (admin.empId?.toLowerCase() !== empId.toLowerCase()) continue
          const isValid = await verifyPassword(password, admin.password)
          if (isValid) {
            matchKey = key
            matchData = admin
            break
          }
        }

        if (matchKey && matchData) {
          if (matchData.status === 'suspended') {
            setError('Your account has been suspended. Contact Super Admin.')
            setLoading(false)
            return
          }

          const adminData = { key: matchKey, ...matchData, loginTime: new Date().toISOString() }
          delete adminData.password
          sessionStorage.setItem('rakshak_admin', JSON.stringify(adminData))

          toast.success(`Welcome, ${matchData.name || 'Admin'}!`)
          handleClose()
          navigate('/admin')
        } else {
          setError('Invalid credentials')
        }
      } else {
        setError('Admin system not configured')
      }
    } catch (err) {
      console.error('Admin login error:', err)
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        <div className="admin-icon"><SafetyCertificateOutlined /></div>
        <h2 className="admin-title">Admin <span className="text-orange">Portal</span></h2>
        <p className="admin-subtitle">Secure Administrator Access</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label style={{ color: '#F28C38', letterSpacing: '1px', display: 'block', textAlign: 'left', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>
              <IdcardOutlined /> EMPLOYEE ID
            </label>
            <input
              type="text"
              placeholder="ENTER EMPLOYEE ID"
              value={empId}
              onChange={(e) => { setEmpId(e.target.value); setError('') }}
              required
              className="admin-input"
            />
          </div>
          <div>
            <label style={{ color: '#F28C38', letterSpacing: '1px', display: 'block', textAlign: 'left', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>
              <LockOutlined /> PASSWORD
            </label>
            <input
              type="password"
              placeholder="ENTER PASSWORD"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              required
              className="admin-input"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-modal-submit" disabled={loading}>
            {loading ? <><LoadingOutlined /> Verifying...</> : <><LockOutlined /> Unlock Dashboard</>}
          </button>
        </form>
        <p className="modal-footer-text">Protected by Rakshak Encryption</p>
      </div>
    </div>
  )
}

export default AdminLoginModal
