import { useState } from 'react'
import toast from 'react-hot-toast'
import { SafetyCertificateOutlined, LockOutlined, IdcardOutlined, LoadingOutlined } from '@ant-design/icons'
import { db, ref, get } from '../../config/firebase'
import { verifyPassword } from '../../utils/hashPassword'
import './Admin.css'

const AdminLogin = ({ onLogin }) => {
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!empId || !password) return
    setLoading(true)

    try {
      const adminRef = ref(db, 'admins')
      const snap = await get(adminRef)

      if (snap.exists()) {
        const admins = snap.val()

        // Find admin by empId (case-insensitive)
        let matchKey = null, matchData = null
        for (const [key, admin] of Object.entries(admins)) {
          if (admin.empId?.toLowerCase() !== empId.toLowerCase()) continue

          // Verify hashed password
          const isValid = await verifyPassword(password, admin.password)
          if (isValid) {
            matchKey = key
            matchData = admin
            break
          }
        }

        if (matchKey && matchData) {
          if (matchData.status === 'suspended') {
            toast.error('Your account has been suspended. Contact Super Admin.')
            setLoading(false)
            return
          }

          const adminData = { key: matchKey, ...matchData, loginTime: new Date().toISOString() }
          // Don't store password hash in session
          delete adminData.password
          sessionStorage.setItem('rakshak_admin', JSON.stringify(adminData))
          onLogin(adminData)
          toast.success(`Welcome, ${matchData.name || 'Admin'}!`)
        } else {
          toast.error('Invalid credentials')
        }
      } else {
        toast.error('Admin system not configured')
      }
    } catch (err) {
      console.error('Admin login error:', err)
      toast.error('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-icon"><SafetyCertificateOutlined /></div>
        <h1>Rakshak Admin</h1>
        <p>Secure System Access</p>

        <form onSubmit={handleSubmit}>
          <div className="adm-field">
            <label><IdcardOutlined /> EMPLOYEE ID</label>
            <input type="text" value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="Enter ID" required />
          </div>
          <div className="adm-field">
            <label><LockOutlined /> PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password" required />
          </div>
          <button type="submit" className="adm-login-btn" disabled={loading}>
            {loading ? <><LoadingOutlined /> Verifying...</> : <><LockOutlined /> Unlock Dashboard</>}
          </button>
        </form>
        <p className="adm-login-footer">Protected by Rakshak Encryption</p>
      </div>
    </div>
  )
}

export default AdminLogin
