import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { generateQRCodeUrl } from '../../utils/helpers'
import EmergencyModal from './EmergencyModal'
import UpdateNumberModal from './UpdateNumberModal'
import UpgradePlanModal from './UpgradePlanModal'
import SmartVaultModal from './SmartVaultModal'
import './UserDashboard.css'

const isPremiumUser = (plan) => {
  return plan === 'Premium Studio' || plan === 'Custom QR'
}

const UserDashboard = () => {
  const { currentUser, logoutUser } = useAppContext()
  const navigate = useNavigate()
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [updateNumOpen, setUpdateNumOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [vaultOpen, setVaultOpen] = useState(false)

  const handleLogout = useCallback(() => {
    logoutUser()
    navigate('/')
  }, [logoutUser, navigate])

  if (!currentUser) return null

  const isProUser = isPremiumUser(currentUser.plan)

  const handleToolClick = () => {
    if (!isProUser) {
      setUpgradeOpen(true)
    }
  }

  // Always use current domain for QR — fixes localhost QR codes
  const qrLink = `${window.location.origin}/scan?id=${currentUser.generatedId}`
  const qrUrl = generateQRCodeUrl(qrLink, 200)

  const regDate = currentUser.timestamp
    ? new Date(currentUser.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="db">
      {/* Ambient glow */}
      <div className="db-glow" />

      {/* ===== NAVBAR ===== */}
      <nav className="db-nav">
        <div className="db-nav-brand">
          <img
            src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png"
            alt="Rakshak"
            className="db-nav-logo"
          />
          <div>
            <span className="db-nav-name">RAKSHAK</span>
            <span className="db-nav-sub">HAR GAADI KA GUARDIAN</span>
          </div>
        </div>
        <button className="db-nav-logout" onClick={handleLogout}>LOGOUT</button>
      </nav>

      {/* ===== HERO CARD ===== */}
      <section className="db-hero">
        <div className="db-hero-left">
          <p className="db-hero-greeting">Welcome back,</p>
          <h1 className="db-hero-name">{currentUser.name}</h1>
          <div className="db-hero-vehicle">
            <span className="db-hero-vnum">{currentUser.vehicle}</span>
            <span className="db-hero-id">{currentUser.generatedId}</span>
          </div>
          <p className="db-hero-mobile">📞 +91 {currentUser.mobile}</p>
        </div>
        <div className="db-hero-right">
          <div className="db-shield">
            <span className="db-shield-ring" />
            <span className="db-shield-dot" />
            <span className="db-shield-text">SHIELD<br />ACTIVE</span>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="db-stats">
        <div className="db-stat">
          <div className="db-stat-icon-wrap blue">
            <span>👁️</span>
          </div>
          <div>
            <p className="db-stat-num">0</p>
            <p className="db-stat-lbl">Total Scans</p>
          </div>
        </div>
        <div className="db-stat">
          <div className="db-stat-icon-wrap green">
            <span>🛡️</span>
          </div>
          <div>
            <p className="db-stat-num">Active</p>
            <p className="db-stat-lbl">Protection</p>
          </div>
        </div>
        <div className="db-stat">
          <div className="db-stat-icon-wrap orange">
            <span>📦</span>
          </div>
          <div>
            <p className="db-stat-num">{currentUser.plan || '—'}</p>
            <p className="db-stat-lbl">Plan</p>
          </div>
        </div>
        <div className="db-stat">
          <div className="db-stat-icon-wrap purple">
            <span>📅</span>
          </div>
          <div>
            <p className="db-stat-num">{regDate}</p>
            <p className="db-stat-lbl">Registered</p>
          </div>
        </div>
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="db-section">
        <h3 className="db-section-title">Quick Control Panel</h3>
        <div className="db-actions">
          <button className="db-action" onClick={() => setUpdateNumOpen(true)}>
            <div className="db-action-icon">⚙️</div>
            <span>Update No.</span>
          </button>
          <button className="db-action db-action--emergency" onClick={() => setEmergencyOpen(true)}>
            <div className="db-action-icon">🚨</div>
            <span>Emergency</span>
          </button>
          <button className="db-action">
            <div className="db-action-icon">🚗</div>
            <span>My Vehicles</span>
          </button>
          <button className="db-action">
            <div className="db-action-icon">💬</div>
            <span>Support</span>
          </button>
        </div>
      </section>

      {/* ===== PREMIUM TOOLS ===== */}
      <section className="db-section">
        <h3 className="db-section-title">
          Rakshak Premium Tools
          {!isProUser && <span className="db-pro-tag">UPGRADE TO UNLOCK</span>}
        </h3>
        <div className="db-tools">
          <div className={`db-tool ${!isProUser ? 'db-tool--locked' : ''}`} onClick={handleToolClick}>
            {isProUser && <div className="db-tool-glow" />}
            <div className="db-tool-emoji">🚔</div>
            <h4>Challan Checker</h4>
            <span className={`db-tool-badge ${isProUser ? 'live' : 'locked'}`}>
              {isProUser ? 'LIVE' : 'LOCKED 🔒'}
            </span>
          </div>
          <div className={`db-tool ${!isProUser ? 'db-tool--locked' : ''}`} onClick={handleToolClick}>
            {isProUser && <div className="db-tool-glow" />}
            <div className="db-tool-emoji">📅</div>
            <h4>Expiry Alerts</h4>
            <span className={`db-tool-badge ${isProUser ? 'live' : 'locked'}`}>
              {isProUser ? 'LIVE' : 'LOCKED 🔒'}
            </span>
          </div>
          <div className={`db-tool ${!isProUser ? 'db-tool--locked' : ''}`} onClick={handleToolClick}>
            {isProUser && <div className="db-tool-glow" />}
            <div className="db-tool-emoji">🚑</div>
            <h4>SOS Network</h4>
            <span className={`db-tool-badge ${isProUser ? 'live' : 'locked'}`}>
              {isProUser ? 'LIVE' : 'LOCKED 🔒'}
            </span>
          </div>
          <div className={`db-tool ${!isProUser ? 'db-tool--locked' : ''}`} onClick={() => isProUser ? setVaultOpen(true) : handleToolClick()}>
            {isProUser && <div className="db-tool-glow" />}
            <div className="db-tool-emoji">🔒</div>
            <h4>Smart Vault</h4>
            <span className={`db-tool-badge ${isProUser ? 'live' : 'locked'}`}>
              {isProUser ? 'LIVE' : 'LOCKED 🔒'}
            </span>
          </div>
        </div>
      </section>

      {/* ===== QR + INFO ===== */}
      <section className="db-bottom">
        <div className="db-qr-card">
          <p className="db-qr-title">Your Rakshak QR</p>
          <div className="db-qr-frame">
            <img src={qrUrl} alt="QR Code" />
          </div>
          <p className="db-qr-vnum">{currentUser.vehicle}</p>
          <p className="db-qr-hint">Scan to inform vehicle owner</p>
        </div>

        <div className="db-info-card">
          <p className="db-info-title">Account Details</p>
          <div className="db-info-item">
            <span>Rakshak ID</span>
            <strong>{currentUser.generatedId}</strong>
          </div>
          <div className="db-info-item">
            <span>Vehicle</span>
            <strong>{currentUser.vehicle}</strong>
          </div>
          <div className="db-info-item">
            <span>Mobile</span>
            <strong>{currentUser.mobile?.replace(/(\d{2})(\d{4})(\d{4})/, '$1●●●●$3') || '—'}</strong>
          </div>
          <div className="db-info-item">
            <span>Plan</span>
            <strong>{currentUser.plan}</strong>
          </div>
          <div className="db-info-item">
            <span>Payment</span>
            <strong className="db-paid">{currentUser.status}</strong>
          </div>
          <div className="db-info-item">
            <span>Coupon</span>
            <strong>{currentUser.coupon || '—'}</strong>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="db-footer">
        &copy; 2026 Abhishek Technology India Private Limited. All Rights Reserved.
      </footer>

      <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      <UpdateNumberModal open={updateNumOpen} onClose={() => setUpdateNumOpen(false)} />
      <UpgradePlanModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <SmartVaultModal open={vaultOpen} onClose={() => setVaultOpen(false)} />
    </div>
  )
}

export default UserDashboard
