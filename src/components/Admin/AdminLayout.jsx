import { useState, useEffect } from 'react'
import {
  AppstoreOutlined, LineChartOutlined, TeamOutlined,
  WalletOutlined, UsergroupAddOutlined, KeyOutlined,
  ControlOutlined, SafetyOutlined, SunOutlined,
  MoonOutlined, LogoutOutlined, MenuOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import SalesPanel from './SalesPanel'
import CustomerManagement from './CustomerManagement'
import FinancePanel from './FinancePanel'
import PartnerManagement from './PartnerManagement'
import AdminManagement from './AdminManagement'
import ControlPanel from './ControlPanel'
import SecurityPanel from './SecurityPanel'
import logoImg from '../../assets/icons/Rakshak.jpg'
import './Admin.css'
// import About from './About'

const BASE_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <AppstoreOutlined /> },
  { id: 'sales', label: 'Sales Panel', icon: <LineChartOutlined /> },
  { id: 'users', label: 'User Panel', icon: <TeamOutlined /> },
  { id: 'finance', label: 'Finance Panel', icon: <WalletOutlined /> },
  { id: 'partners', label: 'Partner Panel', icon: <UsergroupAddOutlined /> },
  // { id: 'about', label: 'About', icon: <InfoCircleOutlined /> },
]

const SUPER_ADMIN_NAV = [
  { id: 'access', label: 'Access Panel', icon: <KeyOutlined />, superOnly: true },
  { id: 'control', label: 'Control Panel', icon: <ControlOutlined />, superOnly: true },
  { id: 'security', label: 'Security Panel', icon: <SafetyOutlined />, superOnly: true },
]

// Mobile bottom nav — show only first 5 items, rest in "More" or sidebar
const MOBILE_NAV_LIMIT = 5

const AdminLayout = () => {
  const [admin, setAdmin] = useState(() => {
    const saved = sessionStorage.getItem('rakshak_admin')
    return saved ? JSON.parse(saved) : null
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('rakshak_admin_theme') || 'dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('rakshak_admin_theme', next)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('rakshak_admin')
    setAdmin(null)
  }

  useEffect(() => {
    if (!admin) return
    let timeout
    const resetTimer = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        handleLogout()
        alert('Session expired. Please login again.')
      }, 15 * 60 * 1000)
    }
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('touchstart', resetTimer)
    resetTimer()
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [admin])

  if (!admin) return <AdminLogin onLogin={setAdmin} />

  const isSuperAdmin = admin.role === 'Super Admin'
  const NAV_ITEMS = isSuperAdmin ? [...BASE_NAV, ...SUPER_ADMIN_NAV] : BASE_NAV
  const MOBILE_ITEMS = NAV_ITEMS.slice(0, MOBILE_NAV_LIMIT)
  const hasMore = NAV_ITEMS.length > MOBILE_NAV_LIMIT

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />
      case 'sales': return <SalesPanel />
      case 'users': return <CustomerManagement />
      case 'finance': return <FinancePanel />
      case 'partners': return <PartnerManagement />
      case 'access': return <AdminManagement currentAdmin={admin} />
      case 'control': return <ControlPanel />
      case 'security': return <SecurityPanel />
      // case 'about': return <About />
      default: return <AdminDashboard />
    }
  }

  return (
    <div className={`adm ${theme === 'light' ? 'adm-light' : ''}`}>
      {/* ─── Sidebar ─── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'adm-sidebar-open' : ''}`}>
        <div className="adm-sidebar-header">
          <img src={logoImg} alt="Rakshak" className="adm-sidebar-logo" />
          <div>
            <h2>RAKSHAK</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`adm-nav-item ${activeTab === item.id ? 'adm-nav-active' : ''}`}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-info">
            <span className="adm-admin-name">{admin.name || 'Admin'}</span>
            <span className="adm-admin-role">{admin.role || 'Super Admin'}</span>
          </div>
          <button className="adm-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          </button>
          <button className="adm-logout-btn" onClick={handleLogout}><LogoutOutlined /> Logout</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ─── Main ─── */}
      <main className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <img src={logoImg} alt="Rakshak" className="adm-topbar-logo adm-mobile-show" />
            <h3 className="adm-page-title">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h3>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            </button>
            <span className="adm-admin-badge">{admin.name?.split(' ')[0] || 'Admin'}</span>
            <button className="adm-logout-btn-mobile" onClick={handleLogout}><LogoutOutlined /></button>
          </div>
        </header>

        <div className="adm-content">
          {renderPage()}
        </div>

        {/* ─── Bottom Nav (mobile) ─── */}
        <nav className="adm-bottom-nav">
          {MOBILE_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`adm-bottom-tab ${activeTab === item.id ? 'adm-bottom-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="adm-bottom-icon">{item.icon}</span>
              <span className="adm-bottom-label">{item.label.replace(' Panel', '')}</span>
            </button>
          ))}
          {hasMore && (
            <button
              className={`adm-bottom-tab ${!MOBILE_ITEMS.find(m => m.id === activeTab) ? 'adm-bottom-active' : ''}`}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="adm-bottom-icon"><MenuOutlined /></span>
              <span className="adm-bottom-label">More</span>
            </button>
          )}
        </nav>
      </main>
    </div>
  )
}

export default AdminLayout
