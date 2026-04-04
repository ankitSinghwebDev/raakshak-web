import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { Card, Row, Col, Tag, Table, Typography, Space, Input, DatePicker, Empty, Segmented, Progress, Divider } from 'antd'
import { BarChartOutlined, TableOutlined } from '@ant-design/icons'
import {
  ShoppingCartOutlined, DollarOutlined, CalendarOutlined,
  ArrowUpOutlined, ArrowDownOutlined, CrownOutlined,
  DownloadOutlined, WarningOutlined, ClockCircleOutlined,
  UsergroupAddOutlined, GlobalOutlined, TeamOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { db, ref, get, update } from '../../config/firebase'
import { logAdminAction } from '../../utils/auditLog'
import { DashboardSkeleton } from './AdminSkeleton'

const { Text } = Typography
const { RangePicker } = DatePicker

const SalesPanel = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState('graph')

  useEffect(() => {
    const fetch = async () => {
      try {
        const custSnap = await get(ref(db, 'customers'))
        if (custSnap.exists()) setCustomers(Object.entries(custSnap.val()).map(([k, v]) => ({ key: k, ...v })))
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const data = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const thisMonth = now.toISOString().substring(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7)

    let totalRev = 0, todayRev = 0, weeklyRev = 0, monthlyRev = 0, lastMonthRev = 0
    let partnerRev = 0, siteRev = 0, teamRev = 0
    let todayCount = 0
    const dailyMap = {}
    const pendingPayments = []

    customers.forEach((c) => {
      const amt = parseInt(c.amount) || 0
      const day = c.timestamp?.split('T')[0]
      const month = c.timestamp?.substring(0, 7)
      totalRev += amt

      if (day === today) { todayRev += amt; todayCount++ }
      if (day >= weekAgo) weeklyRev += amt
      if (month === thisMonth) monthlyRev += amt
      if (month === lastMonth) lastMonthRev += amt

      // Source breakdown
      if (c.coupon && c.coupon !== 'WTRAK01') partnerRev += amt
      else if (c.coupon === 'WTRAK01') teamRev += amt
      else siteRev += amt

      // Daily chart (last 14 days)
      if (day) dailyMap[day] = (dailyMap[day] || { count: 0, revenue: 0 })
      if (day) { dailyMap[day].count++; dailyMap[day].revenue += amt }

      // Pending payments
      if (c.status === 'Pending' || c.status === 'Dev-Free') {
        pendingPayments.push({ key: c.key, name: c.name, amount: amt, reason: c.status, vehicle: c.vehicle })
      }
    })

    // Chart data
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      last14Days.push({ date: key, label, count: dailyMap[key]?.count || 0, revenue: dailyMap[key]?.revenue || 0 })
    }
    const maxDayRev = Math.max(...last14Days.map((d) => d.revenue), 1)

    const monthGrowth = lastMonthRev > 0 ? Math.round(((monthlyRev - lastMonthRev) / lastMonthRev) * 100) : 0

    // Filtered table data
    let tableData = [...customers].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    if (activeFilter === 'today') tableData = tableData.filter((c) => c.timestamp?.startsWith(today))
    else if (activeFilter === 'weekly') tableData = tableData.filter((c) => c.timestamp?.split('T')[0] >= weekAgo)
    else if (activeFilter === 'monthly') tableData = tableData.filter((c) => c.timestamp?.substring(0, 7) === thisMonth)
    else if (activeFilter === 'partner') tableData = tableData.filter((c) => c.coupon && c.coupon !== 'WTRAK01')
    else if (activeFilter === 'team') tableData = tableData.filter((c) => c.coupon === 'WTRAK01')
    else if (activeFilter === 'site') tableData = tableData.filter((c) => !c.coupon)

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].format('YYYY-MM-DD')
      const end = dateRange[1].format('YYYY-MM-DD')
      tableData = tableData.filter((c) => {
        const day = c.timestamp?.split('T')[0]
        return day >= start && day <= end
      })
    }

    if (search) {
      const q = search.toLowerCase()
      tableData = tableData.filter((c) =>
        c.name?.toLowerCase().includes(q) || c.generatedId?.toLowerCase().includes(q) ||
        c.vehicle?.toLowerCase().includes(q) || c.mobile?.includes(q)
      )
    }

    // Plan distribution
    const planMap = {}
    customers.forEach((c) => {
      const plan = c.plan || 'Other'
      planMap[plan] = (planMap[plan] || { count: 0, revenue: 0 })
      planMap[plan].count++
      planMap[plan].revenue += parseInt(c.amount) || 0
    })

    // Monthly revenue trend (last 6 months)
    const monthlyRevMap = {}
    customers.forEach((c) => {
      const m = c.timestamp?.substring(0, 7)
      if (m) monthlyRevMap[m] = (monthlyRevMap[m] || 0) + (parseInt(c.amount) || 0)
    })
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().substring(0, 7)
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      last6Months.push({ month: key, label, revenue: monthlyRevMap[key] || 0 })
    }
    const maxMonthRev = Math.max(...last6Months.map((m) => m.revenue), 1)

    return {
      totalRev, todayRev, weeklyRev, monthlyRev, monthGrowth,
      partnerRev, teamRev, siteRev, todayCount,
      last14Days, maxDayRev, pendingPayments, tableData,
      planMap, last6Months, maxMonthRev,
    }
  }, [customers, search, dateRange, activeFilter])

  const handleExport = () => {
    const rows = data.tableData.map((c) => ({
      'User ID': c.generatedId || '—',
      'Name': c.name || '—',
      'Mobile': c.mobile || '—',
      'WhatsApp': c.whatsapp || c.mobile || '—',
      'Vehicle': c.vehicle || '—',
      'Plan': c.plan || '—',
      'Amount': parseInt(c.amount) || 0,
      'Coupon': c.coupon || '—',
      'Payment ID': c.paymentId || '—',
      'Date': c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN') : '—',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length + 2, 14) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sales')
    XLSX.writeFile(wb, `Rakshak_Sales_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Sales exported!')
  }

  if (loading) return <DashboardSkeleton />

  const filterLabel = { all: 'Total', today: 'Today', weekly: 'Weekly', monthly: 'Monthly', partner: 'Partner', team: 'Team', site: 'Site' }

  return (
    <div className="adm-dashboard">
      {/* ─── KPI STATS ─── */}
      <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
        {[
          { key: 'all', label: 'TOTAL SALE', value: data.totalRev, icon: <DollarOutlined /> },
          { key: 'today', label: 'TODAY SALE', value: data.todayRev, icon: <CalendarOutlined />, color: 'var(--green)' },
          { key: 'weekly', label: 'WEEKLY SALE', value: data.weeklyRev, icon: <ClockCircleOutlined /> },
          { key: 'monthly', label: 'MONTHLY SALE', value: data.monthlyRev, icon: <CalendarOutlined />,
            suffix: data.monthGrowth !== 0 && (
              <span style={{ fontSize: 11, color: data.monthGrowth >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {data.monthGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(data.monthGrowth)}%
              </span>
            )
          },
          { key: 'partner', label: 'PARTNER SALE', value: data.partnerRev, icon: <UsergroupAddOutlined /> },
          { key: 'team', label: 'TEAM SALE', value: data.teamRev, icon: <TeamOutlined /> },
          { key: 'site', label: 'SITE SALE', value: data.siteRev, icon: <GlobalOutlined /> },
        ].map((s) => (
          <Col xs={12} sm={8} md={6} lg={3} key={s.key}>
            <Card
              size="small"
              className={`adm-kpi-card ${activeFilter === s.key ? 'adm-kpi-active' : ''}`}
              onClick={() => setActiveFilter(activeFilter === s.key ? 'all' : s.key)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ textAlign: 'center' }}>
                <Text style={{ color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color || 'var(--accent)', marginTop: 4 }}>
                  ₹{s.value.toLocaleString()}
                </div>
                {s.suffix}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ─── VIEW MODE TOGGLE ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <Segmented
          options={[
            { label: <><BarChartOutlined /> Graph View</>, value: 'graph' },
            { label: <><TableOutlined /> Table View</>, value: 'table' },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
        <Space size={8} wrap>
          <RangePicker size="small" onChange={(dates) => setDateRange(dates)} style={{ maxWidth: 220 }} />
          <button className="adm-icon-btn adm-icon-export" onClick={handleExport} title="Export Excel" style={{ width: 32, height: 32, minWidth: 32, fontSize: 14 }}>
            <DownloadOutlined />
          </button>
        </Space>
      </div>

      {/* ═══════ GRAPH VIEW ═══════ */}
      {viewMode === 'graph' && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} lg={14}>
              <Card title={<><ShoppingCartOutlined /> Daily Revenue — Last 14 Days</>} size="small" className="adm-chart-card">
                <div className="adm-bar-chart" style={{ height: 150 }}>
                  {data.last14Days.map((d) => (
                    <div key={d.date} className="adm-bar-col">
                      <span className="adm-bar-value">{d.count > 0 ? `₹${(d.revenue / 1000).toFixed(1)}k` : ''}</span>
                      <div className="adm-bar" style={{ height: `${(d.revenue / data.maxDayRev) * 100}%` }} />
                      <span className="adm-bar-label">{d.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={<><CalendarOutlined /> Monthly Revenue Trend</>} size="small" className="adm-chart-card">
                <div className="adm-bar-chart" style={{ height: 150 }}>
                  {data.last6Months.map((m) => (
                    <div key={m.month} className="adm-bar-col">
                      <span className="adm-bar-value">₹{(m.revenue / 1000).toFixed(1)}k</span>
                      <div className="adm-bar adm-bar-blue" style={{ height: `${(m.revenue / data.maxMonthRev) * 100}%` }} />
                      <span className="adm-bar-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {/* Plan Revenue Breakdown */}
            <Col xs={24} md={8}>
              <Card title={<><CrownOutlined /> Revenue by Plan</>} size="small" className="adm-chart-card">
                {Object.entries(data.planMap).map(([plan, d]) => (
                  <div key={plan} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{plan}</Text>
                      <Text strong style={{ color: 'var(--text-primary)' }}>₹{d.revenue.toLocaleString()}</Text>
                    </div>
                    <Progress percent={data.totalRev ? Math.round((d.revenue / data.totalRev) * 100) : 0} strokeColor="#d97706" showInfo size="small" />
                    <Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>{d.count} customers</Text>
                  </div>
                ))}
              </Card>
            </Col>

            {/* Source Breakdown */}
            <Col xs={24} md={8}>
              <Card title={<><UsergroupAddOutlined /> Sales by Source</>} size="small" className="adm-chart-card">
                {[
                  { label: 'Partner Sales', value: data.partnerRev, color: '#16a34a', icon: <UsergroupAddOutlined /> },
                  { label: 'Team Sales', value: data.teamRev, color: '#2563eb', icon: <TeamOutlined /> },
                  { label: 'Website Sales', value: data.siteRev, color: '#d97706', icon: <GlobalOutlined /> },
                ].map((s) => (
                  <div key={s.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space size={6}><span style={{ color: s.color }}>{s.icon}</span><Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.label}</Text></Space>
                      <Text strong style={{ color: 'var(--text-primary)' }}>₹{s.value.toLocaleString()}</Text>
                    </div>
                    <Progress percent={data.totalRev ? Math.round((s.value / data.totalRev) * 100) : 0} strokeColor={s.color} showInfo size="small" />
                  </div>
                ))}
              </Card>
            </Col>

            {/* Pending Payments */}
            <Col xs={24} md={8}>
              <Card title={<><WarningOutlined style={{ color: 'var(--red)' }} /> Pending Payments ({data.pendingPayments.length})</>} size="small" className="adm-chart-card">
                {data.pendingPayments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Text style={{ color: 'var(--green)' }}>All payments cleared</Text>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.pendingPayments.slice(0, 6).map((p) => (
                      <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                          <Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{p.name}</Text>
                          <br /><Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>{p.vehicle}</Text>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div>
                            <Text strong style={{ color: 'var(--red)' }}>₹{p.amount}</Text>
                            <br /><Tag color="red" style={{ fontSize: 9 }}>{p.reason}</Tag>
                          </div>
                          <button
                            className="adm-btn-sm adm-btn-green"
                            title="Mark as Paid"
                            onClick={async () => {
                              await update(ref(db, `customers/${p.key}`), { status: 'Paid' })
                              await logAdminAction('payment_verified', p.key, p.vehicle, { amount: p.amount, previousStatus: p.reason })
                              toast.success(`${p.vehicle} marked as Paid`)
                              setCustomers((prev) => prev.map((c) => c.key === p.key ? { ...c, status: 'Paid' } : c))
                            }}
                          >✅</button>
                          <button
                            className="adm-btn-sm adm-btn-red"
                            title="Mark as Failed"
                            onClick={async () => {
                              await update(ref(db, `customers/${p.key}`), { status: 'Failed' })
                              await logAdminAction('payment_failed', p.key, p.vehicle, { amount: p.amount })
                              toast.error(`${p.vehicle} marked as Failed`)
                              setCustomers((prev) => prev.map((c) => c.key === p.key ? { ...c, status: 'Failed' } : c))
                            }}
                          >❌</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* ─── RECENT SALES ACTIVITY ─── */}
          <Card title={<><ClockCircleOutlined /> Recent Sales Activity</>} size="small" className="adm-chart-card">
            <div className="adm-desktop-only">
              <Table
                dataSource={data.tableData.slice(0, 8)}
                rowKey="key"
                size="small"
                pagination={false}
                scroll={{ x: 700 }}
                columns={[
                  { title: 'Time', dataIndex: 'timestamp', width: 140, render: (v) => (
                    <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                      {v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Text>
                  )},
                  { title: 'User (ID)', dataIndex: 'name', width: 180, render: (v, r) => (
                    <Space direction="vertical" size={0}>
                      <Text strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>{v}</Text>
                      <Text style={{ color: 'var(--text-dim)', fontSize: 10 }}>{r.generatedId}</Text>
                    </Space>
                  )},
                  { title: 'Plan', dataIndex: 'plan', width: 120, render: (v) => <Tag color={v === 'Lite Plan' ? 'default' : 'orange'}>{v}</Tag> },
                  { title: 'Source', dataIndex: 'coupon', width: 90, render: (v) => {
                    if (!v) return <Tag>Site</Tag>
                    if (v === 'WTRAK01') return <Tag color="blue">Team</Tag>
                    return <Tag color="green">{v}</Tag>
                  }},
                  { title: 'Amount', dataIndex: 'amount', width: 80, render: (v) => <Text strong style={{ color: 'var(--green)' }}>₹{v}</Text> },
                ]}
              />
            </div>
            <div className="adm-mobile-only">
              {data.tableData.slice(0, 8).map((c) => (
                <div key={c.key} className="adm-card" style={{ marginBottom: 8 }}>
                  <div className="adm-card-row adm-card-row-between">
                    <span className="adm-card-name">{c.name}</span>
                    <Tag color="green">₹{c.amount}</Tag>
                  </div>
                  <div className="adm-card-row adm-card-row-between">
                    <span className="adm-card-vehicle">{c.vehicle}</span>
                    <Tag color={c.plan === 'Lite Plan' ? 'default' : 'orange'}>{c.plan}</Tag>
                  </div>
                  <div className="adm-card-row adm-card-row-between adm-card-meta">
                    <span>{c.coupon || 'Site'}</span>
                    <span>{c.timestamp ? new Date(c.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                  </div>
                </div>
              ))}
              {data.tableData.length === 0 && <Empty description="No recent activity" />}
            </div>
          </Card>
        </>
      )}

      {/* ═══════ TABLE VIEW ═══════ */}
      {viewMode === 'table' && (
        <Card
          title={<><CrownOutlined /> {filterLabel[activeFilter]} Sales Entries ({data.tableData.length})</>}
          size="small"
          className="adm-chart-card"
        >
          <Input
            prefix={<ShoppingCartOutlined style={{ color: 'var(--text-dim)' }} />}
            placeholder="Search name, ID, vehicle, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ marginBottom: 12, background: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
          />

          {/* Desktop Table */}
          <div className="adm-desktop-only">
            <Table
              dataSource={data.tableData}
              rowKey="key"
              size="small"
              pagination={{ pageSize, showSizeChanger: true, pageSizeOptions: ['10', '50', '100'], onShowSizeChange: (_, s) => setPageSize(s) }}
              scroll={{ x: 1100 }}
              columns={[
                { title: 'User ID', dataIndex: 'generatedId', width: 100, fixed: 'left', render: (v) => <Text style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v}</Text> },
                { title: 'Name', dataIndex: 'name', width: 130, render: (v) => <Text strong style={{ color: 'var(--text-primary)' }}>{v}</Text> },
                { title: 'Mobile', dataIndex: 'mobile', width: 110 },
                { title: 'WhatsApp', dataIndex: 'whatsapp', width: 110, render: (v, r) => v || r.mobile || '—' },
                { title: 'Vehicle', dataIndex: 'vehicle', width: 130, render: (v) => <Text style={{ color: 'var(--accent)', fontWeight: 700 }}>{v}</Text> },
                { title: 'Plan', dataIndex: 'plan', width: 120, render: (v) => <Tag color={v === 'Lite Plan' ? 'default' : 'orange'}>{v}</Tag> },
                { title: 'Source', dataIndex: 'coupon', width: 80, render: (v) => {
                  if (!v) return <Tag>Site</Tag>
                  if (v === 'WTRAK01') return <Tag color="blue">Team</Tag>
                  return <Tag color="green">Partner</Tag>
                }},
                { title: 'Amount', dataIndex: 'amount', width: 80, render: (v) => <Text strong>₹{v}</Text> },
                { title: 'Payment ID', dataIndex: 'paymentId', width: 140, ellipsis: true, render: (v) => <Text style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-dim)' }}>{v || '—'}</Text> },
                { title: 'Date', dataIndex: 'timestamp', width: 90, render: (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—' },
              ]}
            />
          </div>

          {/* Mobile Cards */}
          <div className="adm-mobile-only">
            {data.tableData.slice(0, 20).map((c) => (
              <div key={c.key} className="adm-card" style={{ marginBottom: 8 }}>
                <div className="adm-card-row adm-card-row-between">
                  <span className="adm-card-name">{c.name}</span>
                  <Tag color="green">₹{c.amount}</Tag>
                </div>
                <div className="adm-card-row adm-card-row-between">
                  <span className="adm-card-vehicle">{c.vehicle}</span>
                  <Tag color={c.plan === 'Lite Plan' ? 'default' : 'orange'}>{c.plan}</Tag>
                </div>
                <div className="adm-card-row adm-card-meta">
                  <span>{c.mobile}</span>
                  <Divider type="vertical" />
                  <span>{c.whatsapp || c.mobile}</span>
                </div>
                <div className="adm-card-row adm-card-row-between adm-card-meta">
                  <span>{c.generatedId}</span>
                  <span>{c.coupon || 'Site'}</span>
                  <span>{c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                </div>
              </div>
            ))}
            {data.tableData.length === 0 && <Empty description="No sales found" />}
          </div>
        </Card>
      )}
    </div>
  )
}

export default SalesPanel
