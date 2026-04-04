import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  UserOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  MobileOutlined,
  IdcardOutlined,
  LockOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { db, ref, get, query, orderByChild, equalTo } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import { verifyPassword } from '../../utils/hashPassword'
import useBodyLock from '../../hooks/useBodyLock'
import useTranslation from '../../i18n/useTranslation'
import PasswordInput from '../ui/PasswordInput'
import logoImg from '../../assets/icons/Rakshak.jpg'
import './LoginModal.css'

const ROLE_TABS = [
  { id: 'user', icon: <UserOutlined />, labelKey: 'authTabUser' },
  { id: 'partner', icon: <ShopOutlined />, labelKey: 'authTabPartner' },
  { id: 'admin', icon: <SafetyCertificateOutlined />, labelKey: 'authTabAdmin' },
]

const AuthPortalModal = ({ open, onClose, defaultRole = 'user' }) => {
  useBodyLock(open)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { loginUser } = useAppContext()

  const [activeRole, setActiveRole] = useState(defaultRole)

  const [mobile, setMobile] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')

  const [partnerId, setPartnerId] = useState('')
  const [partnerPassword, setPartnerPassword] = useState('')
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [partnerError, setPartnerError] = useState('')

  const [empId, setEmpId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')

  const resetState = useCallback(() => {
    setActiveRole(defaultRole)
    setMobile('')
    setUserLoading(false)
    setUserError('')
    setPartnerId('')
    setPartnerPassword('')
    setPartnerLoading(false)
    setPartnerError('')
    setEmpId('')
    setAdminPassword('')
    setAdminLoading(false)
    setAdminError('')
  }, [defaultRole])

  useEffect(() => {
    if (open) {
      setActiveRole(defaultRole)
    }
  }, [defaultRole, open])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  const switchRole = useCallback((role) => {
    setActiveRole(role)
    setUserError('')
    setPartnerError('')
    setAdminError('')
  }, [])

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    if (mobile.length !== 10) {
      setUserError(t('loginErrorInvalid'))
      return
    }

    setUserLoading(true)
    setUserError('')

    try {
      const customersRef = ref(db, 'customers')
      const mobileQuery = query(customersRef, orderByChild('mobile'), equalTo(mobile))
      const snapshot = await get(mobileQuery)

      if (!snapshot.exists()) {
        setUserError(t('loginErrorNotFound'))
        return
      }

      const data = snapshot.val()
      const customerKey = Object.keys(data)[0]
      const customer = data[customerKey]

      loginUser({
        key: customerKey,
        ...customer,
      })

      handleClose()
      navigate('/dashboard')
    } catch (err) {
      console.error('Login Error:', err)
      setUserError(t('loginErrorConnection'))
    } finally {
      setUserLoading(false)
    }
  }

  const handlePartnerSubmit = async (e) => {
    e.preventDefault()
    if (!partnerId || !partnerPassword) {
      setPartnerError(t('authErrorFillBoth'))
      return
    }

    setPartnerLoading(true)
    setPartnerError('')

    try {
      const partnersRef = ref(db, 'partners')
      const partnerQuery = query(partnersRef, orderByChild('code'), equalTo(partnerId.toUpperCase()))
      const snapshot = await get(partnerQuery)

      if (!snapshot.exists()) {
        setPartnerError(t('authPartnerNotFound'))
        return
      }

      const [partnerKey, partnerData] = Object.entries(snapshot.val())[0]

      if (partnerData.status && partnerData.status !== 'active') {
        setPartnerError(t('authPartnerInactive'))
        return
      }

      if (!partnerData.password) {
        setPartnerError(t('authPartnerNoAccess'))
        return
      }

      const isValid = await verifyPassword(partnerPassword, partnerData.password)
      if (!isValid) {
        setPartnerError(t('authErrorInvalidCredentials'))
        return
      }

      const partnerSession = {
        key: partnerKey,
        ...partnerData,
        loginTime: new Date().toISOString(),
      }
      delete partnerSession.password
      sessionStorage.setItem('rakshak_partner', JSON.stringify(partnerSession))

      handleClose()
      toast.success(t('authPartnerSuccess'))
    } catch (err) {
      console.error('Partner login error:', err)
      setPartnerError(t('loginErrorConnection'))
    } finally {
      setPartnerLoading(false)
    }
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    if (!empId || !adminPassword) {
      setAdminError(t('authErrorFillBoth'))
      return
    }

    setAdminLoading(true)
    setAdminError('')

    try {
      const snap = await get(ref(db, 'admins'))

      if (!snap.exists()) {
        setAdminError(t('authAdminMissing'))
        return
      }

      const admins = snap.val()
      let matchKey = null
      let matchData = null

      for (const [key, admin] of Object.entries(admins)) {
        if (admin.empId?.toLowerCase() !== empId.toLowerCase()) continue
        const isValid = await verifyPassword(adminPassword, admin.password)
        if (isValid) {
          matchKey = key
          matchData = admin
          break
        }
      }

      if (!matchKey || !matchData) {
        setAdminError(t('authErrorInvalidCredentials'))
        return
      }

      if (matchData.status === 'suspended') {
        setAdminError(t('authAdminSuspended'))
        return
      }

      const adminData = { key: matchKey, ...matchData, loginTime: new Date().toISOString() }
      delete adminData.password
      sessionStorage.setItem('rakshak_admin', JSON.stringify(adminData))

      toast.success(`${t('authAdminWelcome')} ${matchData.name || t('authTabAdmin')}!`)
      handleClose()
      navigate('/admin')
    } catch (err) {
      console.error('Admin login error:', err)
      setAdminError(t('loginErrorConnection'))
    } finally {
      setAdminLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="auth-portal-modal glass-effect"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-portal-title"
      >
        <button
          type="button"
          className="close-btn modal-close-button"
          onClick={handleClose}
          aria-label={t('authCloseLabel')}
        >
          &times;
        </button>

        <div className="auth-portal-brand">
          <img src={logoImg} alt="Rakshak" className="auth-portal-logo" />
          <div>
            <p className="auth-portal-kicker">{t('authPortalKicker')}</p>
            <h2 id="auth-portal-title" className="auth-portal-title">{t('authPortalTitle')}</h2>
          </div>
        </div>

        <p className="auth-portal-subtitle">{t('authPortalSubtitle')}</p>

        <div className="auth-role-tabs" role="tablist" aria-label={t('authPortalTitle')}>
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`auth-role-tab ${activeRole === tab.id ? 'auth-role-tab-active' : ''}`}
              onClick={() => switchRole(tab.id)}
            >
              {tab.icon}
              <span>{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>

        {activeRole === 'user' && (
          <form onSubmit={handleUserSubmit} autoComplete="off" className="auth-panel">
            <div className="auth-panel-header">
              <div className="auth-panel-icon"><MobileOutlined /></div>
              <div>
                <h3>{t('authUserTitle')}</h3>
                <p>{t('authUserSubtitle')}</p>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">{t('authLabelMobile')}</label>
              <input
                type="text"
                placeholder={t('loginPlaceholder')}
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ''))
                  setUserError('')
                }}
                inputMode="numeric"
                required
                className="auth-input auth-input-emphasis"
              />
            </div>

            {userError && <p className="login-error">{userError}</p>}

            <button type="submit" className="btn-login-submit" disabled={userLoading}>
              {userLoading ? <><LoadingOutlined /> {t('loginVerifying')}</> : t('loginSubmit')}
            </button>
          </form>
        )}

        {activeRole === 'partner' && (
          <form onSubmit={handlePartnerSubmit} autoComplete="off" className="auth-panel">
            <div className="auth-panel-header">
              <div className="auth-panel-icon"><ShopOutlined /></div>
              <div>
                <h3>{t('authPartnerTitle')}</h3>
                <p>{t('authPartnerSubtitle')}</p>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">{t('authLabelPartnerId')}</label>
              <input
                type="text"
                placeholder={t('authPartnerIdPlaceholder')}
                value={partnerId}
                onChange={(e) => {
                  setPartnerId(e.target.value.toUpperCase())
                  setPartnerError('')
                }}
                required
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">{t('authLabelPassword')}</label>
              <PasswordInput
                placeholder={t('authPartnerPasswordPlaceholder')}
                value={partnerPassword}
                onChange={(e) => {
                  setPartnerPassword(e.target.value)
                  setPartnerError('')
                }}
                required
                className="auth-input"
              />
            </div>

            {partnerError && <p className="login-error">{partnerError}</p>}

            <button type="submit" className="btn-modal-submit" disabled={partnerLoading}>
              {partnerLoading ? <><LoadingOutlined /> {t('loginVerifying')}</> : t('authPartnerSubmit')}
            </button>
          </form>
        )}

        {activeRole === 'admin' && (
          <form onSubmit={handleAdminSubmit} autoComplete="off" className="auth-panel">
            <div className="auth-panel-header">
              <div className="auth-panel-icon"><SafetyCertificateOutlined /></div>
              <div>
                <h3>{t('authAdminTitle')}</h3>
                <p>{t('authAdminSubtitle')}</p>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label"><IdcardOutlined /> {t('authLabelEmployeeId')}</label>
              <input
                type="text"
                placeholder={t('authAdminIdPlaceholder')}
                value={empId}
                onChange={(e) => {
                  setEmpId(e.target.value)
                  setAdminError('')
                }}
                required
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label"><LockOutlined /> {t('authLabelPassword')}</label>
              <PasswordInput
                placeholder={t('authAdminPasswordPlaceholder')}
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value)
                  setAdminError('')
                }}
                required
                className="auth-input"
              />
            </div>

            {adminError && <p className="login-error">{adminError}</p>}

            <button type="submit" className="btn-modal-submit" disabled={adminLoading}>
              {adminLoading ? <><LoadingOutlined /> {t('loginVerifying')}</> : <><LockOutlined /> {t('authAdminSubmit')}</>}
            </button>
          </form>
        )}

        <p className="modal-footer-text">{t('loginFooter')}</p>
      </div>
    </div>
  )
}

export default AuthPortalModal
