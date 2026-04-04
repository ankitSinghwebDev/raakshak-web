import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DashboardOutlined, TeamOutlined, ScanOutlined,
  MessageOutlined, UsergroupAddOutlined, SunOutlined,
  MoonOutlined, LogoutOutlined, SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import CustomerManagement from './CustomerManagement'
import SupportInbox from './SupportInbox'
import ScanLogs from './ScanLogs'
import PartnerManagement from './PartnerManagement'
import AdminManagement from './AdminManagement'
import './Admin.css'

const BASE_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { id: 'customers', label: 'Customers', icon: <TeamOutlined /> },
  { id: 'scans', label: 'Scans', icon: <ScanOutlined /> },
  { id: 'support', label: 'Support', icon: <MessageOutlined /> },
  { id: 'partners', label: 'Partners', icon: <UsergroupAddOutlined /> },
]

const SUPER_ADMIN_NAV = [
  { id: 'admins', label: 'Admins', icon: <SettingOutlined />, superOnly: true },
]

const AdminLayout = () => {
  const [admin, setAdmin] = useState(() => {
    const saved = sessionStorage.getItem('rakshak_admin')
    return saved ? JSON.parse(saved) : null
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('rakshak_admin_theme') || 'dark')
  const navigate = useNavigate()

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('rakshak_admin_theme', next)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('rakshak_admin')
    setAdmin(null)
  }

  // Auto-logout after 15 minutes inactivity
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

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />
      case 'customers': return <CustomerManagement />
      case 'scans': return <ScanLogs />
      case 'support': return <SupportInbox />
      case 'partners': return <PartnerManagement />
      case 'admins': return <AdminManagement currentAdmin={admin} />
      default: return <AdminDashboard />
    }
  }

  return (
    <div className={`adm ${theme === 'light' ? 'adm-light' : ''}`}>
      {/* Sidebar — desktop only */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'adm-sidebar-open' : ''}`}>
        <div className="adm-sidebar-header">
          <h2><SafetyCertificateOutlined /> RAKSHAK</h2>
          <p>Admin Panel</p>
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

      {/* Main Content */}
      <main className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <span className="adm-topbar-brand"><SafetyCertificateOutlined /></span>
            <h3 className="adm-page-title">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h3>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
              {theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            </button>
            <span className="adm-admin-badge">{admin.name?.split(' ')[0] || 'Admin'}</span>
            <button className="adm-logout-btn-mobile" onClick={handleLogout}><LogoutOutlined /></button>
          </div>
        </header>

        <div className="adm-content">
          {renderPage()}
        </div>

        {/* Bottom Tab Bar — mobile only */}
        <nav className="adm-bottom-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`adm-bottom-tab ${activeTab === item.id ? 'adm-bottom-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="adm-bottom-icon">{item.icon}</span>
              <span className="adm-bottom-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  )
}

export default AdminLayout
