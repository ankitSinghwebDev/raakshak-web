import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { generateQRCodeUrl, buildPublicSiteUrl } from '../../utils/helpers'
import { db, ref, onValue } from '../../config/firebase'
import EmergencyModal from './EmergencyModal'
import UpdateNumberModal from './UpdateNumberModal'
import UpgradePlanModal from './UpgradePlanModal'
import SmartVaultModal from './SmartVaultModal'
import MyVehiclesModal from './MyVehiclesModal'
import SupportDrawer from './SupportDrawer'
import usePushNotifications from '../../hooks/usePushNotifications'
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
  const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false)
  const [myVehiclesOpen, setMyVehiclesOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false)
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )
  usePushNotifications(currentUser)
  const [recentScans, setRecentScans] = useState([])
  const [totalScans, setTotalScans] = useState(0)

  const handleLogout = useCallback(() => {
    logoutUser()
    navigate('/')
  }, [logoutUser, navigate])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Live scan listener + push notification
  const prevScanCount = useRef(0)

  useEffect(() => {
    if (!currentUser?.key) return

    const scansRef = ref(db, `scans/${currentUser.key}`)
    const unsubscribe = onValue(scansRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const scanList = Object.values(data)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
        const newCount = Object.keys(data).length

        // Trigger notification if new scan arrived (not on first load)
        if (prevScanCount.current > 0 && newCount > prevScanCount.current) {
          const latest = scanList[0]
          triggerNotification(latest)
        }
        prevScanCount.current = newCount

        setRecentScans(scanList)
        setTotalScans(newCount)
      }
    })

    const customerRef = ref(db, `customers/${currentUser.key}/totalScans`)
    onValue(customerRef, (snap) => {
      if (snap.exists()) setTotalScans((prev) => Math.max(prev, snap.val()))
    })

    return () => unsubscribe()
  }, [currentUser?.key])

  const triggerNotification = (scan) => {
    // Sound alert
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleVZm10teleIBAAABAAEARKwAAIhYAQACABAAZGF0YQ==')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {}

    // In-app toast
    toast(`🚨 New Scan Alert: ${scan.message}`, { duration: 5000 })

    // Browser push notification (works in background tabs)
    if ('Notification' in window && Notification.permission === 'granted') {
      const typeEmoji = scan.type === 'emergency' ? '🚨' : scan.type === 'urgent' ? '⚠️' : '🅿️'
      new Notification(`${typeEmoji} Rakshak Alert — ${currentUser.vehicle}`, {
        body: scan.message,
        icon: 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
        tag: 'rakshak-scan',
        renotify: true,
        vibrate: [200, 100, 200],
      })
    }
  }

  if (!currentUser) return null

  const isProUser = isPremiumUser(currentUser.plan)

  const handleToolClick = () => {
    if (!isProUser) {
      setUpgradeOpen(true)
    }
  }

  const qrLink = buildPublicSiteUrl('/scan', { id: currentUser.generatedId })
  const qrUrl = generateQRCodeUrl(qrLink, 200)
  const qrUrlHD = generateQRCodeUrl(qrLink, 600) // High-res for print/download

  const handleDownloadQR = async () => {
    try {
      const res = await fetch(qrUrlHD)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rakshak-${currentUser.vehicle}-QR.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(qrUrlHD, '_blank')
    }
  }

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Rakshak QR - ${currentUser.vehicle}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; font-family: -apple-system, sans-serif; }
            .sticker {
              width: 480px; background: #fff; border-radius: 16px; overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 2px solid #e0e0e0;
            }
            .sticker-top {
              display: flex; align-items: center; padding: 16px 20px; gap: 16px;
            }
            .logo-section {
              display: flex; flex-direction: column; align-items: center; min-width: 90px;
            }
            .logo-section img { width: 60px; border-radius: 10px; margin-bottom: 4px; }
            .logo-section .brand { font-size: 12px; font-weight: 900; color: #1a1a1a; letter-spacing: 2px; }
            .logo-section .sub { font-size: 6px; color: #888; letter-spacing: 1px; font-weight: 700; }
            .middle {
              flex: 1; text-align: center;
            }
            .middle h2 {
              font-size: 20px; font-weight: 900; color: #1a1a1a; letter-spacing: 1px; line-height: 1.3;
            }
            .middle .tagline {
              font-size: 8px; color: #999; font-weight: 700; letter-spacing: 0.5px; margin-top: 4px;
            }
            .qr-section { display: flex; align-items: center; }
            .qr-section img { width: 90px; height: 90px; }
            .vehicle-bar {
              background: #F28C38; padding: 12px 20px; text-align: center;
            }
            .vehicle-bar span {
              color: #fff; font-size: 24px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;
            }
            @media print {
              body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .sticker { box-shadow: none; border: 2px solid #ddd; }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="sticker-top">
              <div class="logo-section">
                <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" />
                <span class="brand">RAKSHAK</span>
                <span class="sub">HAR GAADI KA GUARDIAN</span>
              </div>
              <div class="middle">
                <h2>SCAN TO<br>INFORM</h2>
                <p class="tagline">Wrong Parking? Emergency? Just Scan.</p>
              </div>
              <div class="qr-section">
                <img src="${qrUrlHD}" />
              </div>
            </div>
            <div class="vehicle-bar">
              <span>${currentUser.vehicle}</span>
            </div>
          </div>
          <script>
            const imgs = document.querySelectorAll('img');
            let loaded = 0;
            imgs.forEach(img => {
              img.onload = () => { loaded++; if (loaded === imgs.length) window.print(); };
            });
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

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

      {/* ===== NOTIFICATION BANNER ===== */}
      {!notifBannerDismissed && (
        <div className={`db-notif-banner ${notifPermission === 'denied' ? 'db-notif-banner--denied' : notifPermission === 'granted' ? 'db-notif-banner--granted' : ''}`}>
          <div className="db-notif-banner-content">
            <span className="db-notif-banner-icon">
              {notifPermission === 'denied' ? '🚫' : notifPermission === 'granted' ? '✅' : '🔔'}
            </span>
            <div className="db-notif-banner-text">
              {notifPermission === 'denied' ? (
                <>
                  <strong>Notifications Blocked</strong>
                  <p>You have blocked notifications. You will miss important alerts like parking warnings, emergency SOS & vehicle scan updates.</p>
                  <p className="db-notif-banner-help">To enable: Open browser settings &gt; Site Settings &gt; Notifications &gt; Allow for this site, then refresh the page.</p>
                </>
              ) : notifPermission === 'granted' ? (
                <>
                  <strong>Notifications Active</strong>
                  <p>You're all set! You'll receive instant alerts when someone scans your QR.</p>
                </>
              ) : notifPermission === 'unsupported' ? (
                <>
                  <strong>Notifications Not Supported</strong>
                  <p>Your browser does not support notifications. Please use Chrome, Edge, or Firefox for the best experience.</p>
                </>
              ) : (
                <>
                  <strong>Enable Notifications</strong>
                  <p>Keep notifications ON to receive instant alerts when someone scans your QR — parking alerts, emergency SOS & more.</p>
                </>
              )}
            </div>
            {notifPermission === 'default' && (
              <button className="db-notif-banner-btn" onClick={() => {
                Notification.requestPermission().then((p) => {
                  setNotifPermission(p)
                  if (p === 'granted') {
                    toast.success('Notifications enabled!')
                  }
                })
              }}>
                Allow
              </button>
            )}
            <button className="db-notif-banner-close" onClick={() => setNotifBannerDismissed(true)}>&times;</button>
          </div>
        </div>
      )}

      {/* ===== HERO CARD ===== */}
      <section className="db-hero" onClick={() => setVehicleDetailsOpen(!vehicleDetailsOpen)} style={{ cursor: 'pointer' }}>
        <div className="db-hero-left">
          <p className="db-hero-greeting">Welcome back,</p>
          <h1 className="db-hero-name">{currentUser.name}</h1>
          <div className="db-hero-vehicle">
            <span className="db-hero-vnum">{currentUser.vehicle}</span>
            <span className="db-hero-id">{currentUser.generatedId}</span>
          </div>
          <p className="db-hero-mobile">📞 +91 {currentUser.mobile}</p>
          <p className="db-hero-tap-hint">{vehicleDetailsOpen ? '▲ Tap to collapse' : '▼ Tap to see vehicle details'}</p>
        </div>
        <div className="db-hero-right">
          <div className="db-shield">
            <span className="db-shield-ring" />
            <span className="db-shield-dot" />
            <span className="db-shield-text">SHIELD<br />ACTIVE</span>
          </div>
        </div>
      </section>

      {/* ===== VEHICLE DETAILS (Expandable) ===== */}
      {vehicleDetailsOpen && (
        <section className="db-vehicle-details">
          <div className="db-vd-grid">
            <div className="db-vd-item">
              <span className="db-vd-label">Owner Name</span>
              <span className="db-vd-value">{currentUser.name}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Vehicle Number</span>
              <span className="db-vd-value">{currentUser.vehicle}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Mobile</span>
              <span className="db-vd-value">+91 {currentUser.mobile}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">WhatsApp</span>
              <span className="db-vd-value">+91 {currentUser.whatsapp || currentUser.mobile}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Rakshak ID</span>
              <span className="db-vd-value highlight">{currentUser.generatedId}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Plan</span>
              <span className="db-vd-value">{currentUser.plan}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Payment Status</span>
              <span className="db-vd-value db-paid">{currentUser.status}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Payment ID</span>
              <span className="db-vd-value" style={{ fontSize: '11px' }}>{currentUser.paymentId || '—'}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Coupon Used</span>
              <span className="db-vd-value">{currentUser.coupon || '—'}</span>
            </div>
            <div className="db-vd-item">
              <span className="db-vd-label">Registered On</span>
              <span className="db-vd-value">{currentUser.timestamp ? new Date(currentUser.timestamp).toLocaleString('en-IN') : '—'}</span>
            </div>
          </div>
        </section>
      )}

      {/* ===== STATS ===== */}
      <section className="db-stats">
        <div className="db-stat">
          <div className="db-stat-icon-wrap blue">
            <span>👁️</span>
          </div>
          <div>
            <p className="db-stat-num">{totalScans}</p>
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
          <button className="db-action" onClick={() => setMyVehiclesOpen(true)}>
            <div className="db-action-icon">🚗</div>
            <span>My Vehicles</span>
          </button>
          <button className="db-action" onClick={() => setSupportOpen(true)}>
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

      {/* ===== QR STICKER (FASTag Style) ===== */}
      <section className="db-section">
        <h3 className="db-section-title">Your Rakshak QR Sticker</h3>
        <div className="db-sticker-layout">
          <div className="db-sticker-panel">
            <div className="db-sticker">
              <div className="db-sticker-top">
                <div className="db-sticker-logo">
                  <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" alt="Rakshak" />
                  <span className="db-sticker-brand">RAKSHAK</span>
                  <span className="db-sticker-sub">HAR GAADI KA GUARDIAN</span>
                </div>
                <div className="db-sticker-middle">
                  <h2>SCAN TO<br />INFORM</h2>
                  <p className="db-sticker-tagline">Wrong Parking? Emergency? Just Scan.</p>
                </div>
                <div className="db-sticker-qr">
                  <img src={qrUrl} alt="QR Code" />
                </div>
              </div>
              <div className="db-sticker-bar">
                <span>{currentUser.vehicle}</span>
              </div>
            </div>
          </div>
          <div className="db-sticker-side">
            <div className="db-sticker-side-head">
              <span className="db-sticker-side-label">Sticker Actions</span>
              <p>Download the QR or print the full visiting-card style sticker.</p>
            </div>
            <div className="db-qr-actions">
              <button className="db-qr-btn" onClick={handleDownloadQR}>⬇️ Download QR</button>
              <button className="db-qr-btn db-qr-btn-print" onClick={handlePrintQR}>🖨️ Print Sticker</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACCOUNT INFO ===== */}
      <section className="db-bottom">

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

      {/* ===== RECENT SCANS ===== */}
      {recentScans.length > 0 && (
        <section className="db-section">
          <h3 className="db-section-title">Recent Scan Alerts</h3>
          <div className="db-scans-list">
            {recentScans.map((scan, i) => (
              <div key={i} className={`db-scan-item db-scan-${scan.type}`}>
                <div className="db-scan-left">
                  <span className="db-scan-type-icon">
                    {scan.type === 'parking' && '🅿️'}
                    {scan.type === 'urgent' && '⚠️'}
                    {scan.type === 'emergency' && '🚨'}
                  </span>
                  <div>
                    <p className="db-scan-msg">{scan.message}</p>
                    <p className="db-scan-time">
                      {new Date(scan.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`db-scan-badge db-scan-badge-${scan.type}`}>
                  {scan.type}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="db-footer">
        &copy; 2026 Abhishek Technology India Private Limited. All Rights Reserved.
      </footer>

      <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
      <UpdateNumberModal open={updateNumOpen} onClose={() => setUpdateNumOpen(false)} />
      <UpgradePlanModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <SmartVaultModal open={vaultOpen} onClose={() => setVaultOpen(false)} />
      <MyVehiclesModal open={myVehiclesOpen} onClose={() => setMyVehiclesOpen(false)} />
      <SupportDrawer open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}

export default UserDashboard
