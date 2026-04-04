import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  TeamOutlined, FormOutlined, DollarOutlined, RiseOutlined,
  RadarChartOutlined, EyeOutlined, AppstoreOutlined, StarOutlined,
  UsergroupAddOutlined, MessageOutlined, DownloadOutlined, LoadingOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get } from '../../config/firebase'
import { exportAllData } from '../../utils/exportToExcel'

const AdminDashboard = () => {
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState({
    totalCustomers: 0, todayRegistrations: 0, totalScans: 0,
    todayScans: 0, totalRevenue: 0, todayRevenue: 0,
    litePlan: 0, premiumPlan: 0, totalPartners: 0,
    pendingSupport: 0,
  })
  const [recentCustomers, setRecentCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]

        const custSnap = await get(ref(db, 'customers'))
        let customers = []
        let totalRev = 0, todayRev = 0, lite = 0, premium = 0, todayRegs = 0
        if (custSnap.exists()) {
          const data = custSnap.val()
          customers = Object.entries(data).map(([key, val]) => ({ key, ...val }))
          customers.forEach((c) => {
            totalRev += (parseInt(c.amount) || 0)
            if (c.timestamp?.startsWith(today)) { todayRev += (parseInt(c.amount) || 0); todayRegs++ }
            if (c.plan === 'Lite Plan') lite++
            else premium++
          })
        }

        const scanSnap = await get(ref(db, 'scans'))
        let totalScans = 0, todayScans = 0
        if (scanSnap.exists()) {
          Object.values(scanSnap.val()).forEach((userScans) => {
            const scanList = Object.values(userScans)
            totalScans += scanList.length
            todayScans += scanList.filter((s) => s.timestamp?.startsWith(today)).length
          })
        }

        const partnerSnap = await get(ref(db, 'partners'))
        const totalPartners = partnerSnap.exists() ? Object.keys(partnerSnap.val()).length : 0

        const supportSnap = await get(ref(db, 'support'))
        const pendingSupport = supportSnap.exists() ? Object.keys(supportSnap.val()).length : 0

        setStats({
          totalCustomers: customers.length, todayRegistrations: todayRegs,
          totalScans, todayScans, totalRevenue: totalRev, todayRevenue: todayRev,
          litePlan: lite, premiumPlan: premium, totalPartners, pendingSupport,
        })

        setRecentCustomers(
          customers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8)
        )
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAllData()
      toast.success('Excel downloaded successfully!')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="adm-loading"><LoadingOutlined /> Loading dashboard...</div>

  const statCards = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: <TeamOutlined />, color: 'blue' },
    { label: 'Today Registrations', value: stats.todayRegistrations, icon: <FormOutlined />, color: 'green' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <DollarOutlined />, color: 'orange' },
    { label: 'Today Revenue', value: `₹${stats.todayRevenue.toLocaleString()}`, icon: <RiseOutlined />, color: 'green' },
    { label: 'Total Scans', value: stats.totalScans, icon: <RadarChartOutlined />, color: 'purple' },
    { label: 'Today Scans', value: stats.todayScans, icon: <EyeOutlined />, color: 'blue' },
    { label: 'Lite Plan', value: stats.litePlan, icon: <AppstoreOutlined />, color: 'gray' },
    { label: 'Premium Plan', value: stats.premiumPlan, icon: <StarOutlined />, color: 'orange' },
    { label: 'Partners', value: stats.totalPartners, icon: <UsergroupAddOutlined />, color: 'green' },
    { label: 'Support Threads', value: stats.pendingSupport, icon: <MessageOutlined />, color: 'red' },
  ]

  return (
    <div>
      {/* Export Button */}
      <div className="adm-export-bar">
        <button className="adm-export-btn" onClick={handleExport} disabled={exporting}>
          {exporting ? <><LoadingOutlined /> Exporting...</> : <><DownloadOutlined /> Download All Data (Excel)</>}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="adm-stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className={`adm-stat-card adm-stat-${s.color}`}>
            <div className="adm-stat-icon">{s.icon}</div>
            <div>
              <p className="adm-stat-value">{s.value}</p>
              <p className="adm-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Registrations */}
      <div className="adm-section">
        <h3 className="adm-section-title">Recent Registrations</h3>

        {/* Desktop Table */}
        <div className="adm-table-wrap adm-desktop-only">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle</th>
                <th>Mobile</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.map((c) => (
                <tr key={c.key}>
                  <td className="adm-td-name">{c.name}</td>
                  <td className="adm-td-vehicle">{c.vehicle}</td>
                  <td>{c.mobile}</td>
                  <td><Tag color={c.plan === 'Lite Plan' ? 'default' : 'orange'}>{c.plan}</Tag></td>
                  <td>₹{c.amount}</td>
                  <td className="adm-td-date">{c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="adm-card-list adm-mobile-only">
          {recentCustomers.map((c) => (
            <div key={c.key} className="adm-card">
              <div className="adm-card-row adm-card-row-between">
                <span className="adm-card-name">{c.name}</span>
                <Tag color={c.plan === 'Lite Plan' ? 'default' : 'orange'}>{c.plan === 'Lite Plan' ? 'LITE' : 'PRO'}</Tag>
              </div>
              <div className="adm-card-row">
                <span className="adm-card-vehicle">{c.vehicle}</span>
              </div>
              <div className="adm-card-row adm-card-row-between adm-card-meta">
                <span>{c.mobile}</span>
                <span>₹{c.amount}</span>
                <span>{c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
