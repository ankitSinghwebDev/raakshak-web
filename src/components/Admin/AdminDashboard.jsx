import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  Card, Statistic, Progress, Tag, Table, Row, Col, Typography, Divider, Space, Empty,
} from 'antd'
import {
  TeamOutlined, DollarOutlined, RadarChartOutlined,
  UsergroupAddOutlined, MessageOutlined, DownloadOutlined, LoadingOutlined,
  CarOutlined, StarOutlined, WarningOutlined, AlertOutlined,
  CalendarOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons'
import { db, ref, get } from '../../config/firebase'
import { exportAllData } from '../../utils/exportToExcel'
import { DashboardSkeleton } from './AdminSkeleton'

const { Text } = Typography

const AdminDashboard = () => {
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [scans, setScans] = useState([])
  const [partners, setPartners] = useState([])
  const [supportThreads, setSupportThreads] = useState(0)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Customers
        const custSnap = await get(ref(db, 'customers'))
        let custList = []
        if (custSnap.exists()) {
          custList = Object.entries(custSnap.val()).map(([key, val]) => ({ key, ...val }))
        }
        setCustomers(custList)

        // Scans
        const scanSnap = await get(ref(db, 'scans'))
        let scanList = []
        if (scanSnap.exists()) {
          Object.entries(scanSnap.val()).forEach(([custKey, userScans]) => {
            const cust = custList.find((c) => c.key === custKey)
            Object.entries(userScans).forEach(([scanKey, scan]) => {
              scanList.push({ id: scanKey, custKey, vehicle: cust?.vehicle || '—', ...scan })
            })
          })
        }
        setScans(scanList)

        // Partners
        const partnerSnap = await get(ref(db, 'partners'))
        let partnerList = []
        if (partnerSnap.exists()) {
          partnerList = Object.entries(partnerSnap.val()).map(([key, val]) => ({ key, ...val }))
        }
        setPartners(partnerList)

        // Support
        const supportSnap = await get(ref(db, 'support'))
        setSupportThreads(supportSnap.exists() ? Object.keys(supportSnap.val()).length : 0)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Computed analytics
  const analytics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let totalRev = 0, todayRev = 0, yesterdayRev = 0
    let todayRegs = 0, yesterdayRegs = 0
    let lite = 0, premium = 0, pro = 0, custom = 0
    let suspended = 0
    const dailyRevMap = {}
    const monthlyRegMap = {}

    customers.forEach((c) => {
      const amt = parseInt(c.amount) || 0
      totalRev += amt

      const day = c.timestamp?.split('T')[0]
      if (day === today) { todayRev += amt; todayRegs++ }
      if (day === yesterday) { yesterdayRev += amt; yesterdayRegs++ }
      if (c.status === 'Suspended') suspended++

      // Plan distribution
      const plan = c.plan || ''
      if (plan.includes('Lite')) lite++
      else if (plan.includes('Premium')) premium++
      else if (plan.includes('Pro')) pro++
      else custom++

      // Daily revenue (last 7 days)
      if (day) {
        dailyRevMap[day] = (dailyRevMap[day] || 0) + amt
      }

      // Monthly registrations
      const month = c.timestamp?.substring(0, 7)
      if (month) {
        monthlyRegMap[month] = (monthlyRegMap[month] || 0) + 1
      }
    })

    // Scans
    let todayScans = 0, parkingScans = 0, urgentScans = 0, emergencyScans = 0
    scans.forEach((s) => {
      if (s.timestamp?.startsWith(today)) todayScans++
      if (s.type === 'parking') parkingScans++
      else if (s.type === 'urgent') urgentScans++
      else if (s.type === 'emergency') emergencyScans++
    })

    // Partners
    const activePartners = partners.filter((p) => p.status === 'active').length
    const totalPartnerRev = partners.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
    const totalPendingComm = partners.reduce((sum, p) => sum + (p.pendingComm || 0), 0)
    const totalPartnerSales = partners.reduce((sum, p) => sum + (p.totalSales || 0), 0)

    // Last 7 days revenue
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      last7Days.push({ date: key, label, revenue: dailyRevMap[key] || 0 })
    }
    const maxDayRev = Math.max(...last7Days.map((d) => d.revenue), 1)

    // Last 6 months registrations
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toISOString().substring(0, 7)
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      last6Months.push({ month: key, label, count: monthlyRegMap[key] || 0 })
    }
    const maxMonthReg = Math.max(...last6Months.map((m) => m.count), 1)

    // Top partners by sales
    const topPartners = [...partners].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0)).slice(0, 5)

    // Avg revenue per customer
    const avgRev = customers.length ? Math.round(totalRev / customers.length) : 0

    // Recent registrations
    const recentCustomers = [...customers]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)

    return {
      totalRev, todayRev, yesterdayRev, todayRegs, yesterdayRegs,
      lite, premium, pro, custom, suspended,
      todayScans, parkingScans, urgentScans, emergencyScans,
      activePartners, totalPartnerRev, totalPendingComm, totalPartnerSales,
      last7Days, maxDayRev, last6Months, maxMonthReg,
      topPartners, avgRev, recentCustomers,
    }
  }, [customers, scans, partners])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportAllData()
      toast.success('Excel downloaded!')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  const regDelta = analytics.todayRegs - analytics.yesterdayRegs
  const revDelta = analytics.todayRev - analytics.yesterdayRev
  const totalPlans = analytics.lite + analytics.premium + analytics.pro + analytics.custom

  return (
    <div className="adm-dashboard">
      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="adm-export-btn" onClick={handleExport} disabled={exporting} style={{ width: 'auto' }}>
          {exporting ? <><LoadingOutlined /> Exporting...</> : <><DownloadOutlined /> Export All Data</>}
        </button>
      </div>

      {/* ─── TOP KPI CARDS ─── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={6} xl={4}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Total Customers" value={customers.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6} xl={4}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Today Registrations" value={analytics.todayRegs}
              prefix={regDelta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: regDelta >= 0 ? 'var(--green)' : 'var(--red)' }}
              suffix={<span style={{ fontSize: 12, color: 'var(--text-dim)' }}>vs {analytics.yesterdayRegs}</span>}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6} xl={4}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Total Revenue" value={analytics.totalRev} prefix={<DollarOutlined />} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6} xl={4}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Today Revenue" value={analytics.todayRev}
              prefix={revDelta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              valueStyle={{ color: revDelta >= 0 ? 'var(--green)' : 'var(--red)' }}
              formatter={(v) => `₹${Number(v).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6} xl={4}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Total Scans" value={scans.length} prefix={<RadarChartOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={6} xl={4}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Avg Revenue/User" value={analytics.avgRev} prefix="₹" />
          </Card>
        </Col>
      </Row>

      {/* ─── REVENUE + REGISTRATIONS CHARTS ─── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<><DollarOutlined /> Revenue — Last 7 Days</>} size="small" className="adm-chart-card">
            <div className="adm-bar-chart">
              {analytics.last7Days.map((d) => (
                <div key={d.date} className="adm-bar-col">
                  <span className="adm-bar-value">₹{d.revenue.toLocaleString()}</span>
                  <div className="adm-bar" style={{ height: `${(d.revenue / analytics.maxDayRev) * 100}%` }} />
                  <span className="adm-bar-label">{d.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><CalendarOutlined /> Registrations — Last 6 Months</>} size="small" className="adm-chart-card">
            <div className="adm-bar-chart">
              {analytics.last6Months.map((m) => (
                <div key={m.month} className="adm-bar-col">
                  <span className="adm-bar-value">{m.count}</span>
                  <div className="adm-bar adm-bar-blue" style={{ height: `${(m.count / analytics.maxMonthReg) * 100}%` }} />
                  <span className="adm-bar-label">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ─── CUSTOMERS + SCANS + PARTNERS ROW ─── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Plan Distribution */}
        <Col xs={24} md={8}>
          <Card title={<><StarOutlined /> Plan Distribution</>} size="small" className="adm-chart-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: 'var(--text-secondary)' }}>Lite Plan</Text>
                  <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.lite}</Text>
                </div>
                <Progress percent={totalPlans ? Math.round((analytics.lite / totalPlans) * 100) : 0} strokeColor="#6b7280" showInfo={false} size="small" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: 'var(--text-secondary)' }}>Premium Studio</Text>
                  <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.premium}</Text>
                </div>
                <Progress percent={totalPlans ? Math.round((analytics.premium / totalPlans) * 100) : 0} strokeColor="#d97706" showInfo={false} size="small" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: 'var(--text-secondary)' }}>Pro Plan</Text>
                  <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.pro}</Text>
                </div>
                <Progress percent={totalPlans ? Math.round((analytics.pro / totalPlans) * 100) : 0} strokeColor="#2563eb" showInfo={false} size="small" />
              </div>
              {analytics.custom > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: 'var(--text-secondary)' }}>Custom / Other</Text>
                    <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.custom}</Text>
                  </div>
                  <Progress percent={totalPlans ? Math.round((analytics.custom / totalPlans) * 100) : 0} strokeColor="#8b5cf6" showInfo={false} size="small" />
                </div>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Suspended</Text>
                <Tag color="red">{analytics.suspended}</Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Scan Breakdown */}
        <Col xs={24} md={8}>
          <Card title={<><RadarChartOutlined /> Scan Breakdown</>} size="small" className="adm-chart-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>{scans.length}</div>
                <Text type="secondary">Total Scans</Text>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space><CarOutlined style={{ color: '#d97706' }} /><Text style={{ color: 'var(--text-secondary)' }}>Parking</Text></Space>
                  <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.parkingScans}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space><WarningOutlined style={{ color: '#ea580c' }} /><Text style={{ color: 'var(--text-secondary)' }}>Urgent</Text></Space>
                  <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.urgentScans}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space><AlertOutlined style={{ color: '#dc2626' }} /><Text style={{ color: 'var(--text-secondary)' }}>Emergency</Text></Space>
                  <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.emergencyScans}</Text>
                </div>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Today</Text>
                <Tag color="blue">{analytics.todayScans} scans</Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Partner & Finance */}
        <Col xs={24} md={8}>
          <Card title={<><UsergroupAddOutlined /> Partners & Finance</>} size="small" className="adm-chart-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Active Partners</Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.activePartners} / {partners.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Partner Sales</Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>{analytics.totalPartnerSales}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Partner Revenue</Text>
                <Text strong style={{ color: 'var(--text-primary)' }}>₹{analytics.totalPartnerRev.toLocaleString()}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Pending Commission</Text>
                <Tag color={analytics.totalPendingComm > 0 ? 'orange' : 'default'}>₹{analytics.totalPendingComm.toLocaleString()}</Tag>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Support Threads</Text>
                <Tag color={supportThreads > 0 ? 'red' : 'green'}><MessageOutlined /> {supportThreads}</Tag>
              </div>

              {/* Top Partners */}
              {analytics.topPartners.length > 0 && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Partners</Text>
                  {analytics.topPartners.map((p) => (
                    <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.name}</Text>
                      <Space size={4}>
                        <Tag color="green">{p.totalSales || 0} sales</Tag>
                      </Space>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ─── RECENT REGISTRATIONS ─── */}
      <Card title={<><TeamOutlined /> Recent Registrations</>} size="small" className="adm-chart-card">
        {/* Desktop Table */}
        <div className="adm-desktop-only">
          <Table
            dataSource={analytics.recentCustomers}
            rowKey="key"
            pagination={false}
            size="small"
            columns={[
              { title: 'Name', dataIndex: 'name', render: (v) => <Text strong style={{ color: 'var(--text-primary)' }}>{v}</Text> },
              { title: 'Vehicle', dataIndex: 'vehicle', render: (v) => <Text style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: 1 }}>{v}</Text> },
              { title: 'Mobile', dataIndex: 'mobile' },
              { title: 'Plan', dataIndex: 'plan', render: (v) => <Tag color={v === 'Lite Plan' ? 'default' : 'orange'}>{v}</Tag> },
              { title: 'Amount', dataIndex: 'amount', render: (v) => `₹${v}` },
              { title: 'Date', dataIndex: 'timestamp', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
            ]}
          />
        </div>
        {/* Mobile Cards */}
        <div className="adm-mobile-only">
          {analytics.recentCustomers.length === 0 && <Empty description="No registrations yet" />}
          {analytics.recentCustomers.map((c) => (
            <div key={c.key} className="adm-card" style={{ marginBottom: 8 }}>
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
      </Card>
    </div>
  )
}

export default AdminDashboard
