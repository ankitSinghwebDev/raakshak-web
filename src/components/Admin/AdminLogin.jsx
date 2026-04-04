import { useState } from 'react'
<<<<<<< HEAD
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LockOutlined, IdcardOutlined, LoadingOutlined, HomeOutlined, MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { db, ref, get, functions, httpsCallable } from '../../config/firebase'
import { verifyPassword, hashPassword } from '../../utils/hashPassword'
import PasswordInput from '../ui/PasswordInput'
import logoImg from '../../assets/icons/Rakshak.jpg'
import './Admin.css'

const AdminLogin = ({ onLogin }) => {
  // Login state
=======
import toast from 'react-hot-toast'
import { SafetyCertificateOutlined, LockOutlined, IdcardOutlined, LoadingOutlined } from '@ant-design/icons'
import { db, ref, get } from '../../config/firebase'
import { verifyPassword } from '../../utils/hashPassword'
import './Admin.css'

const AdminLogin = ({ onLogin }) => {
>>>>>>> main
  const [empId, setEmpId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

<<<<<<< HEAD
  // Forgot password state
  const [screen, setScreen] = useState('login') // login | forgot | otp | reset
  const [forgotEmpId, setForgotEmpId] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fpLoading, setFpLoading] = useState(false)

  // ===== LOGIN =====
=======
>>>>>>> main
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!empId || !password) return
    setLoading(true)

    try {
<<<<<<< HEAD
      const snap = await get(ref(db, 'admins'))
      if (snap.exists()) {
        const admins = snap.val()
        let matchKey = null, matchData = null
        for (const [key, admin] of Object.entries(admins)) {
          if (admin.empId?.toLowerCase() !== empId.toLowerCase()) continue
          const isValid = await verifyPassword(password, admin.password)
          if (isValid) { matchKey = key; matchData = admin; break }
=======
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
>>>>>>> main
        }

        if (matchKey && matchData) {
          if (matchData.status === 'suspended') {
<<<<<<< HEAD
            toast.error('Account suspended. Contact Super Admin.')
            setLoading(false)
            return
          }
          const adminData = { key: matchKey, ...matchData, loginTime: new Date().toISOString() }
=======
            toast.error('Your account has been suspended. Contact Super Admin.')
            setLoading(false)
            return
          }

          const adminData = { key: matchKey, ...matchData, loginTime: new Date().toISOString() }
          // Don't store password hash in session
>>>>>>> main
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
<<<<<<< HEAD
      console.error('Login error:', err)
=======
      console.error('Admin login error:', err)
>>>>>>> main
      toast.error('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  // ===== SEND OTP =====
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!forgotEmpId) return
    setFpLoading(true)

    try {
      const sendOTP = httpsCallable(functions, 'sendAdminOTP')
      const result = await sendOTP({ empId: forgotEmpId })

      if (result.data.success) {
        setMaskedEmail(result.data.maskedEmail)
        setAdminKey(result.data.adminKey)
        setScreen('otp')
        toast.success(`OTP sent to ${result.data.maskedEmail}`)
      }
    } catch (err) {
      const msg = err.message || 'Failed to send OTP'
      // If Cloud Functions not deployed, show helpful message
      if (msg.includes('not-found') || msg.includes('internal')) {
        toast.error(msg)
      } else {
        toast.error('Could not send OTP. Make sure Cloud Functions are deployed.')
      }
    } finally {
      setFpLoading(false)
    }
  }

  // ===== VERIFY OTP =====
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setScreen('reset')
  }

  // ===== RESET PASSWORD =====
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    setFpLoading(true)

    try {
      const hashedPwd = await hashPassword(newPassword)
      const verifyOTP = httpsCallable(functions, 'verifyAdminOTP')
      const result = await verifyOTP({ adminKey, otp, newPasswordHash: hashedPwd })

      if (result.data.success) {
        toast.success('Password reset successfully! Please login.')
        resetForgotState()
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setFpLoading(false)
    }
  }

  const resetForgotState = () => {
    setScreen('login')
    setForgotEmpId('')
    setMaskedEmail('')
    setAdminKey('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setFpLoading(false)
  }

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-icon"><img src={logoImg} alt="Rakshak" className="adm-login-logo" /></div>

        {/* ===== LOGIN SCREEN ===== */}
        {screen === 'login' && (
          <>
            <h1>Rakshak Admin</h1>
            <p>Secure System Access</p>

            <form onSubmit={handleSubmit}>
              <div className="adm-field">
                <label><IdcardOutlined /> EMPLOYEE ID</label>
                <input type="text" value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="Enter ID" required />
              </div>
              <div className="adm-field">
                <label><LockOutlined /> PASSWORD</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Password" required />
              </div>
              <button type="submit" className="adm-login-btn" disabled={loading}>
                {loading ? <><LoadingOutlined /> Verifying...</> : <><LockOutlined /> Unlock Dashboard</>}
              </button>
            </form>

            <button className="adm-forgot-link" onClick={() => setScreen('forgot')}>
              Forgot Password?
            </button>

            <p className="adm-login-footer">Protected by Rakshak Encryption</p>
            <Link to="/" className="adm-home-link"><HomeOutlined /> Visit Rakshak Website</Link>
          </>
        )}

        {/* ===== FORGOT PASSWORD SCREEN ===== */}
        {screen === 'forgot' && (
          <>
            <h1>Reset Password</h1>
            <p>Enter your Employee ID to receive OTP</p>

            <form onSubmit={handleSendOTP}>
              <div className="adm-field">
                <label><IdcardOutlined /> EMPLOYEE ID</label>
                <input type="text" value={forgotEmpId} onChange={(e) => setForgotEmpId(e.target.value)} placeholder="Enter your Employee ID" required />
              </div>
              <button type="submit" className="adm-login-btn" disabled={fpLoading}>
                {fpLoading ? <><LoadingOutlined /> Sending OTP...</> : <><MailOutlined /> Send OTP to Email</>}
              </button>
            </form>

            <button className="adm-forgot-link" onClick={resetForgotState}>
              <ArrowLeftOutlined /> Back to Login
            </button>
          </>
        )}

        {/* ===== OTP VERIFICATION SCREEN ===== */}
        {screen === 'otp' && (
          <>
            <h1>Verify OTP</h1>
            <p>OTP sent to <span style={{ color: '#F28C38' }}>{maskedEmail}</span></p>

            <form onSubmit={handleVerifyOTP}>
              <div className="adm-field">
                <label><MailOutlined /> 6-DIGIT OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  className="adm-otp-input"
                />
              </div>
              <button type="submit" className="adm-login-btn" disabled={otp.length !== 6}>
                Verify OTP ➔
              </button>
            </form>

            <p className="adm-otp-timer">Code expires in 10 minutes</p>

            <button className="adm-forgot-link" onClick={() => setScreen('forgot')}>
              <ArrowLeftOutlined /> Resend OTP
            </button>
          </>
        )}

        {/* ===== NEW PASSWORD SCREEN ===== */}
        {screen === 'reset' && (
          <>
            <h1>New Password</h1>
            <p>Set your new admin password</p>

            <form onSubmit={handleResetPassword}>
              <div className="adm-field">
                <label><LockOutlined /> NEW PASSWORD</label>
                <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" required />
              </div>
              <div className="adm-field">
                <label><LockOutlined /> CONFIRM PASSWORD</label>
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
              </div>
              <button type="submit" className="adm-login-btn" disabled={fpLoading}>
                {fpLoading ? <><LoadingOutlined /> Resetting...</> : <><LockOutlined /> Reset Password</>}
              </button>
            </form>

            <button className="adm-forgot-link" onClick={resetForgotState}>
              <ArrowLeftOutlined /> Back to Login
            </button>
          </>
        )}
=======
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
>>>>>>> main
      </div>
    </div>
  )
}

export default AdminLogin
